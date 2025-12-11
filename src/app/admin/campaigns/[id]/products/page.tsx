import { redirect } from "next/navigation";

import { getAdminSupabase } from "@/lib/admin";
import { Card, CardContent } from "@/components/ui/card";
import { AdminQuickNav } from "@/components/admin/admin-quick-nav";
import { CampaignProductsAdminPanel } from "@/components/admin/campaign-products-admin-panel";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminCampaignProductsPage({ params }: PageProps) {
  const { id } = await params;

  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    redirect(`/login?from=/admin/campaigns/${id}/products`);
  }

  const { data: campaign } = await supabase
    .from("brand_campaigns")
    .select("id, slug, title, brand_name, is_active")
    .eq("id", id)
    .maybeSingle();

  if (!campaign) {
    redirect("/admin/campaigns");
  }

  const { data: campaignProductRows } = await supabase
    .from("brand_campaign_products")
    .select("product_id, sort_order, highlight_badge, outfit_note")
    .eq("campaign_id", id)
    .order("sort_order", { ascending: true });

  const { data: productRows } = await supabase
    .from("products")
    .select("id, name, slug, stock, images, created_at")
    .order("created_at", { ascending: false })
    .limit(120);

  const selectedMap = new Map<
    string,
    { highlightBadge: string | null; outfitNote: string | null; sortOrder: number }
  >();

  for (const row of campaignProductRows ?? []) {
    selectedMap.set(row.product_id as string, {
      highlightBadge: (row as { highlight_badge?: string | null }).highlight_badge ?? null,
      outfitNote: (row as { outfit_note?: string | null }).outfit_note ?? null,
      sortOrder: (row as { sort_order?: number | null }).sort_order ?? 0,
    });
  }

  const initialProducts = (productRows ?? []).map((row) => {
    const selectedInfo = selectedMap.get(row.id as string) ?? null;

    return {
      id: row.id as string,
      name: row.name as string,
      slug: row.slug as string,
      stock: (row as { stock?: number | null }).stock ?? 0,
      images: (row as { images?: string[] | null }).images ?? [],
      selected: Boolean(selectedInfo),
      highlightBadge: selectedInfo?.highlightBadge ?? "",
      outfitNote: selectedInfo?.outfitNote ?? "",
      sortOrder: selectedInfo?.sortOrder ?? 0,
    };
  });

  initialProducts.sort((a, b) => {
    if (a.selected && b.selected) {
      return a.sortOrder - b.sortOrder;
    }
    if (a.selected) return -1;
    if (b.selected) return 1;
    return 0;
  });

  const panelProducts = initialProducts.map(({ sortOrder, ...rest }) => rest);

  return (
    <div className="space-y-6 pb-12 pt-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Campaign products
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose which products appear in the campaign
          {campaign.brand_name ? ` for ${campaign.brand_name}` : ""}. Title:
          {" "}
          <span className="font-medium">{campaign.title}</span>
        </p>
      </div>

      <AdminQuickNav />

      <Card>
        <CardContent className="p-4">
          <CampaignProductsAdminPanel
            campaignId={campaign.id as string}
            campaignTitle={campaign.title as string}
            initialProducts={panelProducts}
          />
        </CardContent>
      </Card>
    </div>
  );
}
