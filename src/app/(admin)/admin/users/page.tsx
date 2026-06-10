import { adminApi } from "@/lib/api/admin";
import { UserManager } from "@/components/admin/UserManager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await adminApi.listUsers().catch(() => []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Kelola User</h1>
      <UserManager initialUsers={users} />
    </div>
  );
}
