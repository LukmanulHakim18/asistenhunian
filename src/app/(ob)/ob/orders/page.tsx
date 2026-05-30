import { ordersApi } from "@/lib/api/orders";
import { OBOrderCard } from "@/components/ob/OBOrderCard";

export const dynamic = "force-dynamic";

export default async function OBOrdersPage() {
  const orders = await ordersApi.list().catch(() => []);

  const activeOrders = orders.filter((o) =>
    ["pending", "confirmed", "in_progress"].includes(o.status),
  );
  const completedOrders = orders
    .filter((o) => o.status === "completed")
    .sort((a, b) => b.requested_date.localeCompare(a.requested_date))
    .slice(0, 20);

  const pendingOrders = activeOrders.filter((o) => o.status === "pending");
  const ongoingOrders = activeOrders.filter((o) => o.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Daftar Order</h1>
        <p className="text-muted-foreground">{activeOrders.length} order aktif</p>
      </div>

      {pendingOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">
            Menunggu Konfirmasi ({pendingOrders.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pendingOrders.map((order) => (
              <OBOrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {ongoingOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">
            Dikonfirmasi & Sedang Dikerjakan ({ongoingOrders.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {ongoingOrders.map((order) => (
              <OBOrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {activeOrders.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-4xl mb-4">🎉</p>
          <p>Tidak ada order aktif saat ini.</p>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">
          Order Selesai ({completedOrders.length})
        </h2>
        {completedOrders.length === 0 ? (
          <p className="text-muted-foreground text-sm">Belum ada order selesai.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {completedOrders.map((order) => (
              <OBOrderCard key={order.id} order={order} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
