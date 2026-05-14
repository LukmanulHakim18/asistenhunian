import { createClient } from "@/lib/supabase/server";
import { CatalogManager } from "@/components/admin/CatalogManager";
import type { Service, ServiceCategory } from "@/types/database";

export default async function AdminCatalogPage() {
  const supabase = await createClient();

  const [{ data: services }, { data: categories }] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .order("sort_order")
      .returns<Service[]>(),
    supabase
      .from("service_categories")
      .select("*")
      .order("sort_order")
      .returns<ServiceCategory[]>(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Katalog Layanan</h1>
      <CatalogManager
        initialServices={services ?? []}
        categories={categories ?? []}
      />
    </div>
  );
}
