import { serverFetchData } from "./client";
import type { User, UpdateProfileRequest } from "./types";

export const profileApi = {
  me: () => serverFetchData<User>("/api/v1/profiles/me"),

  update: (body: UpdateProfileRequest) =>
    serverFetchData<User>("/api/v1/profiles/me", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};
