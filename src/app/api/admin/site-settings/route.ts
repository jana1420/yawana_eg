import { NextResponse } from "next/server";

import { z } from "zod";

import { getAdminSupabase } from "@/lib/admin";

const siteSettingsSchema = z.object({
  heroTitle: z.string().optional(),
  heroSubtitle: z.string().optional(),
  heroImageUrl: z.string().optional(),
  heroAdditionalImageUrls: z.array(z.string()).optional(),
  heroPrimaryLabel: z.string().optional(),
  heroPrimaryHref: z.string().optional(),
  heroSecondaryLabel: z.string().optional(),
  heroSecondaryHref: z.string().optional(),
  heroBannerText: z.string().optional(),
  aboutLabel: z.string().optional(),
  aboutEnabled: z.boolean().optional(),
  aboutTitle: z.string().optional(),
  aboutBody: z.string().optional(),
  aboutImage1Url: z.string().optional(),
  aboutImage2Url: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  contactAddressLine1: z.string().optional(),
  contactAddressLine2: z.string().optional(),
  contactCity: z.string().optional(),
  contactCountry: z.string().optional(),
  contactInstagramUrl: z.string().optional(),
  contactFacebookUrl: z.string().optional(),
  contactTiktokUrl: z.string().optional(),
  shippingFlatFeeCents: z.number().int().nonnegative().optional(),
  themeKey: z.string().optional(),
  shippingReturnsContent: z.string().optional(),
  termsContent: z.string().optional(),
  privacyContent: z.string().optional(),
});

export async function POST(request: Request) {
  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = siteSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const value = parsed.data;

  const updateData: Record<string, unknown> = {};

  if (value.heroTitle !== undefined) updateData.hero_title = value.heroTitle;
  if (value.heroSubtitle !== undefined)
    updateData.hero_subtitle = value.heroSubtitle;
  if (value.heroImageUrl !== undefined)
    updateData.hero_image_url = value.heroImageUrl || null;
  if (value.heroAdditionalImageUrls !== undefined)
    updateData.hero_additional_image_urls = value.heroAdditionalImageUrls;
  if (value.heroPrimaryLabel !== undefined)
    updateData.hero_primary_label = value.heroPrimaryLabel;
  if (value.heroPrimaryHref !== undefined)
    updateData.hero_primary_href = value.heroPrimaryHref;
  if (value.heroSecondaryLabel !== undefined)
    updateData.hero_secondary_label = value.heroSecondaryLabel || null;
  if (value.heroSecondaryHref !== undefined)
    updateData.hero_secondary_href = value.heroSecondaryHref || null;
  if (value.heroBannerText !== undefined)
    updateData.hero_banner_text = value.heroBannerText || null;
  if (value.aboutLabel !== undefined)
    updateData.about_label = value.aboutLabel || null;
  if (value.aboutEnabled !== undefined)
    updateData.about_enabled = value.aboutEnabled;
  if (value.aboutTitle !== undefined)
    updateData.about_title = value.aboutTitle || null;
  if (value.aboutBody !== undefined)
    updateData.about_body = value.aboutBody || null;
  if (value.aboutImage1Url !== undefined)
    updateData.about_image1_url = value.aboutImage1Url || null;
  if (value.aboutImage2Url !== undefined)
    updateData.about_image2_url = value.aboutImage2Url || null;
  if (value.contactEmail !== undefined)
    updateData.contact_email = value.contactEmail || null;
  if (value.contactPhone !== undefined)
    updateData.contact_phone = value.contactPhone || null;
  if (value.contactAddressLine1 !== undefined)
    updateData.contact_address_line1 = value.contactAddressLine1 || null;
  if (value.contactAddressLine2 !== undefined)
    updateData.contact_address_line2 = value.contactAddressLine2 || null;
  if (value.contactCity !== undefined)
    updateData.contact_city = value.contactCity || null;
  if (value.contactCountry !== undefined)
    updateData.contact_country = value.contactCountry || null;
  if (value.contactInstagramUrl !== undefined)
    updateData.contact_instagram_url = value.contactInstagramUrl || null;
  if (value.contactFacebookUrl !== undefined)
    updateData.contact_facebook_url = value.contactFacebookUrl || null;
  if (value.contactTiktokUrl !== undefined)
    updateData.contact_tiktok_url = value.contactTiktokUrl || null;
  if (value.shippingFlatFeeCents !== undefined)
    updateData.shipping_flat_fee_cents = value.shippingFlatFeeCents;
  if (value.themeKey !== undefined)
    updateData.theme_key = value.themeKey || null;
  if (value.shippingReturnsContent !== undefined)
    updateData.shipping_returns_content = value.shippingReturnsContent || null;
  if (value.termsContent !== undefined)
    updateData.terms_content = value.termsContent || null;
  if (value.privacyContent !== undefined)
    updateData.privacy_content = value.privacyContent || null;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No settings provided" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("site_settings")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("site_settings")
      .update(updateData)
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json(
        { error: error.message ?? "Could not update site settings" },
        { status: 500 },
      );
    }

    return NextResponse.json({ id: existing.id }, { status: 200 });
  }

  const { data, error } = await supabase
    .from("site_settings")
    .insert(updateData)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Could not save site settings" },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
