import { NextResponse } from "next/server";

import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const registerSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(5),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();

  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { email, phone, password, firstName, lastName } = parsed.data;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error || !data.user) {
    const rawMessage = error?.message ?? "Could not create account";
    const normalized = rawMessage.toLowerCase();
    const isDuplicateEmail =
      normalized.includes("already registered") ||
      normalized.includes("already exists") ||
      normalized.includes("duplicate") ||
      normalized.includes("unique constraint");

    const friendlyMessage = isDuplicateEmail
      ? "An account with this email already exists. Please sign in instead."
      : "Could not create account";

    return NextResponse.json(
      { error: friendlyMessage },
      { status: 400 },
    );
  }

  const user = data.user;

  const fullName = `${firstName} ${lastName}`.trim();

  await supabase.from("user_profiles").insert({
    user_id: user.id,
    email: user.email ?? email,
    full_name: fullName,
    phone,
    role: "customer",
  });

  // Ensure the user has an active session so they are signed in immediately
  if (!data.session) {
    await supabase.auth.signInWithPassword({
      email,
      password,
    });
  }

  return NextResponse.json({ success: true });
}
