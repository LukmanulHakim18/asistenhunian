import { adminApi } from "@/lib/api/admin";
import { AdminOrdersTable } from "@/components/admin/AdminOrdersTable";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await adminApi.listOrders().catch(() => []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Semua Order</h1>
      <AdminOrdersTable orders={orders} />
    </div>
  );
}
