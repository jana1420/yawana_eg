import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("shipping_cities")
    .select("id, name, fee_cents, active")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Unable to load shipping cities." },
      { status: 500 },
    );
  }

  const cities = (data ?? []).map((city) => ({
    id: city.id as string,
    name: city.name as string,
    feeCents: (city.fee_cents as number | null) ?? 0,
  }));

  return NextResponse.json({ cities }, { status: 200 });
}
