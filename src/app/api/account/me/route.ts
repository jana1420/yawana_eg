import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, role")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json(
    {
      user: {
        id: user.id,
        email: user.email,
      },
      profile,
    },
    { status: 200 },
  );
}
