import { serverFetch } from "./client";
import type {
  OBUser,
  Order,
  CreateOBRequest,
  UpdateOBRequest,
  LaporanRow,
} from "./types";

export const adminApi = {
  listOB: () => serverFetch<OBUser[]>("/api/v1/admin/ob"),

  createOB: (body: CreateOBRequest) =>
    serverFetch<OBUser>("/api/v1/admin/ob", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateOB: (id: string, body: UpdateOBRequest) =>
    serverFetch<OBUser>(`/api/v1/admin/ob/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  listOrders: () => serverFetch<Order[]>("/api/v1/admin/orders"),

  laporan: (month?: string) =>
    serverFetch<LaporanRow[]>(
      `/api/v1/admin/laporan${month ? `?month=${month}` : ""}`,
    ),
};
