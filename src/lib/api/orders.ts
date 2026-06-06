import { apiFetchData, serverFetchData } from "./client";
import type {
  Order,
  CreateOrderRequest,
  CreateOrderResponse,
  UpdateStatusRequest,
} from "./types";

export const ordersApi = {
  /** Public — no auth required. */
  create: (body: CreateOrderRequest) =>
    apiFetchData<CreateOrderResponse>("/v1/orders", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** Public — track by order_number, no auth required. */
  track: (orderNumber: string) =>
    apiFetchData<Order>(`/v1/orders/track/${orderNumber}`),

  /** Authenticated — returns orders for the current user (role-aware). */
  list: () => serverFetchData<Order[]>("/v1/orders"),

  /** Authenticated — detail with items and status history. */
  detail: (id: string) => serverFetchData<Order>(`/v1/orders/${id}`),

  /** Authenticated — OB updates order status. */
  updateStatus: (id: string, body: UpdateStatusRequest) =>
    serverFetchData<Order>(`/v1/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};
