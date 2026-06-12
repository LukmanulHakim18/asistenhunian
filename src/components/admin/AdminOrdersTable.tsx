"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/ob/OrderStatusBadge";
import { CancelConfirmModal } from "@/components/order/CancelConfirmModal";
import { adminCancelOrderAction } from "@/lib/actions/admin";
import { ApiError } from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { Order, OrderStatus, OBUser } from "@/lib/api/types";

interface Props {
  orders: Order[];
  obList: OBUser[];
}

const CANCELLABLE: OrderStatus[] = ["pending", "confirmed", "in_progress"];

export function AdminOrdersTable({ orders: initialOrders, obList }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const filtered =
    filterStatus === "all"
      ? orders
      : orders.filter((o) => o.status === filterStatus);

  const handleCancel = (reason: string) => {
    if (!cancelTarget) return;
    startTransition(async () => {
      try {
        await adminCancelOrderAction(cancelTarget.id, reason);
        setOrders((prev) =>
          prev.map((o) =>
            o.id === cancelTarget.id ? { ...o, status: "cancelled" as OrderStatus } : o
          )
        );
        toast.success(`Order ${cancelTarget.order_number} dibatalkan`);
        setCancelTarget(null);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Gagal membatalkan order");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <span className="text-sm text-muted-foreground">Filter:</span>
        <Select
          value={filterStatus}
          onValueChange={(v) => setFilterStatus(v as OrderStatus | "all")}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Menunggu Konfirmasi</SelectItem>
            <SelectItem value="confirmed">Dijadwalkan</SelectItem>
            <SelectItem value="in_progress">Sedang Dikerjakan</SelectItem>
            <SelectItem value="completed">Selesai</SelectItem>
            <SelectItem value="cancelled">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} order</span>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>OB Item</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((order) => (
              <TableRow
                key={order.id}
                className="cursor-pointer hover:bg-muted/60"
                onClick={() => router.push(`/admin/orders/${order.id}`)}
              >
                <TableCell className="font-mono text-sm font-medium">
                  {order.order_number}
                </TableCell>
                <TableCell>
                  <p className="font-medium">{order.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                </TableCell>
                <TableCell>{order.unit_number}</TableCell>
                <TableCell>{formatDate(order.requested_date)}</TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell>
                  {order.items && order.items.length > 0 ? (
                    <div className="text-xs text-muted-foreground">
                      {order.items.filter((i) => i.ob_id).length}/{order.items.length} di-assign
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-xs">—</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(order.total)}
                </TableCell>
                <TableCell className="text-right">
                  {CANCELLABLE.includes(order.status) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCancelTarget(order);
                      }}
                    >
                      Batalkan
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Tidak ada order dengan filter ini.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CancelConfirmModal
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        orderNumber={cancelTarget?.order_number ?? ""}
        onConfirm={handleCancel}
        isPending={isPending}
        requireReason
      />
    </div>
  );
}
