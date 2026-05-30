import { apiFetch, serverFetch } from "./client";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  User,
} from "./types";

export const authApi = {
  login: (body: LoginRequest) =>
    apiFetch<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  register: (body: RegisterRequest) =>
    apiFetch<{ message: string; token: string; user: User }>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  me: () =>
    serverFetch<{ user: User }>("/api/v1/auth/me").then((r) => r.user),

  forgotPassword: (body: ForgotPasswordRequest) =>
    apiFetch<{ message: string }>("/api/v1/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  resetPassword: (body: ResetPasswordRequest) =>
    apiFetch<{ message: string }>("/api/v1/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  changePassword: (body: ChangePasswordRequest) =>
    serverFetch<{ message: string }>("/api/v1/auth/change-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
