import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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
  const supabase = createAdminClient();

  if (body.password !== undefined) {
    if (typeof body.password !== "string" || body.password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
    }
    const { error } = await supabase.auth.admin.updateUserById(id, { password: body.password });
    if (error) {
      return NextResponse.json({ error: "Gagal reset password" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: body.is_active } as object)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Gagal update status OB" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
