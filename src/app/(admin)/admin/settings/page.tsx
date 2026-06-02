import { adminApi } from "@/lib/api/admin";
import { ConfigSettings } from "@/components/admin/ConfigSettings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const configs = await adminApi.getConfigs().catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground">Konfigurasi platform dan biaya layanan.</p>
      </div>

      <ConfigSettings configs={configs} />
    </div>
  );
}
