import { NextResponse } from "next/server";

import { z } from "zod";

import { getAdminSupabase } from "@/lib/admin";

const createShippingCitySchema = z.object({
  name: z.string().min(1),
  feeCents: z.number().int().nonnegative(),
  active: z.boolean().optional(),
});

export async function GET() {
  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("shipping_cities")
    .select("id, name, fee_cents, active, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Unable to load shipping cities." },
      { status: 500 },
    );
  }

  return NextResponse.json({ cities: data ?? [] }, { status: 200 });
}

export async function POST(request: Request) {
  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createShippingCitySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid shipping city data." },
      { status: 400 },
    );
  }

  const { name, feeCents, active } = parsed.data;

  const trimmedName = name.trim();

  const { data, error } = await supabase
    .from("shipping_cities")
    .insert({
      name: trimmedName,
      fee_cents: feeCents,
      active: active ?? true,
    })
    .select("id, name, fee_cents, active, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Unable to create shipping city." },
      { status: 400 },
    );
  }

  return NextResponse.json({ city: data }, { status: 201 });
}
