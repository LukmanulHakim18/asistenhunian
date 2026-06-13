"use server";

import { ordersApi } from "@/lib/api/orders";
import type { OrderStatus, OrderItemStatus, CreateOrderRequest, CreateOrderResponse, Review, OrderItemReview } from "@/lib/api/types";
import { revalidatePath } from "next/cache";

export async function createOrderAction(body: CreateOrderRequest): Promise<CreateOrderResponse> {
  return ordersApi.create(body);
}

export async function cancelOrderAction(orderId: string, reason?: string) {
  await ordersApi.cancelOrder(orderId, reason);
  revalidatePath("/dashboard");
}

export async function submitReviewAction(
  orderId: string,
  rating: number,
  comment?: string,
): Promise<Review> {
  return ordersApi.submitReview(orderId, { rating, comment });
}

export async function submitItemReviewAction(
  orderId: string,
  itemId: string,
  rating: number,
  text?: string,
  isComplaint?: boolean,
): Promise<{ data?: OrderItemReview; error?: string }> {
  try {
    const body = isComplaint
      ? { rating, complaint: text }
      : { rating, comment: text };
    const data = await ordersApi.submitItemReview(orderId, itemId, body);
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal mengirim ulasan" };
  }
}

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
  obNotes?: string,
) {
  await ordersApi.updateStatus(orderId, { status, ob_notes: obNotes });
  revalidatePath("/ob/orders");
  revalidatePath("/ob/dashboard");
}

export async function updateItemStatusAction(
  orderId: string,
  itemId: string,
  status: OrderItemStatus,
  notes?: string,
) {
  await ordersApi.updateItemStatus(orderId, itemId, { status, notes });
  revalidatePath("/ob/orders");
  revalidatePath(`/ob/orders/${orderId}`);
  revalidatePath("/ob/dashboard");
}
