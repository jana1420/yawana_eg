import { NextResponse } from "next/server";

import { z } from "zod";

import { getAdminSupabase } from "@/lib/admin";

const createCouponSchema = z.object({
  code: z.string().min(1),
  description: z.string().optional(),
  discountPercent: z.number().int().min(1).max(100),
  minOrderTotalCents: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});

export async function GET() {
  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("coupons")
    .select(
      "id, code, description, discount_percent, min_order_total_cents, active, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Unable to load coupons." },
      { status: 500 },
    );
  }

  return NextResponse.json({ coupons: data ?? [] }, { status: 200 });
}

export async function POST(request: Request) {
  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createCouponSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid coupon data." },
      { status: 400 },
    );
  }

  const { code, description, discountPercent, minOrderTotalCents, active } =
    parsed.data;

  const normalizedCode = code.trim().toUpperCase();

  const { data, error } = await supabase
    .from("coupons")
    .insert({
      code: normalizedCode,
      description: description ?? null,
      discount_percent: discountPercent,
      min_order_total_cents: minOrderTotalCents ?? 0,
      active: active ?? true,
    })
    .select(
      "id, code, description, discount_percent, min_order_total_cents, active, created_at",
    )
    .single();

  if (error) {
    const message =
      error.code === "23505"
        ? "A coupon with this code already exists."
        : "Unable to create coupon.";

    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ coupon: data }, { status: 201 });
}
