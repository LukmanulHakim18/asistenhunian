import { sendEmail } from "@/lib/resend";
import { sendWhatsApp } from "@/lib/fonnte";
import {
  orderConfirmationEmail,
  orderConfirmedEmail,
  orderCompletedEmail,
} from "@/lib/email-templates";
import { createAdminClient } from "@/lib/supabase/server";
import type { Order, OrderItem, Profile } from "@/types/database";

type OrderWithItems = Order & { order_items: OrderItem[] };
type OrderWithOB = Order & {
  order_items: OrderItem[];
  ob_profile: Profile | null;
};

export type NotificationType =
  | "order_created"
  | "order_confirmed"
  | "order_completed";

async function logNotification(
  orderId: string,
  channel: string,
  recipient: string,
  type: string,
  status: string
) {
  const supabase = createAdminClient();
  await supabase.from("notification_log").insert({
    order_id: orderId,
    channel,
    recipient,
    type,
    status,
  });
}

export async function sendOrderCreatedNotification(orderId: string) {
  const supabase = createAdminClient();

  const { data: order } = (await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .single()) as { data: OrderWithItems | null };

  if (!order) return;

  // Notify customer
  const { subject, html } = orderConfirmationEmail(order);
  const emailResult = await sendEmail({
    to: order.customer_email,
    subject,
    html,
  });
  await logNotification(
    orderId,
    "email",
    order.customer_email,
    "order_created",
    emailResult.success ? "sent" : "failed"
  );

  const waMessage =
    `✅ Order *${order.order_number}* berhasil diterima!\n\n` +
    `Unit: ${order.unit_number}\n` +
    `Tanggal: ${order.requested_date}\n\n` +
    `OB akan segera menghubungi Anda untuk konfirmasi jadwal.\n` +
    `Cek status: ${process.env.NEXT_PUBLIC_BASE_URL}/order/${orderId}/track`;

  const waResult = await sendWhatsApp(order.customer_phone, waMessage);
  await logNotification(
    orderId,
    "whatsapp",
    order.customer_phone,
    "order_created",
    waResult.success ? "sent" : "failed"
  );

  // Notify all active OBs
  const { data: obs } = (await supabase
    .from("profiles")
    .select("phone")
    .eq("role", "ob")
    .eq("is_active", true)) as { data: { phone: string | null }[] | null };

  for (const ob of obs ?? []) {
    if (!ob.phone) continue;
    const obMessage =
      `🔔 *Order baru masuk!*\n\n` +
      `Order: *${order.order_number}*\n` +
      `Unit: ${order.unit_number}\n` +
      `Tanggal: ${order.requested_date}\n` +
      `Total: Rp ${order.total.toLocaleString("id-ID")}\n\n` +
      `Buka dashboard untuk konfirmasi.`;
    await sendWhatsApp(ob.phone, obMessage);
  }
}

export async function sendOrderConfirmedNotification(orderId: string) {
  const supabase = createAdminClient();

  const { data: order } = (await supabase
    .from("orders")
    .select("*, ob_profile:ob_id(full_name, phone)")
    .eq("id", orderId)
    .single()) as { data: OrderWithOB | null };

  if (!order) return;

  const obName = order.ob_profile?.full_name ?? "OB Rusun";

  const { subject, html } = orderConfirmedEmail(order, obName);
  const emailResult = await sendEmail({
    to: order.customer_email,
    subject,
    html,
  });
  await logNotification(
    orderId,
    "email",
    order.customer_email,
    "order_confirmed",
    emailResult.success ? "sent" : "failed"
  );

  const confirmedTime = order.confirmed_datetime
    ? new Date(order.confirmed_datetime).toLocaleString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Segera dikonfirmasi";

  const waMessage =
    `📅 Order *${order.order_number}* telah dijadwalkan!\n\n` +
    `OB: ${obName}\n` +
    `Waktu: ${confirmedTime}\n\n` +
    `Pastikan unit Anda siap. Sampai jumpa! 🧹`;

  const waResult = await sendWhatsApp(order.customer_phone, waMessage);
  await logNotification(
    orderId,
    "whatsapp",
    order.customer_phone,
    "order_confirmed",
    waResult.success ? "sent" : "failed"
  );
}

export async function sendOrderCompletedNotification(orderId: string) {
  const supabase = createAdminClient();

  const { data: order } = (await supabase
    .from("orders")
    .select("*, order_items(*), ob_profile:ob_id(full_name)")
    .eq("id", orderId)
    .single()) as { data: (OrderWithItems & { ob_profile: { full_name: string } | null }) | null };

  if (!order) return;

  const obName = order.ob_profile?.full_name ?? "OB Rusun";

  const { subject, html } = orderCompletedEmail(order, obName);
  const emailResult = await sendEmail({
    to: order.customer_email,
    subject,
    html,
  });
  await logNotification(
    orderId,
    "email",
    order.customer_email,
    "order_completed",
    emailResult.success ? "sent" : "failed"
  );

  const waMessage =
    `✨ Order *${order.order_number}* selesai!\n\n` +
    `Dikerjakan oleh: ${obName}\n` +
    `Total: Rp ${order.total.toLocaleString("id-ID")}\n\n` +
    `Invoice telah dikirim ke email Anda. Terima kasih! 😊`;

  const waResult = await sendWhatsApp(order.customer_phone, waMessage);
  await logNotification(
    orderId,
    "whatsapp",
    order.customer_phone,
    "order_completed",
    waResult.success ? "sent" : "failed"
  );
}
