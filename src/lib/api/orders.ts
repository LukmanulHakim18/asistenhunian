import { apiFetchData, serverFetchData } from "./client";
import type {
  Order,
  CreateOrderRequest,
  CreateOrderResponse,
  UpdateStatusRequest,
  UpdateItemStatusRequest,
} from "./types";

export const ordersApi = {
  /** Server-side — reads JWT cookie to associate order with customer_id. */
  create: (body: CreateOrderRequest) =>
    serverFetchData<CreateOrderResponse>("/v1/orders", {
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

  /** Authenticated — update order status (cancel, etc). */
  updateStatus: (id: string, body: UpdateStatusRequest) =>
    serverFetchData<Order>(`/v1/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  /** Authenticated — OB updates status of a specific item assigned to them. */
  updateItemStatus: (orderId: string, itemId: string, body: UpdateItemStatusRequest) =>
    serverFetchData<Order>(`/v1/orders/${orderId}/items/${itemId}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};
