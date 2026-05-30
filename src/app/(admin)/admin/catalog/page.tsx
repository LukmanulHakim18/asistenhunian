import { servicesApi } from "@/lib/api/services";
import { CatalogManager } from "@/components/admin/CatalogManager";

export const dynamic = "force-dynamic";

export default async function AdminCatalogPage() {
  const [services, categories] = await Promise.all([
    servicesApi.list().catch(() => []),
    servicesApi.listCategories().catch(() => []),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Katalog Layanan</h1>
      <CatalogManager initialServices={services} categories={categories} />
    </div>
  );
}
