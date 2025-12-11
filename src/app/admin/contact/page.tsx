import { redirect } from "next/navigation";

import { getAdminSupabase } from "@/lib/admin";
import { Card, CardContent } from "@/components/ui/card";
import { ContactSettingsForm } from "@/components/admin/contact-settings-form";
import { AdminQuickNav } from "@/components/admin/admin-quick-nav";

export default async function AdminContactPage() {
  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    redirect("/login?from=/admin/contact");
  }

  const { data } = await supabase
    .from("site_settings")
    .select(
      "contact_email, contact_phone, contact_address_line1, contact_address_line2, contact_city, contact_country, contact_instagram_url, contact_facebook_url, contact_tiktok_url, theme_key, shipping_flat_fee_cents, shipping_returns_content, terms_content, privacy_content",
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const initialValues = data
    ? {
        contactEmail: data.contact_email ?? "",
        contactPhone: data.contact_phone ?? "",
        contactAddressLine1: data.contact_address_line1 ?? "",
        contactAddressLine2: data.contact_address_line2 ?? "",
        contactCity: data.contact_city ?? "",
        contactCountry: data.contact_country ?? "",
        contactInstagramUrl: data.contact_instagram_url ?? "",
        contactFacebookUrl: data.contact_facebook_url ?? "",
        contactTiktokUrl: data.contact_tiktok_url ?? "",
        themeKey: data.theme_key ?? "default",
			shippingFlatFeeCents: data.shipping_flat_fee_cents ?? 0,
        shippingReturnsContent: data.shipping_returns_content ?? "",
        termsContent: data.terms_content ?? "",
        privacyContent: data.privacy_content ?? "",
      }
    : undefined;

  return (
    <div className="space-y-6 pb-12 pt-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Contact information
        </h1>
        <p className="text-sm text-muted-foreground">
          Edit the contact details shown on the Contact page.
        </p>
      </div>
      <AdminQuickNav />
      <Card>
        <CardContent className="p-6">
          <ContactSettingsForm initialValues={initialValues} />
        </CardContent>
      </Card>
    </div>
  );
}
