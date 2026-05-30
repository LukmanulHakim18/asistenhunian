import { cn, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/lib/utils";
import type { OrderStatus } from "@/lib/api/types";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        ORDER_STATUS_COLOR[status]
      )}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
