"use client";

import { useEffect, useState } from "react";

import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
};

type ProductReviewsProps = {
  product: Product;
};

function Stars({ value }: { value: number }) {
  const full = Math.round(value * 2) / 2;
  return (
    <div className="inline-flex items-center gap-0.5 text-xs text-yellow-500">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i + 1 <= full;
        return (
          <span key={i}>{filled ? "★" : "☆"}</span>
        );
      })}
    </div>
  );
}

export function ProductReviews({ product }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState<number | null>(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadReviews() {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${product.slug}/reviews`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setReviews(Array.isArray(data.reviews) ? data.reviews : []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadReviews();

    return () => {
      cancelled = true;
    };
  }, [product.slug]);

  const averageRating =
    reviews.length === 0
      ? 0
      : reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/products/${product.slug}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating, comment }),
      });

      if (!res.ok) {
        let message = "Something went wrong";

        try {
          const data = await res.json();
          if (res.status === 401) {
            message =
              "Please sign in or create an account to write a review.";
          } else if (data && typeof data.error === "string") {
            message = data.error;
          }
        } catch {
        }

        setError(message);
        return;
      }

      // Refresh list
      const refreshed = await fetch(`/api/products/${product.slug}/reviews`);
      if (refreshed.ok) {
        const data = await refreshed.json();
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
        setComment("");
        setRating(5);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl border bg-muted/30 p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight">Reviews</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Stars value={averageRating} />
              <span>
                {averageRating.toFixed(1)} · {reviews.length} review
                {reviews.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
        {reviews.length === 0 && (
          <span className="rounded-full bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
            Be the first to review
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-1 space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium">Your rating</label>
          <select
            className="h-7 rounded-md border bg-background px-2 text-xs"
            value={rating ?? ""}
            onChange={(e) => setRating(Number(e.target.value) || null)}
          >
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value} star{value !== 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>
        <textarea
          className="min-h-[60px] w-full rounded-md border bg-background px-2 py-1 text-xs"
          placeholder="Share your experience with this product (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        {error && (
          <p className="text-[11px] text-red-500">{error}</p>
        )}
        <Button
          type="submit"
          size="sm"
          className="h-7 px-3 text-xs"
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit review"}
        </Button>
        {loading && reviews.length === 0 && (
          <p className="text-[11px] text-muted-foreground">Loading reviews...</p>
        )}
      </form>

      {reviews.length > 0 && (
        <div className="mt-4 space-y-2 text-xs">
          {reviews.slice(0, 5).map((review) => (
            <div
              key={review.id}
              className="rounded-lg border border-border bg-muted/40 p-2.5"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <Stars value={review.rating} />
                <span className="text-[10px] text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              {review.comment && (
                <p className="text-[11px] leading-snug text-muted-foreground">
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
