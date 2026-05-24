import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { OrderForm } from "@/components/order/OrderForm";
import { redirect } from "next/navigation";

async function OrderPageContent() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/order");

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return <OrderForm allServices={services ?? []} />;
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
