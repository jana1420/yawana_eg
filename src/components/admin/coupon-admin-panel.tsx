"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_percent: number;
  min_order_total_cents: number;
  active: boolean;
  created_at: string;
};

type CouponAdminPanelProps = {
  initialCoupons: Coupon[];
};

export function CouponAdminPanel({ initialCoupons }: CouponAdminPanelProps) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountPercent, setDiscountPercent] = useState("10");
  const [minOrderTotal, setMinOrderTotal] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyCouponId, setBusyCouponId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateCoupon(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError("Coupon code is required.");
      return;
    }

    const percentNumber = Number.parseInt(discountPercent, 10);
    if (!Number.isFinite(percentNumber) || percentNumber <= 0 || percentNumber > 100) {
      setError("Discount must be between 1 and 100 percent.");
      return;
    }

    const minOrderNumber = Number.parseFloat(minOrderTotal.replace(",", "."));
    if (!Number.isFinite(minOrderNumber) || minOrderNumber < 0) {
      setError("Minimum order total must be a non-negative number.");
      return;
    }

    const minOrderTotalCents = Math.round(minOrderNumber * 100);

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: trimmedCode,
          description: description.trim() || undefined,
          discountPercent: percentNumber,
          minOrderTotalCents,
          active: isActive,
        }),
      });

      const data = (await response.json()) as { coupon?: Coupon; error?: string };

      if (!response.ok || !data.coupon) {
        setError(data.error ?? "Unable to create coupon.");
        setIsSubmitting(false);
        return;
      }

      setCoupons((prev) => [data.coupon as Coupon, ...prev]);
      setCode("");
      setDescription("");
      setDiscountPercent("10");
      setMinOrderTotal("0");
      setIsActive(true);
      setIsSubmitting(false);
    } catch {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(coupon: Coupon) {
    if (busyCouponId) return;

    setBusyCouponId(coupon.id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ active: !coupon.active }),
      });

      const data = (await response.json()) as { coupon?: Coupon; error?: string };

      if (!response.ok || !data.coupon) {
        setError(data.error ?? "Unable to update coupon.");
        setBusyCouponId(null);
        return;
      }

      setCoupons((prev) =>
        prev.map((item) => (item.id === coupon.id ? (data.coupon as Coupon) : item)),
      );
      setBusyCouponId(null);
    } catch {
      setError("Network error. Please try again.");
      setBusyCouponId(null);
    }
  }

  return (
    <div className="space-y-6">
      <form className="space-y-4" onSubmit={handleCreateCoupon}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Coupon code
            </label>
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="e.g. ZEKRY10"
              className="h-9 text-sm uppercase"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Discount (%)
            </label>
            <Input
              value={discountPercent}
              onChange={(event) => setDiscountPercent(event.target.value)}
              inputMode="numeric"
              className="h-9 text-sm"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Minimum order total (EGP, optional)
            </label>
            <Input
              value={minOrderTotal}
              onChange={(event) => setMinOrderTotal(event.target.value)}
              inputMode="decimal"
              placeholder="0"
              className="h-9 text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Coupon applies only when the order subtotal is at least this amount.
            </p>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Description (optional)
            </label>
            <Input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Internal note, e.g. Black Friday"
              className="h-9 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 text-xs">
          <input
            id="coupon-active"
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="h-3 w-3 rounded border-input text-primary"
          />
          <label htmlFor="coupon-active" className="text-xs text-muted-foreground">
            Coupon is active
          </label>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <Button
          type="submit"
          className="mt-2 w-full text-sm sm:w-auto"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating coupon..." : "Create coupon"}
        </Button>
      </form>

      <div className="space-y-2 border-t pt-4">
        <h2 className="text-sm font-medium tracking-tight">Existing coupons</h2>
        {coupons.length === 0 ? (
          <p className="text-xs text-muted-foreground">No coupons created yet.</p>
        ) : (
          <div className="space-y-1 text-xs">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 bg-muted/40 px-3 py-2"
              >
                <div className="space-y-0.5">
                  <p className="text-[11px] font-semibold tracking-[0.16em]">
                    {coupon.code}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {coupon.discount_percent}% off
                    {coupon.min_order_total_cents > 0 && (
                      <>
                        {" "}on orders from EGP {Math.round(
                          coupon.min_order_total_cents / 100,
                        )}
                      </>
                    )}
                    {coupon.description && ` - ${coupon.description}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-medium ${
                      coupon.active
                        ? "text-emerald-600"
                        : "text-muted-foreground line-through"
                    }`}
                  >
                    {coupon.active ? "Active" : "Inactive"}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[11px]"
                    onClick={() => handleToggleActive(coupon)}
                    disabled={busyCouponId === coupon.id}
                  >
                    {coupon.active ? "Turn off" : "Turn on"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
