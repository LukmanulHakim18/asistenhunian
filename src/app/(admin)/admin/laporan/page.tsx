import { adminApi } from "@/lib/api/admin";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, CreditCard, Smartphone, TrendingUp, Receipt } from "lucide-react";

export const dynamic = "force-dynamic";

function formatMonth(dateStr: string) {
  return new Date(dateStr + "-01").toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
  });
}

export default async function AdminRevenueReportPage() {
  const rows = await adminApi.laporan().catch(() => []);

  const totalBruto = rows.reduce((s, r) => s + r.total_revenue, 0);
  const totalCash = rows.reduce((s, r) => s + r.cash_revenue, 0);
  const totalTransfer = rows.reduce((s, r) => s + r.transfer_revenue, 0);
  const totalQris = rows.reduce((s, r) => s + r.qris_revenue, 0);
  const totalOrders = rows.reduce((s, r) => s + r.total_orders, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Laporan Keuangan</h1>
        <p className="text-muted-foreground">Rekap pendapatan bruto per bulan</p>
      </div>

      {/* Summary cards */}
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
            <p className="text-xs text-muted-foreground mt-1">{totalOrders} order</p>
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
            <p className="text-xl font-bold">{formatCurrency(totalCash)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              Transfer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatCurrency(totalTransfer)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-purple-600" />
              QRIS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatCurrency(totalQris)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly breakdown */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Rekap Bulanan</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada data.</p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Bulan</th>
                  <th className="text-right px-4 py-3 font-medium">Order</th>
                  <th className="text-right px-4 py-3 font-medium">Selesai</th>
                  <th className="text-right px-4 py-3 font-medium">Tunai</th>
                  <th className="text-right px-4 py-3 font-medium">Transfer</th>
                  <th className="text-right px-4 py-3 font-medium">QRIS</th>
                  <th className="text-right px-4 py-3 font-medium text-primary">Total Bruto</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => (
                  <tr key={row.month} className="bg-background hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{formatMonth(row.month)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{row.total_orders}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{row.completed_orders}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(row.cash_revenue)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(row.transfer_revenue)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(row.qris_revenue)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">
                      {formatCurrency(row.total_revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50 border-t-2">
                <tr>
                  <td className="px-4 py-3 font-bold">Total</td>
                  <td className="px-4 py-3 text-right font-bold">{totalOrders}</td>
                  <td className="px-4 py-3 text-right font-bold">
                    {rows.reduce((s, r) => s + r.completed_orders, 0)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold">{formatCurrency(totalCash)}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatCurrency(totalTransfer)}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatCurrency(totalQris)}</td>
                  <td className="px-4 py-3 text-right font-bold text-primary">{formatCurrency(totalBruto)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
            <Receipt className="h-4 w-4 text-orange-500" />
            Rata-rata per Order
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-bold">
            {totalOrders > 0 ? formatCurrency(Math.round(totalBruto / totalOrders)) : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">dari {totalOrders} order</p>
        </CardContent>
      </Card>
    </div>
  );
}
