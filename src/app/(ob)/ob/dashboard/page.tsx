import { ordersApi } from "@/lib/api/orders";
import { OBOrderCard } from "@/components/ob/OBOrderCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function OBDashboardPage() {
  const orders = await ordersApi.list().catch(() => []);

  const today = new Date().toISOString().split("T")[0];
  const activeStatuses = ["pending", "confirmed", "in_progress"] as const;

  const todayOrders = orders.filter(
    (o) => o.requested_date === today && activeStatuses.includes(o.status as typeof activeStatuses[number]),
  );

  const pendingOrders = orders
    .filter((o) => o.status === "pending")
    .sort((a, b) => a.requested_date.localeCompare(b.requested_date))
    .slice(0, 5);

  const completedCount = orders.filter((o) => o.status === "completed").length;
  const confirmedCount = orders.filter((o) => o.status === "confirmed").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard OB</h1>
        <p className="text-muted-foreground">Selamat datang! Pantau order hari ini.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Order Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{todayOrders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dijadwalkan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{confirmedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Selesai Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{completedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Orders */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Order Hari Ini</h2>
        {todayOrders.length === 0 ? (
          <p className="text-muted-foreground">Tidak ada order untuk hari ini.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {todayOrders.map((order) => (
              <OBOrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>

      {/* Pending Orders */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Order Menunggu Konfirmasi</h2>
        {pendingOrders.length === 0 ? (
          <p className="text-muted-foreground">Tidak ada order yang menunggu.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pendingOrders.map((order) => (
              <OBOrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
