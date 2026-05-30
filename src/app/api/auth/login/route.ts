import { NextRequest, NextResponse } from "next/server";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { email: string; password: string };
    const { token, user } = await authApi.login(body);

    const response = NextResponse.json({ user });

    // JWT — httpOnly agar tidak bisa diakses JS di browser
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    // Session info (role, name) — non-httpOnly untuk middleware dan client components
    response.cookies.set(
      "session",
      JSON.stringify({ role: user.role, name: user.full_name, id: user.id }),
      {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
        path: "/",
      },
    );

    return response;
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status },
      );
    }
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
