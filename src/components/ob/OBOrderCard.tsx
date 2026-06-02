"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { updateOrderStatusAction } from "@/lib/actions/orders";
import type { Order, OrderStatus } from "@/lib/api/types";

interface Props {
  order: Order;
  compact?: boolean;
}

export function OBOrderCard({ order, compact = false }: Props) {
  const [isPending, startTransition] = useTransition();
  const [obNotes, setObNotes] = useState(order.ob_notes ?? "");
  const [showConfirmForm, setShowConfirmForm] = useState(false);
  const router = useRouter();

  const updateStatus = (newStatus: OrderStatus) => {
    startTransition(async () => {
      try {
        await updateOrderStatusAction(order.id, newStatus, obNotes || undefined);
        toast.success(`Status diperbarui: ${newStatus}`);
        router.refresh();
      } catch {
        toast.error("Gagal update status");
      }
    });
  };

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

          {order.items && order.items.length > 0 && (
            <>
              <Separator />
              <div className="space-y-1">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.service_name} × {item.quantity}</span>
                    <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
                {(order.platform_fee ?? 0) > 0 && (
                  <>
                    <div className="flex justify-between text-muted-foreground pt-1 border-t text-xs">
                      <span>Subtotal</span>
                      <span>{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground text-xs">
                      <span>Platform Fee</span>
                      <span>{formatCurrency(order.platform_fee)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-bold pt-1 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </>
          )}

          {order.customer_notes && (
            <div className="bg-muted rounded p-2 text-xs">
              <span className="font-medium">Catatan customer:</span> {order.customer_notes}
            </div>
          )}

          {/* Confirm form */}
          {showConfirmForm && order.status === "pending" && (
            <div className="border rounded p-3 space-y-3 bg-blue-50">
              <div className="space-y-2">
                <Label>Catatan untuk Customer (opsional)</Label>
                <Textarea
                  value={obNotes}
                  onChange={(e) => setObNotes(e.target.value)}
                  placeholder="Catatan tambahan..."
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => { updateStatus("confirmed"); setShowConfirmForm(false); }} disabled={isPending}>
                  Konfirmasi Jadwal
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowConfirmForm(false)}>
                  Batal
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}

      {compact && (
        <CardContent className="py-2 text-sm">
          <p className="text-muted-foreground">{formatDate(order.requested_date)}</p>
          <p className="font-medium">{formatCurrency(order.total)}</p>
        </CardContent>
      )}

      <CardFooter className="gap-2 flex-wrap">
        {order.status === "pending" && (
          <>
            <Button size="sm" onClick={() => setShowConfirmForm(!showConfirmForm)} disabled={isPending}>
              Konfirmasi Order
            </Button>
            <Button size="sm" variant="destructive" onClick={() => updateStatus("cancelled")} disabled={isPending}>
              Tolak
            </Button>
          </>
        )}
        {order.status === "confirmed" && (
          <Button size="sm" onClick={() => updateStatus("in_progress")} disabled={isPending}>
            Mulai Kerjakan
          </Button>
        )}
        {order.status === "in_progress" && (
          <Button size="sm" onClick={() => updateStatus("completed")} disabled={isPending}>
            Tandai Selesai ✓
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
