import { createClient } from "@/lib/supabase/server";
import { OBOrderCard } from "@/components/ob/OBOrderCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default async function OBDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().split("T")[0];

  // Today's orders for this OB
  const { data: todayOrders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("requested_date", today)
    .in("status", ["pending", "confirmed", "in_progress"])
    .returns<OrderRow[]>();

  // Pending orders (unassigned or assigned to this OB)
  const { data: pendingOrders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("status", "pending")
    .order("requested_date", { ascending: true })
    .limit(5)
    .returns<OrderRow[]>();

  // Stats
  const { count: completedCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("ob_id", user?.id ?? "")
    .eq("status", "completed");

  const { count: confirmedCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("ob_id", user?.id ?? "")
    .eq("status", "confirmed");

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
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Order Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{todayOrders?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dijadwalkan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{confirmedCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Selesai Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{completedCount ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Orders */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Order Hari Ini</h2>
        {todayOrders?.length === 0 ? (
          <p className="text-muted-foreground">Tidak ada order untuk hari ini.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {todayOrders?.map((order) => (
              <OBOrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>

      {/* Pending Orders */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Order Menunggu Konfirmasi</h2>
        {pendingOrders?.length === 0 ? (
          <p className="text-muted-foreground">Tidak ada order yang menunggu.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pendingOrders?.map((order) => (
              <OBOrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
