import { adminApi } from "@/lib/api/admin";
import { OBManager } from "@/components/admin/OBManager";

export const dynamic = "force-dynamic";

export default async function AdminOBPage() {
  const obList = await adminApi.listOB().catch(() => []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Kelola OB</h1>
      <OBManager initialOBList={obList} />
    </div>
  );
}
