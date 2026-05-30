import { ordersApi } from "@/lib/api/orders";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/ob/OrderStatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash: "Cash ke OB",
  transfer: "Transfer Online",
  qris: "QRIS",
};

export default async function CustomerDashboardPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get("token")?.value) redirect("/login?next=/dashboard");

  const orders = await ordersApi.list().catch(() => []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Riwayat Order Saya</h1>
        <Link href="/order" className={cn(buttonVariants({ size: "sm" }))}>
          Pesan Baru
        </Link>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Belum ada order.</p>
            <Link href="/order" className={cn(buttonVariants())}>
              Buat Order Pertama
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-medium">{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(order.requested_date)}
                    </p>
                    <p className="text-sm font-semibold mt-1">{formatCurrency(order.total)}</p>
                    <p className="text-xs text-muted-foreground">
                      {PAYMENT_METHOD_LABEL[order.payment_method] ?? order.payment_method}
                      {" · "}
                      <span className={order.payment_status === "paid" ? "text-green-600" : "text-orange-600"}>
                        {order.payment_status === "paid" ? "Lunas" : "Belum dibayar"}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <OrderStatusBadge status={order.status} />
                    <Link
                      href={`/order/${order.order_number}/track`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Detail
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
