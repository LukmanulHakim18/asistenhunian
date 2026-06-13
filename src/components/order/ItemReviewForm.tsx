"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { submitItemReviewAction } from "@/lib/actions/orders";
import type { OrderItem, OrderItemReview } from "@/lib/api/types";

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 focus:outline-none"
        >
          <Star
            className={cn(
              "h-7 w-7 transition-colors",
              (hover || value) >= star
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30",
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
            "h-4 w-4",
            rating >= s ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
}

export function ItemReviewForm({
  orderId,
  item,
}: {
  orderId: string;
  item: OrderItem;
}) {
  const [review, setReview] = useState<OrderItemReview | null>(item.review ?? null);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleRatingChange = (v: number) => {
    setRating(v);
    if (v > 3) setText("");
  };

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error("Pilih bintang terlebih dahulu");
      return;
    }
    startTransition(async () => {
      try {
        const result = await submitItemReviewAction(
          orderId,
          item.id,
          rating,
          text.trim() || undefined,
          rating <= 3,
        );
        setReview(result);
        toast.success("Ulasan terkirim");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal mengirim ulasan");
      }
    });
  };

  if (review) {
    const displayText = review.complaint || review.comment;
    return (
      <div className="py-4 space-y-2">
        <p className="text-sm font-medium">{item.service_name}</p>
        <StarDisplay rating={review.rating} />
        {displayText && (
          <p className="text-sm text-muted-foreground">{displayText}</p>
        )}
      </div>
    );
  }

  return (
    <div className="py-4 space-y-3">
      <p className="text-sm font-medium">{item.service_name}</p>
      <StarPicker value={rating} onChange={handleRatingChange} />
      {rating > 0 && rating <= 3 && (
        <Textarea
          placeholder="Ceritakan keluhan Anda..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          disabled={isPending}
        />
      )}
      <Button
        size="sm"
        onClick={handleSubmit}
        disabled={isPending || rating === 0}
      >
        {isPending ? "Mengirim..." : "Kirim Ulasan"}
      </Button>
    </div>
  );
}
