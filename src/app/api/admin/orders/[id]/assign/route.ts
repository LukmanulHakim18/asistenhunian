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

  const { ob_id } = await request.json();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("orders")
    .update({ ob_id } as object)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Gagal assign OB" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
