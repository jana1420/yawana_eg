import { redirect } from "next/navigation";

import { getAdminSupabase } from "@/lib/admin";
import { AdminQuickNav } from "@/components/admin/admin-quick-nav";
import { ShippingCitiesAdminPanel } from "@/components/admin/shipping-cities-admin-panel";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminShippingPage() {
  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    redirect("/login?from=/admin/shipping");
  }

  const { data } = await supabase
    .from("shipping_cities")
    .select("id, name, fee_cents, active, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 pb-12 pt-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Shipping fees
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage delivery cities/areas and their shipping fees.
        </p>
      </div>
      <AdminQuickNav />
      <Card>
        <CardContent className="p-6">
          <ShippingCitiesAdminPanel initialCities={data ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
