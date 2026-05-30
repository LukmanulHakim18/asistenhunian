import { ordersApi } from "@/lib/api/orders";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Banknote, CreditCard, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OBEarningsPage() {
  const orders = await ordersApi.list().catch(() => []);
  const completedOrders = orders.filter((o) => o.status === "completed");

  const totalEarnings = completedOrders.reduce((sum, o) => sum + o.total, 0);
  const cashOrders = completedOrders.filter((o) => o.payment_method === "cash");
  const transferOrders = completedOrders.filter((o) => o.payment_method !== "cash");
  const cashTotal = cashOrders.reduce((sum, o) => sum + o.total, 0);
  const transferTotal = transferOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Penghasilan Saya</h1>
        <p className="text-muted-foreground">
          Ringkasan dari {completedOrders.length} order selesai
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Penghasilan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalEarnings)}</p>
            <p className="text-xs text-muted-foreground mt-1">{completedOrders.length} order</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Banknote className="h-4 w-4 text-green-600" />
              Cash (Bayar Langsung)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(cashTotal)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {cashOrders.length} order · uang diterima langsung
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              Transfer Online
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(transferTotal)}</p>
            <p className="text-xs text-muted-foreground mt-1">{transferOrders.length} order</p>
          </CardContent>
        </Card>
      </div>

      {/* Order History */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Riwayat Order Selesai</h2>
        {completedOrders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-3">💰</p>
            <p>Belum ada order selesai.</p>
            <p className="text-sm mt-1">Selesaikan order untuk melihat penghasilan di sini.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {completedOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-background"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {order.order_number}
                    </span>
                    <Badge
                      variant={order.payment_method === "cash" ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {order.payment_method === "cash" ? "Cash" : "Transfer"}
                    </Badge>
                  </div>
                  <p className="font-medium text-sm mt-0.5 truncate">
                    {order.customer_name} — Unit {order.unit_number}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(order.requested_date)}
                  </p>
                </div>
                <p className="font-bold text-primary ml-4 shrink-0">
                  {formatCurrency(order.total)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
