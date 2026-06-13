import { ordersApi } from "@/lib/api/orders";
import { redirect, notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OrderByIdRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await ordersApi.detail(id).catch(() => null);
  if (!order) notFound();

  redirect(`/order/${order.order_number}/track`);
}
