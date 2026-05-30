import { ordersApi } from "@/lib/api/orders";
import { notFound } from "next/navigation";
import { OBOrderCard } from "@/components/ob/OBOrderCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, ORDER_STATUS_LABEL } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OBOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await ordersApi.detail(id).catch(() => null);
  if (!order) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Detail Order</h1>
        <p className="text-sm text-muted-foreground font-mono">{order.order_number}</p>
      </div>

      <OBOrderCard order={order} />

      {/* Status History */}
      {order.status_history && order.status_history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Riwayat Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.status_history.map((h) => (
                <div key={h.id} className="flex gap-3 text-sm">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                    <div className="w-px flex-1 bg-border" />
                  </div>
                  <div className="pb-3">
                    <p className="font-medium">{ORDER_STATUS_LABEL[h.new_status]}</p>
                    {h.notes && (
                      <p className="text-muted-foreground">{h.notes}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(h.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
