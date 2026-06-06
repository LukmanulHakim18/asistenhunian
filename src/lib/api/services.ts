import { apiFetchData, serverFetchData, serverFetch } from "./client";
import type { Service, ServiceCategory, ServiceWithCategory, ServiceRequest } from "./types";

export const servicesApi = {
  listCategories: () =>
    apiFetchData<ServiceCategory[]>("/v1/service-categories"),

  list: () => apiFetchData<ServiceWithCategory[]>("/v1/services"),

  create: (body: ServiceRequest) =>
    serverFetchData<Service>("/v1/services", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (id: string, body: Partial<ServiceRequest>) =>
    serverFetchData<Service>(`/v1/services/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: (id: string) =>
    serverFetch<void>(`/v1/services/${id}`, { method: "DELETE" }),
};
