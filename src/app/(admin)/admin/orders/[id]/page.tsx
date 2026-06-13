import { adminApi } from "@/lib/api/admin";
import { ordersApi } from "@/lib/api/orders";
import { AdminOrderDetail } from "@/components/admin/AdminOrderDetail";
import { notFound } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/ob/OrderStatusBadge";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [order, obList] = await Promise.all([
    ordersApi.detail(id).catch(() => null),
    adminApi.listOB().catch(() => []),
  ]);

  if (!order) notFound();

  const paymentLogs = await adminApi.getPaymentLogs(id).catch(() => []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/orders"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Kembali
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold font-mono">{order.order_number}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground">{order.customer_name} · Unit {order.unit_number}</p>
        </div>
      </div>

      <AdminOrderDetail order={order} obList={obList} paymentLogs={paymentLogs} />
    </div>
  );
}
