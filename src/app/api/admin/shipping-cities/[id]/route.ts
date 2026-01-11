import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { getAdminSupabase } from "@/lib/admin";

const updateShippingCitySchema = z.object({
  name: z.string().min(1).optional(),
  feeCents: z.number().int().nonnegative().optional(),
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
  const parsed = updateShippingCitySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid shipping city data." },
      { status: 400 },
    );
  }

  const { id: rawId } = await context.params;
  const idResult = z.string().uuid().safeParse(rawId);

  if (!idResult.success) {
    return NextResponse.json(
      { error: `Invalid shipping city id: ${rawId}` },
      { status: 400 },
    );
  }

  const updateData: Record<string, unknown> = {};

  if (parsed.data.name !== undefined) {
    updateData.name = parsed.data.name.trim();
  }

  if (parsed.data.feeCents !== undefined) {
    updateData.fee_cents = parsed.data.feeCents;
  }

  if (parsed.data.active !== undefined) {
    updateData.active = parsed.data.active;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No shipping city fields provided for update." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("shipping_cities")
    .update(updateData)
    .eq("id", idResult.data)
    .select("id, name, fee_cents, active, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Unable to update shipping city." },
      { status: 500 },
    );
  }

  return NextResponse.json({ city: data }, { status: 200 });
}
