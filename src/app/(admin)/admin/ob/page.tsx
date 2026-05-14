import { createClient } from "@/lib/supabase/server";
import { OBManager } from "@/components/admin/OBManager";
import type { Profile } from "@/types/database";

export default async function AdminOBPage() {
  const supabase = await createClient();

  const { data: obList } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "ob")
    .order("full_name")
    .returns<Profile[]>();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Kelola OB</h1>
      <OBManager initialOBList={obList ?? []} />
    </div>
  );
}
