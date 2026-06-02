import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { servicesApi } from "@/lib/api/services";
import { apiFetchData } from "@/lib/api/client";
import { OrderForm } from "@/components/order/OrderForm";
import type { ConfigItem } from "@/lib/api/types";

async function OrderPageContent() {
  const cookieStore = await cookies();
  if (!cookieStore.get("token")?.value) redirect("/login?next=/order");

  const [services, configs] = await Promise.all([
    servicesApi.list().catch(() => []),
    apiFetchData<ConfigItem[]>("/api/v1/config").catch(() => [] as ConfigItem[]),
  ]);
  const activeServices = services.filter((s) => s.is_active);

  const feeConfig = configs.find((c) => c.key === "platform_fee");
  const platformFee = feeConfig ? Number(feeConfig.value) : 0;

  return <OrderForm allServices={activeServices} platformFee={platformFee} />;
}

export default function OrderPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Pesan Layanan</h1>
      <Suspense
        fallback={
          <div className="text-center py-8 text-muted-foreground">
            Memuat layanan...
          </div>
        }
      >
        <OrderPageContent />
      </Suspense>
    </div>
  );
}
