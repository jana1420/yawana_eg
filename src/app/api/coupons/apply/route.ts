import { NextResponse } from "next/server";

import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const applyCouponSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().int().nonnegative(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const parsed = applyCouponSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid coupon payload." },
      { status: 400 },
    );
  }

  const { code, subtotal } = parsed.data;
  const normalized = code.trim().toUpperCase();

  if (!normalized) {
    return NextResponse.json(
      { error: "Coupon code is required." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("code, discount_percent, min_order_total_cents, active")
    .eq("code", normalized)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Unable to validate coupon right now." },
      { status: 500 },
    );
  }

  if (!coupon || !(coupon.active as boolean)) {
    return NextResponse.json(
      { error: "Coupon code is invalid or inactive." },
      { status: 400 },
    );
  }

  const minTotal =
    (coupon.min_order_total_cents as number | null) != null
      ? (coupon.min_order_total_cents as number)
      : 0;

  if (subtotal < minTotal) {
    return NextResponse.json(
      { error: "Order total is too low for this coupon." },
      { status: 400 },
    );
  }

  const percent = (coupon.discount_percent as number) ?? 0;

  if (percent <= 0 || percent > 100) {
    return NextResponse.json(
      { error: "Coupon configuration is invalid." },
      { status: 500 },
    );
  }

  const discountCents = Math.floor((subtotal * percent) / 100);

  if (discountCents <= 0) {
    return NextResponse.json(
      { error: "Coupon does not apply to this order." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    code: coupon.code,
    discountPercent: percent,
    discountCents,
    minOrderTotalCents: minTotal,
  });
}
