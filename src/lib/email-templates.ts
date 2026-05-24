import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order, OrderItem } from "@/types/database";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
    .header { background: #1a1a2e; color: white; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; }
    .body { padding: 24px; }
    .label { color: #666; font-size: 14px; }
    .value { font-weight: bold; font-size: 14px; }
    table.items { width: 100%; border-collapse: collapse; margin: 16px 0; }
    table.items th { background: #f4f4f4; padding: 8px 12px; text-align: left; font-size: 13px; }
    table.items td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
    .total-row td { font-weight: bold; border-top: 2px solid #333; }
    .btn { display: inline-block; background: #1a1a2e; color: white !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }
    .footer { background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Asisten Hunian</h1></div>
    <div class="body">${content}</div>
    <div class="footer">Terima kasih telah menggunakan layanan kami.</div>
  </div>
</body>
</html>`;
}

export function orderConfirmationEmail(
  order: Order & { order_items: OrderItem[] }
): { subject: string; html: string } {
  const itemRows = order.order_items
    .map(
      (item) =>
        `<tr><td>${item.service_name} × ${item.quantity}</td><td style="text-align:right">${formatCurrency(item.subtotal)}</td></tr>`
    )
    .join("");

  const html = emailWrapper(`
    <h2>Order Berhasil Diterima!</h2>
    <p>Halo <strong>${order.customer_name}</strong>, order Anda telah masuk dan sedang menunggu konfirmasi OB.</p>
    <table style="width:100%;margin-bottom:16px">
      <tr><td class="label">Nomor Order</td><td class="value">${order.order_number}</td></tr>
      <tr><td class="label">Nomor Unit</td><td class="value">${order.unit_number}</td></tr>
      <tr><td class="label">Tanggal</td><td class="value">${formatDate(order.requested_date)}</td></tr>
      <tr><td class="label">Pembayaran</td><td class="value">${order.payment_method === "cash" ? "Cash ke OB" : "Transfer Online"}</td></tr>
    </table>
    <table class="items">
      <tr><th>Layanan</th><th style="text-align:right">Harga</th></tr>
      ${itemRows}
      <tr class="total-row"><td>Total</td><td style="text-align:right">${formatCurrency(order.total)}</td></tr>
    </table>
    <a href="${BASE_URL}/order/${order.id}/track" class="btn">Pantau Status Order</a>
    <p style="color:#666;font-size:14px">OB akan segera menghubungi Anda via WhatsApp untuk konfirmasi jadwal.</p>
  `);

  return { subject: `✅ Order ${order.order_number} Berhasil Diterima`, html };
}

export function orderConfirmedEmail(
  order: Order,
  obName: string
): { subject: string; html: string } {
  const confirmedTime = order.confirmed_datetime
    ? new Date(order.confirmed_datetime).toLocaleString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Akan dikonfirmasi";

  const html = emailWrapper(`
    <h2>Order Anda Telah Dijadwalkan!</h2>
    <p>Halo <strong>${order.customer_name}</strong>, OB kami telah mengkonfirmasi order Anda.</p>
    <table style="width:100%;margin-bottom:16px">
      <tr><td class="label">Nomor Order</td><td class="value">${order.order_number}</td></tr>
      <tr><td class="label">OB yang Bertugas</td><td class="value">${obName}</td></tr>
      <tr><td class="label">Waktu Pelaksanaan</td><td class="value">${confirmedTime}</td></tr>
      <tr><td class="label">Nomor Unit</td><td class="value">${order.unit_number}</td></tr>
    </table>
    <a href="${BASE_URL}/order/${order.id}/track" class="btn">Pantau Status Order</a>
    <p style="color:#666;font-size:14px">Pastikan unit Anda siap pada waktu yang telah dijadwalkan.</p>
  `);

  return { subject: `📅 Order ${order.order_number} Telah Dijadwalkan`, html };
}

export function orderCompletedEmail(
  order: Order & { order_items: OrderItem[] },
  obName: string
): { subject: string; html: string } {
  const itemRows = order.order_items
    .map(
      (item) =>
        `<tr><td>${item.service_name} × ${item.quantity}</td><td style="text-align:right">${formatCurrency(item.subtotal)}</td></tr>`
    )
    .join("");

  const paymentSection =
    order.payment_method === "transfer" && order.payment_status === "unpaid"
      ? `<p style="background:#fff3cd;padding:12px;border-radius:6px;color:#856404">
          ⚠️ <strong>Pembayaran belum diselesaikan.</strong>
          <a href="${BASE_URL}/order/${order.id}/track" style="color:#856404">Klik di sini untuk membayar.</a>
        </p>`
      : "";

  const html = emailWrapper(`
    <h2>✨ Order Selesai!</h2>
    <p>Halo <strong>${order.customer_name}</strong>, layanan Anda telah selesai dikerjakan oleh <strong>${obName}</strong>.</p>
    <table class="items">
      <tr><th>Layanan</th><th style="text-align:right">Harga</th></tr>
      ${itemRows}
      <tr class="total-row"><td>Total</td><td style="text-align:right">${formatCurrency(order.total)}</td></tr>
    </table>
    ${paymentSection}
    <p style="color:#666;font-size:14px">Invoice ini adalah bukti pekerjaan yang telah diselesaikan.</p>
    <a href="${BASE_URL}/order/${order.id}/track" class="btn">Lihat Detail Order</a>
  `);

  return {
    subject: `✨ Order ${order.order_number} Selesai — Invoice`,
    html,
  };
}
