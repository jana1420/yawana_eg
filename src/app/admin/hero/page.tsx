import { redirect } from "next/navigation";

import { getAdminSupabase } from "@/lib/admin";
import { Card, CardContent } from "@/components/ui/card";
import { HeroForm } from "@/components/admin/hero-form";
import { AdminQuickNav } from "@/components/admin/admin-quick-nav";

export default async function AdminHeroPage() {
  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    redirect("/login?from=/admin/hero");
  }

  const { data } = await supabase
    .from("site_settings")
    .select(
      "hero_title, hero_subtitle, hero_image_url, hero_primary_label, hero_primary_href, hero_secondary_label, hero_secondary_href, hero_banner_text, hero_additional_image_urls",
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const initialValues = data
    ? {
        heroTitle: data.hero_title ?? "",
        heroSubtitle: data.hero_subtitle ?? "",
        heroImageUrl: data.hero_image_url ?? "",
        heroAdditionalImageUrls: (data.hero_additional_image_urls as string[] | null) ?? [],
        heroPrimaryLabel: data.hero_primary_label ?? "",
        heroPrimaryHref: data.hero_primary_href ?? "",
        heroSecondaryLabel: data.hero_secondary_label ?? "",
        heroSecondaryHref: data.hero_secondary_href ?? "",
        heroBannerText: data.hero_banner_text ?? "",
      }
    : undefined;

  return (
    <div className="space-y-6 pb-12 pt-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Homepage hero
        </h1>
        <p className="text-sm text-muted-foreground">
          Customize the main hero section shown at the top of the storefront.
        </p>
      </div>
      <AdminQuickNav />
      <Card>
        <CardContent className="p-6">
          <HeroForm initialValues={initialValues} />
        </CardContent>
      </Card>
    </div>
  );
}
