import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";

const createOBSchema = z.object({
  full_name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(9).max(15).optional(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const { data: profile } = await userClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .returns<{ role: string }[]>()
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createOBSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { full_name, email, phone, password } = parsed.data;

  const supabase = createAdminClient();

  // Create auth user with OB role
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, phone: phone ?? null, role: "ob" },
    });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message ?? "Gagal membuat akun" },
      { status: 400 }
    );
  }

  // Update profile with phone (trigger creates the profile)
  if (phone) {
    await supabase
      .from("profiles")
      .update({ phone } as object)
      .eq("id", authData.user.id);
  }

  const { data: obProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  return NextResponse.json({ ob: obProfile }, { status: 201 });
}
