import { redirect } from "next/navigation";

import { getAdminSupabase } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-service";
import { Card, CardContent } from "@/components/ui/card";
import { AdminQuickNav } from "@/components/admin/admin-quick-nav";

export default async function AdminCustomersPage() {
  const { isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    redirect("/login?from=/admin/customers");
  }

  const adminClient = createSupabaseAdminClient();

  const { data } = await adminClient
    .from("user_profiles")
    .select("id, email, full_name, phone, role, created_at")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  const customers = (data ?? []) as unknown as {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    role: string;
    created_at: string;
  }[];

  return (
    <div className="space-y-6 pb-12 pt-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Customers
        </h1>
        <p className="text-sm text-muted-foreground">
          People who created an account on your store.
        </p>
      </div>

      <AdminQuickNav />

      <Card>
        <CardContent className="space-y-3 p-4 text-xs">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium tracking-tight">Customer list</h2>
            <span className="text-[11px] text-muted-foreground">
              Total {customers.length}
            </span>
          </div>
          {customers.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No customers have registered accounts yet.
            </p>
          ) : (
            <div className="space-y-1.5 text-xs">
              <div className="hidden gap-3 pb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:grid sm:grid-cols-[minmax(0,1.7fr)_minmax(0,1.7fr)_minmax(0,1.1fr)_minmax(0,1.1fr)]">
                <span>Name</span>
                <span>Email</span>
                <span>Phone</span>
                <span className="text-right">Since</span>
              </div>
              {customers.map((customer) => {
                const createdAt = customer.created_at
                  ? new Date(customer.created_at).toLocaleString("en-EG", {
                      timeZone: "Africa/Cairo",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "";

                const name = customer.full_name ?? "";

                return (
                  <div
                    key={customer.id}
                    className="grid grid-cols-1 items-start gap-2 py-1.5 sm:grid-cols-[minmax(0,1.7fr)_minmax(0,1.7fr)_minmax(0,1.1fr)_minmax(0,1.1fr)] sm:items-center"
                  >
                    <span className="truncate">{name || "(No name)"}</span>
                    <span className="truncate text-xs">{customer.email}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {customer.phone || "-"}
                    </span>
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
    </div>
  );
}
