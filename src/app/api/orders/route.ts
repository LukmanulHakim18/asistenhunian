import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { sendOrderCreatedNotification } from "@/lib/notifications";
import { rateLimit } from "@/lib/rate-limit";

const orderItemSchema = z.object({
  serviceId: z.string().uuid(),
  serviceName: z.string().min(1),
  servicePrice: z.number().positive(),
  quantity: z.number().int().positive().max(10),
});

const createOrderSchema = z.object({
  customerName: z.string().min(2).max(100),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(9).max(15),
  unitNumber: z.string().min(1).max(20),
  requestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferredTimeNote: z.string().max(500).optional(),
  paymentMethod: z.enum(["cash", "transfer"]),
  items: z.array(orderItemSchema).min(1).max(20),
});

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  if (!rateLimit(`orders:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi dalam 1 jam." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      customerName,
      customerEmail,
      customerPhone,
      unitNumber,
      requestedDate,
      preferredTimeNote,
      paymentMethod,
      items,
    } = parsed.data;

    // Validate requested_date is in the future
    const reqDate = new Date(requestedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (reqDate <= today) {
      return NextResponse.json(
        { error: "Tanggal harus minimal hari esok" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if customer is logged in
    const { data: { user } } = await supabase.auth.getUser();

    // Generate order number
    const { data: orderNumber } = await supabase.rpc("generate_order_number");

    const subtotal = items.reduce(
      (sum, item) => sum + item.servicePrice * item.quantity,
      0
    );

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber as string,
        customer_id: user?.id ?? null,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        unit_number: unitNumber,
        requested_date: requestedDate,
        preferred_time_note: preferredTimeNote ?? null,
        payment_method: paymentMethod,
        subtotal,
        total: subtotal,
        status: "pending",
        payment_status: "unpaid",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("Order insert error:", orderError);
      return NextResponse.json(
        { error: "Gagal membuat order" },
        { status: 500 }
      );
    }

    // Insert order items
    const { error: itemsError } = await supabase.from("order_items").insert(
      items.map((item) => ({
        order_id: order.id,
        service_id: item.serviceId,
        service_name: item.serviceName,
        service_price: item.servicePrice,
        quantity: item.quantity,
        subtotal: item.servicePrice * item.quantity,
      }))
    );

    if (itemsError) {
      console.error("Order items insert error:", itemsError);
      // Rollback order
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "Gagal menyimpan detail order" },
        { status: 500 }
      );
    }

    // Insert initial status history
    await supabase.from("order_status_history").insert({
      order_id: order.id,
      old_status: null,
      new_status: "pending",
      changed_by: user?.id ?? null,
    });

    // Send notifications (non-blocking — don't fail order if notif fails)
    sendOrderCreatedNotification(order.id).catch((err) =>
      console.error("[Notification] order_created failed:", err)
    );

    return NextResponse.json(
      { orderId: order.id, orderNumber },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
