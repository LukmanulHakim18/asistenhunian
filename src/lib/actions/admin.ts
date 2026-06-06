"use server";

import { adminApi } from "@/lib/api/admin";
import { servicesApi } from "@/lib/api/services";
import { revalidatePath } from "next/cache";
import type { CreateOBRequest, UpdateOBRequest, ServiceRequest } from "@/lib/api/types";

// ─── Order management ─────────────────────────────────────────────────────────

export async function assignItemOBAction(orderId: string, itemId: string, obId: string) {
  await adminApi.assignItemOB(orderId, itemId, { ob_id: obId });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function adminUpdateOrderStatusAction(
  orderId: string,
  status: import("@/lib/api/types").OrderStatus,
  notes?: string,
) {
  const { ordersApi } = await import("@/lib/api/orders");
  await ordersApi.updateStatus(orderId, { status, ob_notes: notes });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

// ─── OB management ───────────────────────────────────────────────────────────

export async function createOBAction(data: CreateOBRequest) {
  const ob = await adminApi.createOB(data);
  revalidatePath("/admin/ob");
  return ob;
}

export async function updateOBAction(id: string, data: UpdateOBRequest) {
  const ob = await adminApi.updateOB(id, data);
  revalidatePath("/admin/ob");
  return ob;
}

// ─── Catalog management ───────────────────────────────────────────────────────

export async function createServiceAction(data: ServiceRequest) {
  const service = await servicesApi.create(data);
  revalidatePath("/admin/catalog");
  return service;
}

export async function updateServiceAction(id: string, data: Partial<ServiceRequest>) {
  const service = await servicesApi.update(id, data);
  revalidatePath("/admin/catalog");
  return service;
}

export async function deleteServiceAction(id: string) {
  await servicesApi.delete(id);
  revalidatePath("/admin/catalog");
}
