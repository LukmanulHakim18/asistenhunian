import { ordersApi } from "@/lib/api/orders";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OrderList } from "@/components/customer/OrderList";

export const dynamic = "force-dynamic";

export default async function CustomerDashboardPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get("token")?.value) redirect("/login?next=/dashboard");

  const orders = await ordersApi.list().catch(() => []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Order Saya</h1>
        <Link href="/order" className={cn(buttonVariants({ size: "sm" }))}>
          Pesan Baru
        </Link>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Belum ada order.</p>
            <Link href="/order" className={cn(buttonVariants())}>
              Buat Order Pertama
            </Link>
          </CardContent>
        </Card>
      ) : (
        <OrderList orders={orders} />
      )}
    </div>
  );
}
