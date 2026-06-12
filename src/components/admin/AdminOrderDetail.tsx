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
import { assignItemOBAction, adminUpdateOrderStatusAction, confirmOrderAction, adminCancelOrderAction } from "@/lib/actions/admin";
import { CancelConfirmModal } from "@/components/order/CancelConfirmModal";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import type { Order, OBUser, OrderStatus, OrderItem } from "@/lib/api/types";
import { CheckCircle, Clock, Loader, XCircle } from "lucide-react";

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  confirmed: <CheckCircle className="h-4 w-4 text-blue-500" />,
  in_progress: <Loader className="h-4 w-4 text-purple-500" />,
  completed: <CheckCircle className="h-4 w-4 text-green-500" />,
  cancelled: <XCircle className="h-4 w-4 text-red-500" />,
};

const ITEM_STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu",
  in_progress: "Dikerjakan",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const ITEM_STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
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

// Controlled item row used when building the confirm payload (pending orders)
function PendingItemRow({
  item,
  obList,
  obId,
  onObChange,
  isError,
}: {
  item: OrderItem;
  obList: OBUser[];
  obId: string;
  onObChange: (v: string) => void;
  isError: boolean;
}) {
  const activeOBs = obList.filter((ob) => ob.is_active);
  return (
    <div className={`py-3 border-b last:border-0 ${isError ? "rounded bg-red-50" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm">{item.service_name} × {item.quantity}</p>
          <p className="text-sm text-muted-foreground">{formatCurrency(item.subtotal)}</p>
          {isError && (
            <p className="text-xs text-red-600 mt-1">Wajib pilih OB</p>
          )}
        </div>
        <Select value={obId} onValueChange={(v) => onObChange(v ?? "")}>
          <SelectTrigger className={`h-8 w-36 text-xs ${isError ? "border-red-500" : ""}`}>
            <SelectValue placeholder="Pilih OB...">
              {obId ? (activeOBs.find((ob) => ob.id === obId)?.full_name ?? "Pilih OB...") : "Pilih OB..."}
            </SelectValue>
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
    </div>
  );
}

// Bulk assign + confirm section — only rendered for pending orders
function ConfirmOrderSection({ order, obList }: { order: Order; obList: OBUser[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [assignments, setAssignments] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    order.items?.forEach((item) => { if (item.ob_id) init[item.id] = item.ob_id; });
    return init;
  });
  const [errorItemId, setErrorItemId] = useState<string | null>(null);

  const platformFee = order.platform_fee ?? 0;
  const itemsSubtotal = order.items?.reduce((s, i) => s + i.subtotal, 0) ?? order.subtotal ?? 0;

  const handleConfirm = () => {
    const missingItem = order.items?.find((item) => !assignments[item.id]);
    if (missingItem) {
      setErrorItemId(missingItem.id);
      toast.error(`Pilih OB untuk "${missingItem.service_name}"`);
      return;
    }
    setErrorItemId(null);
    startTransition(async () => {
      try {
        const items = (order.items ?? []).map((item) => ({
          item_id: item.id,
          ob_id: assignments[item.id],
        }));
        await confirmOrderAction(order.id, items);
        toast.success("Order dikonfirmasi");
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        // Server returns: "item <uuid> belum mendapat OB"
        const match = msg.match(/item ([0-9a-f-]+) belum mendapat OB/);
        if (match) {
          setErrorItemId(match[1]);
          toast.error("Satu item belum mendapat OB");
        } else {
          toast.error("Gagal mengkonfirmasi order");
        }
      }
    });
  };

  return (
    <div>
      <div>
        {(order.items ?? []).map((item) => (
          <PendingItemRow
            key={item.id}
            item={item}
            obList={obList}
            obId={assignments[item.id] ?? ""}
            onObChange={(v) => {
              setAssignments((prev) => ({ ...prev, [item.id]: v }));
              if (errorItemId === item.id) setErrorItemId(null);
            }}
            isError={errorItemId === item.id}
          />
        ))}
      </div>
      <div className="pt-3 space-y-1 text-sm">
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
      </div>
      <div className="pt-4">
        <Button onClick={handleConfirm} disabled={isPending} className="w-full">
          {isPending ? "Mengkonfirmasi..." : "Konfirmasi Order"}
        </Button>
      </div>
    </div>
  );
}

// Per-item assign row — used for non-pending orders where OB re-assignment is still allowed
function ItemAssignRow({ orderId, item, obList }: { orderId: string; item: OrderItem; obList: OBUser[] }) {
  const [selectedOB, setSelectedOB] = useState<string>(item.ob_id ?? "");
  const [isPending, startTransition] = useTransition();
  const activeOBs = obList.filter((ob) => ob.is_active);
  const assignedOB = obList.find((ob) => ob.id === item.ob_id);

  const handleAssign = () => {
    if (!selectedOB || selectedOB === item.ob_id) return;
    startTransition(async () => {
      try {
        await assignItemOBAction(orderId, item.id, selectedOB);
        toast.success(`OB di-assign ke ${item.service_name}`);
      } catch {
        toast.error("Gagal assign OB");
      }
    });
  };

  return (
    <div className="py-3 border-b last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm">{item.service_name} × {item.quantity}</p>
          <p className="text-sm text-muted-foreground">{formatCurrency(item.subtotal)}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ITEM_STATUS_COLOR[item.status] ?? "bg-gray-100 text-gray-800"}`}>
              {ITEM_STATUS_LABEL[item.status] ?? item.status}
            </span>
            {assignedOB && (
              <span className="text-xs text-muted-foreground">OB: {assignedOB.full_name}</span>
            )}
          </div>
          {item.notes && (
            <p className="text-xs text-muted-foreground mt-1 italic">{item.notes}</p>
          )}
        </div>
        {item.status !== "cancelled" && item.status !== "completed" && (
          <div className="flex items-center gap-2 shrink-0">
            <Select
              value={selectedOB}
              onValueChange={(v) => setSelectedOB(v ?? "")}
              disabled={isPending}
            >
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="Pilih OB...">
                  {selectedOB ? (activeOBs.find((ob) => ob.id === selectedOB)?.full_name ?? "Pilih OB...") : "Pilih OB..."}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {activeOBs.map((ob) => (
                  <SelectItem key={ob.id} value={ob.id}>
                    {ob.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={handleAssign}
              disabled={isPending || !selectedOB || selectedOB === item.ob_id}
            >
              {isPending ? "..." : "Assign"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function CancelSection({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (order.status === "completed" || order.status === "cancelled") return null;

  const handleCancel = (reason: string) => {
    startTransition(async () => {
      try {
        await adminCancelOrderAction(order.id, reason);
        toast.success("Order dibatalkan");
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Gagal membatalkan order");
      }
    });
  };

  return (
    <>
      <Card className="border-destructive/30">
        <CardContent className="pt-4">
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => setOpen(true)}
          >
            Batalkan Order
          </Button>
        </CardContent>
      </Card>
      <CancelConfirmModal
        open={open}
        onOpenChange={setOpen}
        orderNumber={order.order_number}
        onConfirm={handleCancel}
        isPending={isPending}
        requireReason
      />
    </>
  );
}

export function AdminOrderDetail({ order, obList }: Props) {
  const platformFee = order.platform_fee ?? 0;
  const itemsSubtotal = order.items?.reduce((s, i) => s + i.subtotal, 0) ?? order.subtotal ?? 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Kiri */}
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
            {order.notes && (
              <div className="bg-muted rounded p-2 text-xs">
                <span className="font-medium">Catatan:</span> {order.notes}
              </div>
            )}
            {order.cancel_reason && (
              <div className="bg-destructive/10 border border-destructive/20 rounded p-2 text-xs">
                <span className="font-medium text-destructive">Alasan pembatalan:</span>{" "}
                {order.cancel_reason}
              </div>
            )}
          </CardContent>
        </Card>

        {order.items && order.items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {order.status === "pending" ? "Assign OB & Konfirmasi" : "Layanan & Assign OB"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.status === "pending" ? (
                <ConfirmOrderSection order={order} obList={obList} />
              ) : (
                <>
                  <div>
                    {order.items.map((item) => (
                      <ItemAssignRow key={item.id} orderId={order.id} item={item} obList={obList} />
                    ))}
                  </div>
                  <div className="pt-3 space-y-1 text-sm">
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
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {order.status_history && order.status_history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Riwayat Status</CardTitle>
            </CardHeader>
            <CardContent>
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
                    {h.notes && <p className="text-sm text-muted-foreground">{h.notes}</p>}
                    <p className="text-xs text-muted-foreground">{formatDateTime(h.created_at)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Kanan */}
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-4 text-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status Order</span>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Item</span>
              <span>{order.items?.length ?? 0} layanan</span>
            </div>
            {order.items && order.items.length > 0 && (
              <div className="pt-1 space-y-1">
                {["pending", "in_progress", "completed", "cancelled"].map((s) => {
                  const count = order.items!.filter((i) => i.status === s).length;
                  if (count === 0) return null;
                  return (
                    <div key={s} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{ITEM_STATUS_LABEL[s]}</span>
                      <Badge variant="secondary" className="text-xs h-5">{count}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <CancelSection order={order} />
      </div>
    </div>
  );
}
