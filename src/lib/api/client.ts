const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://asistenhunian.com";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extraHeaders as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...rest, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      (body as Record<string, string>).message ??
      (body as Record<string, string>).error ??
      res.statusText;
    throw new ApiError(res.status, message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;

  return res.json() as Promise<T>;
}

/** Server-side helper — reads the JWT from the httpOnly cookie and forwards it. */
export async function serverFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { cookies } = await import("next/headers");
  const token = (await cookies()).get("token")?.value;
  return apiFetch<T>(path, { ...options, token });
}
