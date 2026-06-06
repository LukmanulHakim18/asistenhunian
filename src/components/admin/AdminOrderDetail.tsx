"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { OrderStatusBadge } from "@/components/ob/OrderStatusBadge";
import { formatCurrency, formatDate, formatDateTime, ORDER_STATUS_LABEL } from "@/lib/utils";
import { assignOBAction, adminUpdateOrderStatusAction } from "@/lib/actions/admin";
import { toast } from "sonner";
import type { Order, OBUser, OrderStatus } from "@/lib/api/types";
import { CheckCircle, Clock, Loader, XCircle } from "lucide-react";

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  confirmed: <CheckCircle className="h-4 w-4 text-blue-500" />,
  in_progress: <Loader className="h-4 w-4 text-purple-500" />,
  completed: <CheckCircle className="h-4 w-4 text-green-500" />,
  cancelled: <XCircle className="h-4 w-4 text-red-500" />,
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash: "Cash ke OB",
  transfer: "Transfer Online",
  qris: "QRIS",
};

interface Props {
  order: Order;
  obList: OBUser[];
}

function StatusSection({ order, obList }: Props) {
  const [selectedOB, setSelectedOB] = useState<string>(order.ob_id ?? "");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const activeOBs = obList.filter((ob) => ob.is_active);
  const isDone = order.status === "completed" || order.status === "cancelled";

  const handleConfirm = () => {
    if (!selectedOB) {
      toast.error("Pilih OB terlebih dahulu");
      return;
    }
    startTransition(async () => {
      try {
        // Assign OB dulu, lalu confirm
        await assignOBAction(order.id, selectedOB);
        await adminUpdateOrderStatusAction(order.id, "confirmed", notes || undefined);
        toast.success("Order dikonfirmasi dan OB telah di-assign");
        setNotes("");
        router.refresh();
      } catch {
        toast.error("Gagal konfirmasi order");
      }
    });
  };

  const handleStatus = (newStatus: OrderStatus) => {
    startTransition(async () => {
      try {
        await adminUpdateOrderStatusAction(order.id, newStatus, notes || undefined);
        toast.success(`Status diperbarui: ${ORDER_STATUS_LABEL[newStatus]}`);
        setNotes("");
        router.refresh();
      } catch {
        toast.error("Gagal update status");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Update Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status saat ini:</span>
          <OrderStatusBadge status={order.status} />
        </div>

        {order.ob && (
          <div className="text-sm">
            <span className="text-muted-foreground">OB: </span>
            <span className="font-medium">{order.ob.full_name}</span>
          </div>
        )}

        {!isDone && (
          <>
            {/* Pilih OB hanya saat pending */}
            {order.status === "pending" && (
              <div className="space-y-1">
                <Label className="text-xs">Pilih OB <span className="text-destructive">*</span></Label>
                <Select
                  value={selectedOB}
                  onValueChange={(v) => setSelectedOB(v ?? "")}
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih OB..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeOBs.map((ob) => (
                      <SelectItem key={ob.id} value={ob.id}>
                        {ob.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Catatan (opsional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan untuk customer atau OB..."
                rows={2}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {order.status === "pending" && (
                <>
                  <Button
                    size="sm"
                    onClick={handleConfirm}
                    disabled={isPending || !selectedOB}
                  >
                    {isPending ? "Memproses..." : "Konfirmasi Order"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleStatus("cancelled")}
                    disabled={isPending}
                  >
                    Batalkan
                  </Button>
                </>
              )}
              {order.status === "confirmed" && (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleStatus("in_progress")}
                    disabled={isPending}
                  >
                    Mulai Kerjakan
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleStatus("cancelled")}
                    disabled={isPending}
                  >
                    Batalkan
                  </Button>
                </>
              )}
              {order.status === "in_progress" && (
                <Button
                  size="sm"
                  onClick={() => handleStatus("completed")}
                  disabled={isPending}
                >
                  Tandai Selesai
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminOrderDetail({ order, obList }: Props) {
  const platformFee = order.platform_fee ?? 0;
  const itemsSubtotal = order.items?.reduce((s, i) => s + i.subtotal, 0) ?? order.subtotal ?? 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Kiri: Info Order */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-y-2">
              <span className="text-muted-foreground">Customer</span>
              <span className="font-medium">{order.customer_name}</span>
              <span className="text-muted-foreground">Email</span>
              <span>{order.customer_email}</span>
              <span className="text-muted-foreground">WhatsApp</span>
              <a
                href={`https://wa.me/62${order.customer_phone.replace(/^0/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {order.customer_phone}
              </a>
              <span className="text-muted-foreground">Nomor Unit</span>
              <span className="font-medium">{order.unit_number}</span>
              <span className="text-muted-foreground">Tanggal Diminta</span>
              <span>{formatDate(order.requested_date)}</span>
              {order.confirmed_datetime && (
                <>
                  <span className="text-muted-foreground">Jadwal Pasti</span>
                  <span>{formatDateTime(order.confirmed_datetime)}</span>
                </>
              )}
              {order.preferred_time_note && (
                <>
                  <span className="text-muted-foreground">Preferensi Waktu</span>
                  <span>{order.preferred_time_note}</span>
                </>
              )}
              <span className="text-muted-foreground">Pembayaran</span>
              <span>
                {PAYMENT_METHOD_LABEL[order.payment_method] ?? order.payment_method}
                {" · "}
                <span className={order.payment_status === "paid" ? "text-green-600" : "text-orange-600"}>
                  {order.payment_status === "paid" ? "Lunas" : "Belum dibayar"}
                </span>
              </span>
            </div>
            {order.customer_notes && (
              <div className="bg-muted rounded p-2 text-xs">
                <span className="font-medium">Catatan customer:</span> {order.customer_notes}
              </div>
            )}
          </CardContent>
        </Card>

        {order.items && order.items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Layanan Dipesan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.service_name} × {item.quantity}</span>
                  <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
              <Separator />
              {platformFee > 0 && (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatCurrency(itemsSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Platform Fee</span>
                    <span>{formatCurrency(platformFee)}</span>
                  </div>
                  <Separator />
                </>
              )}
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {order.status_history && order.status_history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Riwayat Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {order.status_history.map((h, idx) => (
                  <div key={h.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="mt-0.5">{STATUS_ICONS[h.new_status]}</div>
                      {idx < (order.status_history!.length - 1) && (
                        <div className="w-px flex-1 bg-border my-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="font-medium text-sm">{ORDER_STATUS_LABEL[h.new_status]}</p>
                      {h.notes && (
                        <p className="text-sm text-muted-foreground">{h.notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{formatDateTime(h.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Kanan: Actions */}
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-4 space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">OB</span>
              {order.ob ? (
                <span className="font-medium">{order.ob.full_name}</span>
              ) : (
                <Badge variant="outline">Belum</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <StatusSection order={order} obList={obList} />
      </div>
    </div>
  );
}
