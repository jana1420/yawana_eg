import { NextResponse } from "next/server";

import { z } from "zod";

import { getAdminSupabase, logAdminActivity } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-service";

const createAdminSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  phone: z.string().min(5).optional().nullable(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  const { supabase, isAdmin, adminProfileId } = await getAdminSupabase();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();

  const parsed = createAdminSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { email, fullName, phone, password } = parsed.data;

  const adminClient = createSupabaseAdminClient();

  const {
    data: createResult,
    error: createError,
  } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      phone,
    },
  });

  if (createError || !createResult?.user) {
    return NextResponse.json(
      { error: createError?.message ?? "Could not create admin user" },
      { status: 500 },
    );
  }

  const user = createResult.user;

  const { error: profileError } = await adminClient.from("user_profiles").insert({
    user_id: user.id,
    email: user.email ?? email,
    full_name: fullName,
    phone: phone ?? null,
    role: "admin",
  });

  if (profileError) {
    return NextResponse.json(
      { error: profileError.message ?? "Could not create admin profile" },
      { status: 500 },
    );
  }

  await logAdminActivity(supabase, adminProfileId, {
    action: "create_admin",
    entityType: "admin_user",
    entityId: user.id,
    description: `Created admin "${fullName || email}"`,
  });

  return NextResponse.json({ id: user.id }, { status: 201 });
}
