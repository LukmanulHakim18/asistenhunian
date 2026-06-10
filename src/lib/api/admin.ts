import { serverFetchData } from "./client";
import type {
  OBUser,
  Order,
  AssignOBRequest,
  ConfirmOrderRequest,
  CreateOBRequest,
  UpdateOBRequest,
  LaporanRow,
  ConfigItem,
  SetConfigRequest,
  User,
  UserFilters,
} from "./types";

export const adminApi = {
  listOB: () => serverFetchData<OBUser[]>("/v1/admin/ob"),

  createOB: (body: CreateOBRequest) =>
    serverFetchData<OBUser>("/v1/admin/ob", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateOB: (id: string, body: UpdateOBRequest) =>
    serverFetchData<OBUser>(`/v1/admin/ob/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  listOrders: () => serverFetchData<Order[]>("/v1/admin/orders"),

  laporan: (month?: string) =>
    serverFetchData<LaporanRow[]>(
      `/v1/admin/laporan${month ? `?month=${month}` : ""}`,
    ),

  assignItemOB: (orderId: string, itemId: string, body: AssignOBRequest) =>
    serverFetchData<Order>(`/v1/admin/orders/${orderId}/items/${itemId}/assign`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  confirmOrder: (orderId: string, body: ConfirmOrderRequest) =>
    serverFetchData<Order>(`/v1/admin/orders/${orderId}/confirm`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listUsers: (filters?: UserFilters) => {
    const params = new URLSearchParams();
    if (filters?.role && filters.role !== "all") params.set("role", filters.role);
    if (filters?.is_active !== undefined && filters.is_active !== "all")
      params.set("is_active", String(filters.is_active));
    const qs = params.toString();
    return serverFetchData<User[]>(`/v1/admin/users${qs ? `?${qs}` : ""}`);
  },

  getConfigs: () => serverFetchData<ConfigItem[]>("/v1/config"),

  setConfig: (key: string, body: SetConfigRequest) =>
    serverFetchData<ConfigItem>(`/v1/admin/config/${key}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
};
