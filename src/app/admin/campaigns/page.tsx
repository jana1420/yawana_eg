import { redirect } from "next/navigation";

import { getAdminSupabase } from "@/lib/admin";
import { Card, CardContent } from "@/components/ui/card";
import { AdminQuickNav } from "@/components/admin/admin-quick-nav";
import { CampaignAdminPanel } from "@/components/admin/campaign-admin-panel";

export default async function AdminCampaignsPage() {
  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    redirect("/login?from=/admin/campaigns");
  }

  const { data } = await supabase
    .from("brand_campaigns")
    .select(
      "id, slug, title, subtitle, brand_name, hero_image_url, is_active, created_at",
    )
    .order("created_at", { ascending: false });

  const campaigns = (data ?? []) as unknown as {
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    brand_name: string | null;
    hero_image_url: string | null;
    is_active: boolean;
    created_at: string;
  }[];

  return (
    <div className="space-y-6 pb-12 pt-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Brand campaigns
        </h1>
        <p className="text-sm text-muted-foreground">
          Mini showroom pages that highlight specific brands or drops.
        </p>
      </div>

      <AdminQuickNav />

      <Card>
        <CardContent className="p-4">
          <CampaignAdminPanel initialCampaigns={campaigns} />
        </CardContent>
      </Card>
    </div>
  );
}
