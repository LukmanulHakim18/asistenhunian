import { serverFetchData } from "./client";
import type {
  OBUser,
  Order,
  CreateOBRequest,
  UpdateOBRequest,
  LaporanRow,
} from "./types";

export const adminApi = {
  listOB: () => serverFetchData<OBUser[]>("/api/v1/admin/ob"),

  createOB: (body: CreateOBRequest) =>
    serverFetchData<OBUser>("/api/v1/admin/ob", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateOB: (id: string, body: UpdateOBRequest) =>
    serverFetchData<OBUser>(`/api/v1/admin/ob/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  listOrders: () => serverFetchData<Order[]>("/api/v1/admin/orders"),

  laporan: (month?: string) =>
    serverFetchData<LaporanRow[]>(
      `/api/v1/admin/laporan${month ? `?month=${month}` : ""}`,
    ),
};
