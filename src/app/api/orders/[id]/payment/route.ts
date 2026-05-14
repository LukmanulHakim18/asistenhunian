import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createSnapTransaction } from "@/lib/midtrans";
import type { Order, OrderItem } from "@/types/database";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: order } = (await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single()) as { data: (Order & { order_items: OrderItem[] }) | null };

  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
  }

  if (order.payment_method !== "transfer") {
    return NextResponse.json({ error: "Order ini menggunakan metode cash" }, { status: 400 });
  }

  if (order.payment_status === "paid") {
    return NextResponse.json({ error: "Order sudah dibayar" }, { status: 400 });
  }

  if (order.status === "cancelled") {
    return NextResponse.json({ error: "Order dibatalkan" }, { status: 400 });
  }

  // If already has payment URL, return existing
  if (order.midtrans_payment_url) {
    return NextResponse.json({
      paymentUrl: order.midtrans_payment_url,
      token: order.midtrans_transaction_id,
    });
  }

  const snapResult = await createSnapTransaction({
    orderId: order.id,
    orderNumber: order.order_number,
    grossAmount: order.total,
    items: order.order_items.map((item) => ({
      id: item.service_id ?? item.id,
      price: item.service_price,
      quantity: item.quantity,
      name: item.service_name,
    })),
    customer: {
      first_name: order.customer_name,
      email: order.customer_email,
      phone: order.customer_phone,
    },
  });

  if (!snapResult) {
    return NextResponse.json({ error: "Gagal membuat transaksi pembayaran" }, { status: 500 });
  }

  // Save token and URL to order
  await supabase
    .from("orders")
    .update({
      midtrans_transaction_id: snapResult.token,
      midtrans_payment_url: snapResult.redirect_url,
    } as object)
    .eq("id", id);

  return NextResponse.json({
    paymentUrl: snapResult.redirect_url,
    token: snapResult.token,
  });
}
