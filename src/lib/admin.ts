import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getAdminSupabase() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, isAdmin: false, adminProfileId: null } as const;
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  const isAdmin = profile?.role === "admin";
  const adminProfileId = profile?.id ?? null;

  return { supabase, user, isAdmin, adminProfileId } as const;
}

type AdminActivityPayload = {
  action: string;
  entityType: string;
  entityId?: string | null;
  description?: string | null;
};

export async function logAdminActivity(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  adminProfileId: string | null,
  payload: AdminActivityPayload,
) {
  if (!adminProfileId) return;

  const { action, entityType, entityId = null, description = null } = payload;

  try {
    await supabase.from("admin_activity_logs").insert({
      user_profile_id: adminProfileId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      description,
    });
  } catch {
    // Logging failures should never break the main admin action.
  }
}
