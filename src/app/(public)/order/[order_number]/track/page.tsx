import { ordersApi } from "@/lib/api/orders";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatCurrency, formatDate, formatDateTime, ORDER_STATUS_LABEL } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/ob/OrderStatusBadge";
import { Separator } from "@/components/ui/separator";
import { PaymentButton } from "@/components/order/PaymentButton";
import { QrisPayment } from "@/components/order/QrisPayment";
import { CancelOrderButton } from "@/components/order/CancelOrderButton";
import { ItemReviewForm } from "@/components/order/ItemReviewForm";
import type { Order, OrderStatus } from "@/lib/api/types";
import { CheckCircle, Clock, Loader, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  confirmed: <CheckCircle className="h-4 w-4 text-blue-500" />,
  in_progress: <Loader className="h-4 w-4 text-purple-500 animate-spin" />,
  completed: <CheckCircle className="h-4 w-4 text-green-500" />,
  cancelled: <XCircle className="h-4 w-4 text-red-500" />,
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash: "Cash ke OB",
  transfer: "Transfer Online",
  qris: "QRIS",
};

export default async function OrderTrackPage({
  params,
}: {
  params: Promise<{ order_number: string }>;
}) {
  const { order_number } = await params;

  // Fetch parallel: public track (items + status_history) + authenticated list (full fields)
  const [trackResult, listResult] = await Promise.allSettled([
    ordersApi.track(order_number),
    ordersApi.list(),
  ]);

  const trackData = trackResult.status === "fulfilled" ? trackResult.value : null;

  // Require login — redirect jika belum autentikasi
  if (listResult.status !== "fulfilled") {
    redirect(`/login?next=/order/${encodeURIComponent(order_number)}/track`);
  }

  // Verifikasi kepemilikan — 404 jika order bukan milik user ini
  const authOrder = listResult.value.find((o) => o.order_number === order_number) ?? null;
  if (!authOrder) notFound();

  // Track endpoint sudah include items[].review — tidak perlu detail fetch terpisah
  const order: Order = {
    ...(trackData ?? ({} as Order)),
    ...authOrder,
    items: trackData?.items ?? authOrder.items,
    status_history: trackData?.status_history ?? authOrder.status_history,
  } as Order;

  const items = Array.isArray(order.items) ? order.items : [];
  const itemsSubtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const platformFee = order.platform_fee ?? 0;
  const total = order.total ?? itemsSubtotal;

  const unpaidAndActive =
    order.payment_status === "unpaid" &&
    order.status !== "cancelled" &&
    !!order.midtrans_payment_url;

  const showQris = order.payment_method === "qris" && unpaidAndActive;
  const showPayButton = order.payment_method === "transfer" && unpaidAndActive;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Status Order</h1>
            <p className="font-mono text-muted-foreground">{order.order_number}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {/* Status Timeline */}
      {order.status_history && order.status_history.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Riwayat Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {order.status_history.map((h, idx) => (
                <div key={h.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="mt-0.5">{STATUS_ICONS[h.new_status]}</div>
                    {idx < (order.status_history!.length - 1) && (
                      <div className="w-px flex-1 bg-border my-1" />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="font-medium text-sm">
                      {ORDER_STATUS_LABEL[h.new_status]}
                    </p>
                    {h.notes && (
                      <p className="text-sm text-muted-foreground">{h.notes}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(h.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Details */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Detail Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-1 text-sm">
            <span className="text-muted-foreground">Nama</span>
            <span className="font-medium">{order.customer_name}</span>
            {order.unit_number && (
              <>
                <span className="text-muted-foreground">Nomor Unit</span>
                <span className="font-medium">{order.unit_number}</span>
              </>
            )}
            <span className="text-muted-foreground">Tanggal Diinginkan</span>
            <span className="font-medium">{formatDate(order.requested_date)}</span>
            {order.confirmed_datetime && (
              <>
                <span className="text-muted-foreground">Jadwal Pasti</span>
                <span className="font-medium">{formatDateTime(order.confirmed_datetime)}</span>
              </>
            )}
            <span className="text-muted-foreground">Pembayaran</span>
            <span className="font-medium">
              {PAYMENT_METHOD_LABEL[order.payment_method ?? ""] ?? "—"}
              {" · "}
              <span className={order.payment_status === "paid" ? "text-green-600" : "text-orange-600"}>
                {order.payment_status === "paid" ? "Lunas" : "Belum dibayar"}
              </span>
            </span>
          </div>

          {items.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2 text-sm">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.service_name} × {item.quantity}</span>
                    <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
                {platformFee > 0 && (
                  <>
                    <div className="flex justify-between text-muted-foreground border-t pt-1">
                      <span>Subtotal</span>
                      <span>{formatCurrency(itemsSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Platform Fee</span>
                      <span>{formatCurrency(platformFee)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-bold pt-1 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cancel Reason */}
      {order.cancel_reason && (
        <Card className="mb-4 border-destructive/30">
          <CardContent className="pt-4 text-sm">
            <p className="text-muted-foreground">
              Alasan pembatalan:{" "}
              <span className="text-foreground font-medium">{order.cancel_reason}</span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* QRIS Display */}
      {showQris && <QrisPayment qrUrl={order.midtrans_payment_url!} />}

      {/* Transfer Payment Button */}
      {showPayButton && <PaymentButton paymentUrl={order.midtrans_payment_url!} />}

      {/* Cancel Button */}
      {order.status === "pending" && order.id && (
        <div className="mb-4">
          <CancelOrderButton orderId={order.id} orderNumber={order.order_number} />
        </div>
      )}

      {/* Review per item */}
      {order.status === "completed" && order.id && items.some((i) => i.status === "completed") && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Review Layanan</CardTitle>
            <p className="text-sm text-muted-foreground">Bagaimana pengalaman tiap layanan?</p>
          </CardHeader>
          <CardContent className="divide-y px-6 py-0">
            {items
              .filter((i) => i.status === "completed")
              .map((item) => (
                <ItemReviewForm key={item.id} orderId={order.id!} item={item} />
              ))}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 mt-4">
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline", className: "flex-1" }))}
        >
          Kembali ke Beranda
        </Link>
        <Link
          href="/order"
          className={cn(buttonVariants({ className: "flex-1" }))}
        >
          Pesan Lagi
        </Link>
      </div>
    </div>
  );
}
