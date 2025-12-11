import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { getAdminSupabase } from "@/lib/admin";

const updateCouponSchema = z.object({
  active: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateCouponSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid coupon data." },
      { status: 400 },
    );
  }

  const { id: rawId } = await context.params;
  const idResult = z.string().uuid().safeParse(rawId);

  if (!idResult.success) {
    return NextResponse.json(
      { error: `Invalid coupon id: ${rawId}` },
      { status: 400 },
    );
  }

  const updateData: Record<string, unknown> = {};

  if (parsed.data.active !== undefined) {
    updateData.active = parsed.data.active;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No coupon fields provided for update." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("coupons")
    .update(updateData)
    .eq("id", idResult.data)
    .select(
      "id, code, description, discount_percent, min_order_total_cents, active, created_at",
    )
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Unable to update coupon." },
      { status: 500 },
    );
  }

  return NextResponse.json({ coupon: data }, { status: 200 });
}
