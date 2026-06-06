import { apiFetch, serverFetch } from "./client";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  User,
} from "./types";

export const authApi = {
  login: (body: LoginRequest) =>
    apiFetch<LoginResponse>("/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  register: (body: RegisterRequest) =>
    apiFetch<{ message: string; token: string; user: User }>("/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  me: () =>
    serverFetch<{ user: User }>("/v1/auth/me").then((r) => r.user),

  forgotPassword: (body: ForgotPasswordRequest) =>
    apiFetch<{ message: string }>("/v1/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  resetPassword: (body: ResetPasswordRequest) =>
    apiFetch<{ message: string }>("/v1/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  changePassword: (body: ChangePasswordRequest) =>
    serverFetch<{ message: string }>("/v1/auth/change-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  verifyEmail: (body: VerifyEmailRequest) =>
    apiFetch<{ message: string }>("/v1/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  resendVerification: (body: ResendVerificationRequest) =>
    apiFetch<{ message: string }>("/v1/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
