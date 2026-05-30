import { serverFetch } from "./client";
import type { User, UpdateProfileRequest } from "./types";

export const profileApi = {
  me: () => serverFetch<User>("/api/v1/profiles/me"),

  update: (body: UpdateProfileRequest) =>
    serverFetch<User>("/api/v1/profiles/me", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};
