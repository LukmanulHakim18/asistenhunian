import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { servicesApi } from "@/lib/api/services";
import { OrderForm } from "@/components/order/OrderForm";

async function OrderPageContent() {
  const cookieStore = await cookies();
  if (!cookieStore.get("token")?.value) redirect("/login?next=/order");

  const services = await servicesApi.list().catch(() => []);
  const activeServices = services.filter((s) => s.is_active);

  return <OrderForm allServices={activeServices} />;
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
