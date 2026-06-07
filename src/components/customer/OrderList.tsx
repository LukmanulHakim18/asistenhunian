"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/ob/OrderStatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/api/types";

type Tab = "scheduled" | "progress" | "history";

const TAB_CONFIG: Record<
  Tab,
  { label: string; statuses: OrderStatus[]; emptyMessage: string }
> = {
  scheduled: {
    label: "Dijadwalkan",
    statuses: ["pending", "confirmed"],
    emptyMessage: "Tidak ada order yang menunggu jadwal.",
  },
  progress: {
    label: "Sedang Dikerjakan",
    statuses: ["in_progress"],
    emptyMessage: "Tidak ada order yang sedang dikerjakan.",
  },
  history: {
    label: "Riwayat",
    statuses: ["completed", "cancelled"],
    emptyMessage: "Belum ada riwayat order selesai atau dibatalkan.",
  },
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash: "Cash ke OB",
  transfer: "Transfer Online",
  qris: "QRIS",
};

function getDefaultTab(orders: Order[]): Tab {
  if (orders.some((o) => o.status === "in_progress")) return "progress";
  if (orders.some((o) => o.status === "pending" || o.status === "confirmed"))
    return "scheduled";
  return "history";
}

interface Props {
  orders: Order[];
}

export function OrderList({ orders }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(() => getDefaultTab(orders));

  const filtered = orders.filter((o) =>
    TAB_CONFIG[activeTab].statuses.includes(o.status)
  );

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="grid grid-cols-3 gap-1 bg-muted rounded-lg p-1">
        {(Object.keys(TAB_CONFIG) as Tab[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={[
                "flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              <span className="truncate">{TAB_CONFIG[tab].label}</span>
            </button>
          );
        })}
      </div>

      {/* Order list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {TAB_CONFIG[activeTab].emptyMessage}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <Link
              key={order.id}
              href={`/order/${order.order_number}/track`}
              className="block group"
            >
              <Card className="transition-colors group-hover:bg-accent/40">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-medium">
                        {order.order_number}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(order.requested_date)}
                      </p>
                      <p className="text-sm font-semibold mt-1">
                        {formatCurrency(order.total)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {PAYMENT_METHOD_LABEL[order.payment_method] ??
                          order.payment_method}
                        {" · "}
                        <span
                          className={
                            order.payment_status === "paid"
                              ? "text-green-600"
                              : "text-orange-600"
                          }
                        >
                          {order.payment_status === "paid"
                            ? "Lunas"
                            : "Belum dibayar"}
                        </span>
                      </p>
                    </div>
                    <div className="shrink-0">
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
