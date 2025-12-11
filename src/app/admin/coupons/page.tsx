import { redirect } from "next/navigation";

import { getAdminSupabase } from "@/lib/admin";
import { AdminQuickNav } from "@/components/admin/admin-quick-nav";
import { CouponAdminPanel } from "@/components/admin/coupon-admin-panel";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminCouponsPage() {
  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    redirect("/login?from=/admin/coupons");
  }

  const { data } = await supabase
    .from("coupons")
    .select(
      "id, code, description, discount_percent, min_order_total_cents, active, created_at",
    )
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 pb-12 pt-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Coupons
        </h1>
        <p className="text-sm text-muted-foreground">
          Generate discount codes that customers can apply at checkout.
        </p>
      </div>
      <AdminQuickNav />
      <Card>
        <CardContent className="p-6">
          <CouponAdminPanel initialCoupons={data ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
