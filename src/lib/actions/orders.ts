"use server";

import { ordersApi } from "@/lib/api/orders";
import type { OrderStatus, CreateOrderRequest, CreateOrderResponse } from "@/lib/api/types";
import { revalidatePath } from "next/cache";

export async function createOrderAction(body: CreateOrderRequest): Promise<CreateOrderResponse> {
  return ordersApi.create(body);
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
