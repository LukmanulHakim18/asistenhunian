import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-4 w-4 ${rating >= s ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export default async function AdminReviewsPage() {
  const reviews = await adminApi.listReviews().catch(() => []);

  const avg =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manajemen Review</h1>
        <p className="text-muted-foreground text-sm">
          {reviews.length} ulasan{avg ? ` · rata-rata ${avg} bintang` : ""}
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 font-medium">Order</th>
                <th className="text-left px-4 py-3 font-medium">Rating</th>
                <th className="text-left px-4 py-3 font-medium">Komentar</th>
                <th className="text-left px-4 py-3 font-medium">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                    Belum ada ulasan
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${review.order_id}`}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {review.order_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StarDisplay rating={review.rating} />
                    </td>
                    <td className="px-4 py-3 max-w-sm">
                      <span className="text-muted-foreground line-clamp-2">
                        {review.comment ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatDate(review.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
