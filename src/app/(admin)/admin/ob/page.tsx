import { createAdminClient } from "@/lib/supabase/server";
import { OBManager } from "@/components/admin/OBManager";
import type { Profile } from "@/types/database";

export type OBWithEmail = Profile & { email: string };

export default async function AdminOBPage() {
  const supabase = createAdminClient();

  const [{ data: profiles }, { data: authData }] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "ob").order("full_name").returns<Profile[]>(),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailMap = Object.fromEntries(
    (authData?.users ?? []).map((u) => [u.id, u.email ?? ""])
  );

  const obList: OBWithEmail[] = (profiles ?? []).map((p) => ({
    ...p,
    email: emailMap[p.id] ?? "",
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Kelola OB</h1>
      <OBManager initialOBList={obList} />
    </div>
  );
}
