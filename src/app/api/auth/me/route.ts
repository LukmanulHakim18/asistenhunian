import { NextResponse } from "next/server";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export async function GET() {
  try {
    const user = await authApi.me();
    return NextResponse.json(user);
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
