"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

const EGYPT_CITIES = [
  "Cairo",
  "Giza",
  "Alexandria",
  "6th of October",
  "Al Sharqia",
  "Aswan",
  "Asyut",
  "Beheira",
  "Beni Suef",
  "Dakahlia",
  "Damietta",
  "Faiyum",
  "Gharbia",
  "Helwan",
  "Ismailia",
  "Kafr El Sheikh",
  "Luxor",
  "Minya",
  "Monufia",
  "New Cairo",
  "Port Said",
  "Qalyubia",
  "Qena",
  "Red Sea",
  "Sharqia",
  "Sohag",
  "South Sinai",
  "Suez",
];

export default function CheckoutPage() {
  const { cart, clear } = useCart();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [shippingFeeCents, setShippingFeeCents] = useState<number | null>(null);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<
    | {
        code: string;
        discountCents: number;
        discountPercent: number;
      }
    | null
  >(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const hasItems = cart.items.length > 0;

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const res = await fetch("/api/site-settings/public");
        if (!res.ok) return;
        const data = (await res.json()) as {
          shippingFlatFeeCents?: number | null;
        };
        if (!cancelled) {
          setShippingFeeCents(
            typeof data.shippingFlatFeeCents === "number"
              ? data.shippingFlatFeeCents
              : 0,
          );
        }
      } catch {
        if (!cancelled) setShippingFeeCents(0);
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const shipping = shippingFeeCents ?? 0;
  const discount = appliedCoupon?.discountCents ?? 0;
  const total = Math.max(0, subtotal + shipping - discount);

  async function handleApplyCoupon(event?: React.FormEvent) {
    if (event) {
      event.preventDefault();
    }

    const raw = couponInput.trim();
    if (!raw) {
      setAppliedCoupon(null);
      setCouponError("Please enter a coupon code.");
      return;
    }

    if (subtotal <= 0) {
      setCouponError("Your cart is empty.");
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError(null);

    try {
      const response = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: raw, subtotal }),
      });

      const data = (await response.json()) as {
        code?: string;
        discountCents?: number;
        discountPercent?: number;
        error?: string;
      };

      if (!response.ok || !data.code || typeof data.discountCents !== "number") {
        setAppliedCoupon(null);
        setCouponError(data.error ?? "Coupon code is not valid.");
        setIsApplyingCoupon(false);
        return;
      }

      setAppliedCoupon({
        code: data.code,
        discountCents: data.discountCents,
        discountPercent: data.discountPercent ?? 0,
      });
      setCouponInput(data.code);
      setCouponError(null);
      setIsApplyingCoupon(false);
    } catch {
      setAppliedCoupon(null);
      setCouponError("Unable to apply coupon. Please try again.");
      setIsApplyingCoupon(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasItems || isSubmitting) return;

    const formData = new FormData(event.currentTarget);

    const couponCodeValue =
      (appliedCoupon?.code ?? couponInput.trim()) || undefined;

    const payload = {
      email: String(formData.get("email") ?? ""),
      shippingAddress: {
        fullName: String(formData.get("fullName") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        addressLine1: String(formData.get("addressLine1") ?? ""),
        addressLine2: String(formData.get("addressLine2") ?? ""),
        city: String(formData.get("city") ?? ""),
        state: String(formData.get("state") ?? ""),
        country: String(formData.get("country") ?? ""),
      },
      items: cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        size: item.size ?? null,
        color: item.color ?? null,
      })),
      couponCode: couponCodeValue,
    };

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { orderId?: string; error?: string };

      if (!response.ok || !data.orderId) {
        setError(data.error ?? "Something went wrong while placing your order.");
        setIsSubmitting(false);
        return;
      }

      clear();
      router.push(`/order/${data.orderId}`);
    } catch {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  }

  if (!hasItems) {
    return (
      <div className="space-y-4 pb-12 pt-8">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Checkout
        </h1>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Your cart is empty. Add some clothing items first.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-8 pb-12 pt-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Shipping details
        </h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Email
            </label>
            <Input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Full name
            </label>
            <Input
              name="fullName"
              required
              placeholder="Your full name"
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Mobile number
            </label>
            <Input
              name="phone"
              type="tel"
              required
              placeholder="Your mobile number"
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Address line 1
            </label>
            <Input
              name="addressLine1"
              required
              placeholder="Street and house number"
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Address line 2 (optional)
            </label>
            <Input
              name="addressLine2"
              placeholder="Apartment, suite, etc."
              className="h-9 text-sm"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">
                City
              </label>
              <select
                name="city"
                required
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                defaultValue="Cairo"
              >
                {EGYPT_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">
                State / Region (optional)
              </label>
              <Input name="state" className="h-9 text-sm" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">
                Country / Region
              </label>
              <select
                name="country"
                required
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                defaultValue="Egypt"
              >
                <option value="Egypt">Egypt</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          <Button
            type="submit"
            className="mt-2 w-full text-sm sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Placing order..." : "Place order"}
          </Button>
          <p className="pt-2 text-[11px] text-muted-foreground">
            Payment method: cash on delivery. You&apos;ll pay when your order
            arrives.
          </p>
        </form>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="text-sm font-medium tracking-tight">Order summary</h2>
          <div className="space-y-2 text-sm">
            {cart.items.map((item) => (
              <div
                key={`${item.productId}-${item.size ?? "nosize"}-${
                  item.color ?? "nocolor"
                }`}
                className="flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  {item.imageUrl && (
                    <div className="relative h-12 w-10 overflow-hidden rounded-md border border-border bg-muted">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="40px"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium tracking-tight">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {(() => {
                        const parts = [
                          item.size ? `Size ${item.size}` : null,
                          item.color ? `Color ${item.color}` : null,
                        ].filter(Boolean);
                        if (parts.length === 0) return null;
                        return <>{parts.join(" · ")} · </>;
                      })()}
                      {formatPrice(item.price)} each · Qty {item.quantity}
                    </p>
                  </div>
                </div>
                <p className="text-xs font-semibold">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="space-y-3 border-t pt-4 text-sm">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">
                Coupon code (optional)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={couponInput}
                  onChange={(event) => setCouponInput(event.target.value)}
                  placeholder="Enter coupon"
                  className="h-8 flex-1 text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => handleApplyCoupon()}
                  disabled={isApplyingCoupon}
                >
                  {isApplyingCoupon ? "Applying..." : "Apply"}
                </Button>
              </div>
              {appliedCoupon && (
                <p className="text-[11px] text-emerald-600">
                  Coupon {appliedCoupon.code} applied: -
                  {formatPrice(appliedCoupon.discountCents)}
                </p>
              )}
              {couponError && (
                <p className="text-[11px] text-red-500">{couponError}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium">
                {shipping > 0 ? formatPrice(shipping) : "Free"}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-medium text-emerald-600">
                  -{formatPrice(discount)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">{formatPrice(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
