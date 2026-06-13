"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { submitReviewAction } from "@/lib/actions/orders";
import type { Review } from "@/lib/api/types";

function StarPicker({ value, onChange, onClearComment }: { value: number; onChange: (v: number) => void; onClearComment: () => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => { onChange(star); if (star > 3) onClearComment(); }}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 focus:outline-none"
        >
          <Star
            className={cn(
              "h-8 w-8 transition-colors",
              (hover || value) >= star
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            "h-5 w-5",
            rating >= s ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
}

export function ReviewSection({
  orderId,
  initialReview,
}: {
  orderId: string;
  initialReview: Review | null;
}) {
  const [review, setReview] = useState<Review | null>(initialReview);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();

  if (review) {
    return (
      <Card className="mb-4 border-green-200 bg-green-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ulasan Anda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <StarDisplay rating={review.rating} />
          {review.comment && (
            <p className="text-sm text-muted-foreground">{review.comment}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error("Pilih bintang terlebih dahulu");
      return;
    }
    startTransition(async () => {
      try {
        const result = await submitReviewAction(orderId, rating, comment.trim() || undefined);
        setReview(result);
        toast.success("Ulasan berhasil dikirim");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal mengirim ulasan");
      }
    });
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Beri Ulasan</CardTitle>
        <p className="text-sm text-muted-foreground">
          Bagaimana pengalaman layanan Anda?
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <StarPicker value={rating} onChange={setRating} onClearComment={() => setComment("")} />
        {rating > 0 && rating <= 3 && (
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Keluhan <span className="text-muted-foreground font-normal">(opsional)</span></p>
            <Textarea
              placeholder="Ceritakan kendala atau keluhan Anda..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              disabled={isPending}
            />
          </div>
        )}
        <Button
          onClick={handleSubmit}
          disabled={isPending || rating === 0}
          className="w-full"
        >
          {isPending ? "Mengirim..." : "Kirim Ulasan"}
        </Button>
      </CardContent>
    </Card>
  );
}
