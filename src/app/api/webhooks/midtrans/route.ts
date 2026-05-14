import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyMidtransSignature } from "@/lib/midtrans";

interface MidtransNotification {
  order_id: string;
  transaction_status: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  fraud_status?: string;
}

export async function POST(request: NextRequest) {
  const body = await request.json() as MidtransNotification;

  const { order_id, transaction_status, status_code, gross_amount, signature_key } = body;

  // Verify signature
  const isValid = verifyMidtransSignature(
    order_id,
    status_code,
    gross_amount,
    signature_key
  );

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Find order by order_number (Midtrans uses order_id = our order_number)
  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("order_number", order_id)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const isPaid =
    transaction_status === "settlement" ||
    (transaction_status === "capture" && body.fraud_status === "accept");

  if (isPaid) {
    await supabase
      .from("orders")
      .update({ payment_status: "paid" } as object)
      .eq("id", order.id);
  } else if (
    transaction_status === "expire" ||
    transaction_status === "cancel" ||
    transaction_status === "deny"
  ) {
    await supabase
      .from("orders")
      .update({ payment_status: "unpaid" } as object)
      .eq("id", order.id);
  }

  return NextResponse.json({ status: "ok" });
}
