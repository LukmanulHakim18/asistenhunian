import { ordersApi } from "@/lib/api/orders";
import { notFound } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ order_number: string }>;
}) {
  const { order_number } = await params;
  const order = await ordersApi.track(order_number).catch(() => null);
  if (!order) notFound();

  return (
    <div className="container mx-auto px-4 py-12 max-w-lg">
      <div className="text-center mb-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Order Berhasil Dibuat!</h1>
        <p className="text-muted-foreground mt-2">
          OB akan segera menghubungi Anda untuk konfirmasi jadwal via WhatsApp.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Detail Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nomor Order</span>
            <span className="font-bold font-mono">{order.order_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tanggal Diinginkan</span>
            <span className="font-medium">{formatDate(order.requested_date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Unit</span>
            <span className="font-medium">{order.unit_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pembayaran</span>
            <span className="font-medium">
              {order.payment_method === "cash" ? "Cash ke OB" : "Transfer Online"}
            </span>
          </div>

          {order.items && order.items.length > 0 && (
            <>
              <hr />
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.service_name} × {item.quantity}</span>
                  <span>{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
              <hr />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Link
          href={`/order/${order.order_number}/track`}
          className={cn(buttonVariants({ className: "w-full" }))}
        >
          Pantau Status Order
        </Link>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline", className: "w-full" }))}
        >
          Kembali ke Beranda
        </Link>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Konfirmasi telah dikirim ke <strong>{order.customer_email}</strong>
      </p>
    </div>
  );
}
