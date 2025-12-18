import { redirect } from "next/navigation";

import { getAdminSupabase } from "@/lib/admin";
import { Card, CardContent } from "@/components/ui/card";
import { AdminQuickNav } from "@/components/admin/admin-quick-nav";
import { AdminCreateAdminForm } from "@/components/admin/admin-create-admin-form";

export default async function AdminAdminsPage() {
  const { supabase, isAdmin, user } = await getAdminSupabase();

  if (!isAdmin) {
    redirect("/login?from=/admin/admins");
  }

  const [{ data: profiles }, { data: rawLogs }] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("id, email, full_name, role, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("admin_activity_logs")
      .select("id, user_profile_id, action, entity_type, entity_id, description, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const profilesArray = profiles ?? [];
  const admins = profilesArray.filter((profile) => profile.role === "admin");

  const profileById = new Map<
    string,
    { id: string; email: string; full_name: string | null; role: string; created_at: string }
  >();

  for (const profile of profilesArray as unknown as {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    created_at: string;
  }[]) {
    profileById.set(profile.id, profile);
  }

  const logs = (rawLogs ?? []) as unknown as {
    id: string;
    user_profile_id: string | null;
    action: string;
    entity_type: string;
    entity_id: string | null;
    description: string | null;
    created_at: string;
  }[];

  return (
    <div className="space-y-6 pb-12 pt-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Admin team
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage the admins who can access the RimalTold dashboard.
        </p>
      </div>

      <AdminQuickNav />

      <Card>
        <CardContent className="space-y-3 p-4 text-xs">
          <div className="space-y-0.5">
            <h2 className="text-sm font-medium tracking-tight">
              Add a new admin
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Create an admin account with full access to the dashboard. Share the
              email and password privately so they can sign in.
            </p>
          </div>
          <AdminCreateAdminForm />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4 text-xs">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium tracking-tight">Admins</h2>
            {user?.email && (
              <span className="text-[11px] text-muted-foreground">
                You are signed in as <span className="font-medium">{user.email}</span>
              </span>
            )}
          </div>
          {admins.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No admins found yet. Existing users can register from the public
              signup page; you can then promote them to admin inside Supabase or
              from a future mini CRM screen.
            </p>
          ) : (
            <div className="space-y-1.5 text-xs">
              <div className="hidden gap-3 pb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:grid sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1.6fr)_minmax(0,1fr)]">
                <span>Name</span>
                <span>Email</span>
                <span className="text-right">Since</span>
              </div>
              {admins.map((admin) => {
                const createdAt = admin.created_at
                  ? new Date(admin.created_at as string).toLocaleDateString()
                  : "";

                const name = (admin.full_name as string | null) ?? "";

                return (
                  <div
                    key={admin.id}
                    className="grid grid-cols-1 items-start gap-2 py-1.5 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1.6fr)_minmax(0,1fr)] sm:items-center"
                  >
                    <span className="truncate">{name || "(No name)"}</span>
                    <span className="truncate text-xs">{admin.email}</span>
                    <span className="text-right text-[11px] text-muted-foreground">
                      {createdAt}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4 text-xs">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium tracking-tight">
              Admin activity history
            </h2>
            <span className="text-[11px] text-muted-foreground">
              Showing latest {logs.length} actions
            </span>
          </div>
          {logs.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No admin activity has been logged yet.
            </p>
          ) : (
            <div className="space-y-1.5 text-xs">
              <div className="hidden gap-3 pb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:grid sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1.4fr)_minmax(0,2fr)_minmax(0,1.1fr)]">
                <span>Admin</span>
                <span>Action</span>
                <span>Details</span>
                <span className="text-right">When</span>
              </div>
              {logs.map((log) => {
                const profile = log.user_profile_id
                  ? profileById.get(log.user_profile_id)
                  : undefined;

                const createdAtDate = new Date(log.created_at);
                const when = createdAtDate.toLocaleString();

                const adminLabel = profile
                  ? `${profile.full_name || "(No name)"} – ${profile.email}`
                  : "Unknown admin";

                const actionLabel = log.action.replace(/_/g, " ");

                const details = log.description ||
                  `${log.entity_type}${log.entity_id ? ` (${log.entity_id})` : ""}`;

                return (
                  <div
                    key={log.id}
                    className="grid grid-cols-1 items-start gap-2 rounded-md bg-muted/60 px-2 py-1.5 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1.4fr)_minmax(0,2fr)_minmax(0,1.1fr)] sm:items-center"
                  >
                    <span className="truncate">{adminLabel}</span>
                    <span className="truncate capitalize">{actionLabel}</span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {details}
                    </span>
                    <span className="text-right text-[11px] text-muted-foreground">
                      {when}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
