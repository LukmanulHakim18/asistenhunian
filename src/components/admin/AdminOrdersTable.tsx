"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "@/components/ob/OrderStatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { Order, OrderItem, OrderStatus, Profile } from "@/types/database";

type OrderWithDetails = Order & {
  order_items: OrderItem[];
  ob: Pick<Profile, "id" | "full_name"> | null;
};

interface Props {
  orders: OrderWithDetails[];
  obList: Pick<Profile, "id" | "full_name">[];
}

export function AdminOrdersTable({ orders, obList }: Props) {
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [assigning, setAssigning] = useState<string | null>(null);
  const router = useRouter();

  const filtered =
    filterStatus === "all"
      ? orders
      : orders.filter((o) => o.status === filterStatus);

  const handleAssignOB = async (orderId: string, obId: string) => {
    setAssigning(orderId);
    const res = await fetch(`/api/admin/orders/${orderId}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ob_id: obId }),
    });
    if (res.ok) {
      toast.success("OB berhasil di-assign");
      router.refresh();
    } else {
      toast.error("Gagal assign OB");
    }
    setAssigning(null);
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
        <span className="text-sm text-muted-foreground">
          {filtered.length} order
        </span>
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
              <TableHead>OB</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-sm">
                  {order.order_number}
                </TableCell>
                <TableCell>
                  <p className="font-medium">{order.customer_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.customer_phone}
                  </p>
                </TableCell>
                <TableCell>{order.unit_number}</TableCell>
                <TableCell>{formatDate(order.requested_date)}</TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell>
                  {order.status === "pending" && !order.ob_id ? (
                    <Select
                      onValueChange={(obId) => {
                        const id = String(obId);
                        if (id) handleAssignOB(order.id, id);
                      }}
                      disabled={assigning === order.id}
                    >
                      <SelectTrigger className="w-36 h-7 text-xs">
                        <SelectValue placeholder="Assign OB..." />
                      </SelectTrigger>
                      <SelectContent>
                        {obList.map((ob) => (
                          <SelectItem key={ob.id} value={ob.id}>
                            {ob.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm">
                      {order.ob?.full_name ?? (
                        <Badge variant="outline">Belum</Badge>
                      )}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(order.total)}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
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
