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

  getConfigs: () => serverFetchData<ConfigItem[]>("/v1/config"),

  setConfig: (key: string, body: SetConfigRequest) =>
    serverFetchData<ConfigItem>(`/v1/admin/config/${key}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
};
