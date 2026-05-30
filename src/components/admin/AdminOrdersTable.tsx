"use client";

import { useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "@/components/ob/OrderStatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/api/types";

interface Props {
  orders: Order[];
}

export function AdminOrdersTable({ orders }: Props) {
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
              <TableHead>OB</TableHead>
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
                  {order.ob ? (
                    <span className="text-sm">{order.ob.full_name}</span>
                  ) : (
                    <Badge variant="outline">Belum</Badge>
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
