import { createClient } from "@/lib/supabase/server";
import { AdminOrdersTable } from "@/components/admin/AdminOrdersTable";
import type { Order, OrderItem, Profile } from "@/types/database";

type OrderWithDetails = Order & {
  order_items: OrderItem[];
  ob: Pick<Profile, "id" | "full_name"> | null;
};

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*), ob:ob_id(id, full_name)")
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<OrderWithDetails[]>();

  const { data: obList } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "ob")
    .eq("is_active", true)
    .returns<Pick<Profile, "id" | "full_name">[]>();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Semua Order</h1>
      <AdminOrdersTable orders={orders ?? []} obList={obList ?? []} />
    </div>
  );
}
