"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { updateItemStatusAction } from "@/lib/actions/orders";
import type { Order, OrderItem, OrderItemStatus } from "@/lib/api/types";

const ITEM_STATUS_LABEL: Record<OrderItemStatus, string> = {
  pending: "Menunggu",
  in_progress: "Sedang Dikerjakan",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const ITEM_STATUS_COLOR: Record<OrderItemStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function ItemStatusRow({ orderId, item }: { orderId: string; item: OrderItem }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const updateStatus = (newStatus: OrderItemStatus) => {
    startTransition(async () => {
      try {
        await updateItemStatusAction(orderId, item.id, newStatus);
        toast.success(`${item.service_name}: ${ITEM_STATUS_LABEL[newStatus]}`);
        router.refresh();
      } catch {
        toast.error("Gagal update status item");
      }
    });
  };

  const isDone = item.status === "completed" || item.status === "cancelled";

  return (
    <div className="py-2 border-b last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium">{item.service_name} × {item.quantity}</p>
          <p className="text-xs text-muted-foreground">{formatCurrency(item.subtotal)}</p>
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${ITEM_STATUS_COLOR[item.status]}`}>
            {ITEM_STATUS_LABEL[item.status]}
          </span>
          {item.notes && (
            <p className="text-xs text-muted-foreground mt-1 italic">{item.notes}</p>
          )}
        </div>
        {!isDone && (
          <div className="flex gap-1 shrink-0">
            {item.status === "pending" && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatus("in_progress")} disabled={isPending}>
                Mulai
              </Button>
            )}
            {item.status === "in_progress" && (
              <Button size="sm" className="h-7 text-xs" onClick={() => updateStatus("completed")} disabled={isPending}>
                Selesai ✓
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  order: Order;
  compact?: boolean;
}

export function OBOrderCard({ order, compact = false }: Props) {
  const myItems = order.items ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold font-mono text-sm">{order.order_number}</p>
            <p className="font-semibold">{order.customer_name}</p>
            <p className="text-sm text-muted-foreground">Unit {order.unit_number}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      </CardHeader>

      {!compact && (
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-1">
            <span className="text-muted-foreground">Tanggal</span>
            <span>{formatDate(order.requested_date)}</span>
            {order.preferred_time_note && (
              <>
                <span className="text-muted-foreground">Preferensi Waktu</span>
                <span>{order.preferred_time_note}</span>
              </>
            )}
            <span className="text-muted-foreground">WA</span>
            <a
              href={`https://wa.me/62${order.customer_phone.replace(/^0/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {order.customer_phone}
            </a>
            <span className="text-muted-foreground">Pembayaran</span>
            <span className="capitalize">
              {order.payment_method === "cash" ? "Cash" : "Transfer"}
            </span>
          </div>

          {order.notes && (
            <div className="bg-muted rounded p-2 text-xs">
              <span className="font-medium">Catatan:</span> {order.notes}
            </div>
          )}

          {myItems.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Item Tugas Saya</p>
                {myItems.map((item) => (
                  <ItemStatusRow key={item.id} orderId={order.id} item={item} />
                ))}
              </div>
              <div className="flex justify-between font-bold pt-1">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </>
          )}
        </CardContent>
      )}

      {compact && (
        <CardContent className="py-2 text-sm">
          <p className="text-muted-foreground">{formatDate(order.requested_date)}</p>
          <p className="font-medium">{formatCurrency(order.total)}</p>
        </CardContent>
      )}
    </Card>
  );
}
