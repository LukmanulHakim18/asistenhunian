import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { OBOrderCard } from "@/components/ob/OBOrderCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import type { OrderItem, OrderStatus, OrderStatusHistory } from "@/types/database";

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  unit_number: string;
  requested_date: string;
  confirmed_datetime: string | null;
  preferred_time_note: string | null;
  status: OrderStatus;
  payment_method: string;
  payment_status: string;
  total: number;
  customer_notes: string | null;
  ob_notes: string | null;
  order_items: OrderItem[];
}

export default async function OBOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .returns<OrderRow[]>()
    .single();

  if (!order) notFound();

  const { data: history } = await supabase
    .from("order_status_history")
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: true })
    .returns<OrderStatusHistory[]>();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Detail Order</h1>
        <p className="text-sm text-muted-foreground font-mono">
          {order.order_number}
        </p>
      </div>

      <OBOrderCard order={order} />

      {/* Status History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {history?.map((h) => (
              <div key={h.id} className="flex gap-3 text-sm">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                  <div className="w-px flex-1 bg-border" />
                </div>
                <div className="pb-3">
                  <p className="font-medium">{h.new_status}</p>
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
    </div>
  );
}
