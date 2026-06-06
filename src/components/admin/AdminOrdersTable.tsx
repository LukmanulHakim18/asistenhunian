"use client";

import { useState, useTransition } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/ob/OrderStatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { assignOBAction } from "@/lib/actions/admin";
import { toast } from "sonner";
import type { Order, OrderStatus, OBUser } from "@/lib/api/types";

interface Props {
  orders: Order[];
  obList: OBUser[];
}

function AssignOBCell({ order, obList }: { order: Order; obList: OBUser[] }) {
  const [selectedOB, setSelectedOB] = useState<string>(order.ob_id ?? "");
  const [isPending, startTransition] = useTransition();
  const activeOBs = obList.filter((ob) => ob.is_active);

  const currentOBName = order.ob?.full_name
    ?? obList.find((ob) => ob.id === order.ob_id)?.full_name;

  const handleAssign = () => {
    if (!selectedOB || selectedOB === order.ob_id) return;
    startTransition(async () => {
      try {
        await assignOBAction(order.id, selectedOB);
        toast.success("OB berhasil di-assign");
      } catch {
        toast.error("Gagal assign OB");
      }
    });
  };

  return (
    <div className="flex items-center gap-2 min-w-[200px]">
      <Select value={selectedOB} onValueChange={(v) => setSelectedOB(v ?? "")} disabled={isPending}>
        <SelectTrigger className="h-8 text-xs w-36">
          <SelectValue placeholder="Pilih OB">
            {selectedOB
              ? (obList.find((ob) => ob.id === selectedOB)?.full_name ?? currentOBName ?? "Pilih OB")
              : "Pilih OB"}
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
        className="h-8 text-xs px-2"
        onClick={handleAssign}
        disabled={isPending || !selectedOB || selectedOB === order.ob_id}
      >
        {isPending ? "..." : "Assign"}
      </Button>
    </div>
  );
}

export function AdminOrdersTable({ orders, obList }: Props) {
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");

  const filtered =
    filterStatus === "all"
      ? orders
      : orders.filter((o) => o.status === filterStatus);

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
              <TableHead>Assign OB</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
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
                  {order.status === "cancelled" || order.status === "completed" ? (
                    order.ob ? (
                      <span className="text-sm text-muted-foreground">{order.ob.full_name}</span>
                    ) : (
                      <Badge variant="outline">Tidak ada</Badge>
                    )
                  ) : (
                    <AssignOBCell order={order} obList={obList} />
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(order.total)}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Tidak ada order dengan filter ini.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
