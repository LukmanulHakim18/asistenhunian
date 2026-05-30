import { apiFetch, serverFetch } from "./client";
import type { Service, ServiceCategory, ServiceRequest } from "./types";

export const servicesApi = {
  listCategories: () =>
    apiFetch<ServiceCategory[]>("/api/v1/service-categories"),

  list: () => apiFetch<Service[]>("/api/v1/services"),

  create: (body: ServiceRequest) =>
    serverFetch<Service>("/api/v1/services", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (id: string, body: Partial<ServiceRequest>) =>
    serverFetch<Service>(`/api/v1/services/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: (id: string) =>
    serverFetch<void>(`/api/v1/services/${id}`, { method: "DELETE" }),
};
