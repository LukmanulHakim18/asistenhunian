import { createClient } from "@/lib/supabase/server";
import { OBOrderCard } from "@/components/ob/OBOrderCard";
import type { OrderItem, OrderStatus } from "@/types/database";

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  unit_number: string;
  requested_date: string;
  preferred_time_note: string | null;
  status: OrderStatus;
  payment_method: string;
  payment_status: string;
  total: number;
  customer_notes: string | null;
  ob_notes: string | null;
  order_items: OrderItem[];
}

export default async function OBOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: activeOrders }, { data: completedOrders }] = await Promise.all([
    supabase
      .from("orders")
      .select("*, order_items(*)")
      .in("status", ["pending", "confirmed", "in_progress"])
      .order("requested_date", { ascending: true })
      .returns<OrderRow[]>(),
    supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("status", "completed")
      .eq("ob_id", user?.id ?? "")
      .order("requested_date", { ascending: false })
      .limit(20)
      .returns<OrderRow[]>(),
  ]);

  const pendingOrders = activeOrders?.filter((o) => o.status === "pending") ?? [];
  const ongoingOrders = activeOrders?.filter((o) => o.status !== "pending") ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Daftar Order</h1>
        <p className="text-muted-foreground">{activeOrders?.length ?? 0} order aktif</p>
      </div>

      {pendingOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Menunggu Konfirmasi ({pendingOrders.length})</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pendingOrders.map((order) => (
              <OBOrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {ongoingOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Dikonfirmasi & Sedang Dikerjakan ({ongoingOrders.length})</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {ongoingOrders.map((order) => (
              <OBOrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {activeOrders?.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-4xl mb-4">🎉</p>
          <p>Tidak ada order aktif saat ini.</p>
        </div>
      )}

      {/* Completed Orders */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Order Selesai ({completedOrders?.length ?? 0})</h2>
        {completedOrders?.length === 0 ? (
          <p className="text-muted-foreground text-sm">Belum ada order selesai.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {completedOrders?.map((order) => (
              <OBOrderCard key={order.id} order={order} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
