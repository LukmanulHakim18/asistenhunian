import { adminApi } from "@/lib/api/admin";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, CreditCard, TrendingUp, Receipt } from "lucide-react";

export const dynamic = "force-dynamic";

function formatMonth(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
  });
}

function getMonthKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function AdminRevenueReportPage() {
  const allOrders = await adminApi.listOrders().catch(() => []);
  const orders = allOrders.filter((o) => o.status === "completed");

  const totalBruto = orders.reduce((s, o) => s + o.total, 0);
  const cashOrders = orders.filter((o) => o.payment_method === "cash");
  const transferOrders = orders.filter((o) => o.payment_method !== "cash");
  const cashTotal = cashOrders.reduce((s, o) => s + o.total, 0);
  const transferTotal = transferOrders.reduce((s, o) => s + o.total, 0);

  // Group by month
  const monthlyMap = new Map<string, { label: string; cash: number; transfer: number; count: number }>();
  for (const o of orders) {
    const key = getMonthKey(o.requested_date);
    const existing = monthlyMap.get(key) ?? {
      label: formatMonth(o.requested_date),
      cash: 0,
      transfer: 0,
      count: 0,
    };
    if (o.payment_method === "cash") existing.cash += o.total;
    else existing.transfer += o.total;
    existing.count += 1;
    monthlyMap.set(key, existing);
  }
  const monthlyRows = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, v]) => v);


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Laporan Keuangan</h1>
        <p className="text-muted-foreground">
          Rekap pendapatan bruto dari {orders.length} order selesai
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Bruto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-primary">{formatCurrency(totalBruto)}</p>
            <p className="text-xs text-muted-foreground mt-1">{orders.length} order</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Banknote className="h-4 w-4 text-green-600" />
              Tunai (Cash)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatCurrency(cashTotal)}</p>
            <p className="text-xs text-muted-foreground mt-1">{cashOrders.length} order</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              Transfer Online
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatCurrency(transferTotal)}</p>
            <p className="text-xs text-muted-foreground mt-1">{transferOrders.length} order</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Receipt className="h-4 w-4 text-orange-500" />
              Rata-rata per Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              {orders.length > 0 ? formatCurrency(Math.round(totalBruto / orders.length)) : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">dari semua order selesai</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Rekap Bulanan</h2>
        {monthlyRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada data.</p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Bulan</th>
                  <th className="text-right px-4 py-3 font-medium">Order</th>
                  <th className="text-right px-4 py-3 font-medium">Tunai</th>
                  <th className="text-right px-4 py-3 font-medium">Transfer</th>
                  <th className="text-right px-4 py-3 font-medium text-primary">Total Bruto</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {monthlyRows.map((row, i) => (
                  <tr key={i} className="bg-background hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{row.label}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{row.count}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(row.cash)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(row.transfer)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">
                      {formatCurrency(row.cash + row.transfer)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50 border-t-2">
                <tr>
                  <td className="px-4 py-3 font-bold">Total</td>
                  <td className="px-4 py-3 text-right font-bold">{orders.length}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatCurrency(cashTotal)}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatCurrency(transferTotal)}</td>
                  <td className="px-4 py-3 text-right font-bold text-primary">{formatCurrency(totalBruto)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
