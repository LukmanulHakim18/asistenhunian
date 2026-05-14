import { createClient } from "@/lib/supabase/server";
import { ServiceCatalog } from "@/components/catalog/ServiceCatalog";
import type { ServiceWithCategory } from "@/types/database";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: services }, { data: categories }] = await Promise.all([
    supabase
      .from("services")
      .select("*, service_categories(*)")
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("service_categories").select("*").order("sort_order"),
  ]);

  const typedServices = (services ?? []) as ServiceWithCategory[];
  const typedCategories = categories ?? [];

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-background py-16 text-center px-4">
        <h1 className="text-4xl font-bold mb-3">Jasa Kebersihan OB Rusun</h1>
        <p className="text-lg text-muted-foreground mb-6 max-w-lg mx-auto">
          Pesan layanan kebersihan unit, kasur, karpet, dan lebih banyak lagi.
          Cepat, terpercaya, langsung dari OB rusun Anda.
        </p>
        <Link
          href="/order/track"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Sudah punya order? Cek Status
        </Link>
      </section>

      {/* Catalog Section */}
      <section className="container mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold mb-6">Pilih Layanan</h2>
        {typedServices.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-4">🧹</p>
            <p>Layanan akan segera tersedia.</p>
          </div>
        ) : (
          <ServiceCatalog
            services={typedServices}
            categories={typedCategories}
          />
        )}
      </section>
    </div>
  );
}
