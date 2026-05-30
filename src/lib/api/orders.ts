import { apiFetch, serverFetch } from "./client";
import type {
  Order,
  CreateOrderRequest,
  CreateOrderResponse,
  UpdateStatusRequest,
} from "./types";

export const ordersApi = {
  /** Public — no auth required. */
  create: (body: CreateOrderRequest) =>
    apiFetch<CreateOrderResponse>("/api/v1/orders", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** Public — track by order_number, no auth required. */
  track: (orderNumber: string) =>
    apiFetch<Order>(`/api/v1/orders/track/${orderNumber}`),

  /** Authenticated — returns orders for the current user (role-aware). */
  list: () => serverFetch<Order[]>("/api/v1/orders"),

  /** Authenticated — detail with items and status history. */
  detail: (id: string) => serverFetch<Order>(`/api/v1/orders/${id}`),

  /** Authenticated — OB updates order status. */
  updateStatus: (id: string, body: UpdateStatusRequest) =>
    serverFetch<Order>(`/api/v1/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};
