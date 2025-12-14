import { redirect } from "next/navigation";

import { getAdminSupabase } from "@/lib/admin";
import { Card, CardContent } from "@/components/ui/card";
import { AdminQuickNav } from "@/components/admin/admin-quick-nav";
import { AboutSettingsForm } from "@/components/admin/about-settings-form";

export default async function AdminAboutPage() {
  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    redirect("/login?from=/admin/about");
  }

  const { data } = await supabase
    .from("site_settings")
    .select(
      "about_enabled, about_title, about_body, about_image1_url, about_image2_url",
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const initialValues = data
    ? {
        aboutEnabled: (data as { about_enabled?: boolean }).about_enabled ?? false,
        aboutTitle: (data as { about_title?: string | null }).about_title ?? "",
        aboutBody: (data as { about_body?: string | null }).about_body ?? "",
        aboutImage1Url:
          (data as { about_image1_url?: string | null }).about_image1_url ?? "",
        aboutImage2Url:
          (data as { about_image2_url?: string | null }).about_image2_url ?? "",
      }
    : undefined;

  return (
    <div className="space-y-6 pb-12 pt-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          About us section
        </h1>
        <p className="text-sm text-muted-foreground">
          Control the About us block shown on the homepage.
        </p>
      </div>
      <AdminQuickNav />
      <Card>
        <CardContent className="p-6">
          <AboutSettingsForm initialValues={initialValues} />
        </CardContent>
      </Card>
    </div>
  );
}
