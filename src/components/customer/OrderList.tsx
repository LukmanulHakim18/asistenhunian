"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/ob/OrderStatusBadge";
import { CancelConfirmModal } from "@/components/order/CancelConfirmModal";
import { cancelOrderAction } from "@/lib/actions/orders";
import { ApiError } from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
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

export function OrderList({ orders: initialOrders }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<Tab>(() => getDefaultTab(initialOrders));
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const filtered = orders.filter((o) =>
    TAB_CONFIG[activeTab].statuses.includes(o.status)
  );

  const handleCancel = (reason: string) => {
    if (!cancelTarget) return;
    startTransition(async () => {
      try {
        await cancelOrderAction(cancelTarget.id, reason || undefined);
        setOrders((prev) =>
          prev.map((o) =>
            o.id === cancelTarget.id ? { ...o, status: "cancelled" as OrderStatus } : o
          )
        );
        toast.success("Order berhasil dibatalkan");
        setCancelTarget(null);
        setActiveTab("history");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Gagal membatalkan order");
      }
    });
  };

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
            <div
              key={order.id}
              className="block group cursor-pointer"
              onClick={() => router.push(`/order/${order.order_number}/track`)}
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
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <OrderStatusBadge status={order.status} />
                      {order.status === "pending" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="text-xs h-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCancelTarget(order);
                          }}
                        >
                          Batalkan
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      <CancelConfirmModal
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        orderNumber={cancelTarget?.order_number ?? ""}
        onConfirm={handleCancel}
        isPending={isPending}
      />
    </div>
  );
}
