import { createClient } from "@/lib/supabase/server";
import { ServiceCatalog } from "@/components/catalog/ServiceCatalog";
import type { ServiceWithCategory } from "@/types/database";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles, ShieldCheck, Clock } from "lucide-react";

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
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-600 min-h-[480px] md:min-h-[560px] flex items-center">

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Decorative blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full bg-white/5 blur-2xl" />

        {/* Content */}
        <div className="relative w-full container mx-auto px-4 py-16 md:py-20">
          <div className="max-w-2xl mx-auto text-center">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-white mb-6">
              <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
              <span>Asisten Hunian Terpercaya</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight mb-4">
              Hunian <span className="text-cyan-300">Bersih</span>,<br className="hidden sm:block" />
              Hidup Nyaman
            </h1>

            <p className="text-blue-100 text-base md:text-lg mb-8 max-w-md mx-auto leading-relaxed">
              Pesan layanan kebersihan hunian Anda — unit, kasur, karpet, dan lebih. Cepat, bersih, dan terjangkau.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
              <Link
                href="/login"
                className={cn(buttonVariants({ size: "lg" }), "bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-lg shadow-blue-900/30")}
              >
                Pesan Sekarang
              </Link>
              <Link
                href="/order/track"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "bg-transparent border-white/60 text-white hover:bg-white/15 hover:text-white backdrop-blur-sm")}
              >
                Cek Status Order
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-blue-100 text-sm">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-cyan-200" />
                OB Terverifikasi
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-cyan-200" />
                Konfirmasi Cepat
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-cyan-200" />
                Hasil Terjamin
              </span>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block" preserveAspectRatio="none" style={{ display: "block" }}>
            <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" style={{ fill: "var(--background)" }} />
          </svg>
        </div>
      </section>

      {/* Catalog Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Pilih Layanan</h2>
          <p className="text-muted-foreground mt-1">
            Pilih satu atau beberapa layanan sesuai kebutuhan hunian Anda
          </p>
        </div>
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
