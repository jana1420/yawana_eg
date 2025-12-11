import { NextResponse } from "next/server";

import { z } from "zod";

import { getAdminSupabase, logAdminActivity } from "@/lib/admin";

const createCampaignSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional().nullable(),
  brandName: z.string().optional().nullable(),
  heroImageUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function POST(request: Request) {
  const { supabase, isAdmin, adminProfileId } = await getAdminSupabase();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createCampaignSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid campaign data." }, { status: 400 });
  }

  const { slug, title, subtitle, brandName, heroImageUrl, isActive } = parsed.data;

  const normalizedSlug = slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!normalizedSlug) {
    return NextResponse.json({ error: "Slug is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("brand_campaigns")
    .insert({
      slug: normalizedSlug,
      title,
      subtitle: subtitle ?? null,
      brand_name: brandName ?? null,
      hero_image_url: heroImageUrl ?? null,
      is_active: isActive ?? true,
    })
    .select(
      "id, slug, title, subtitle, brand_name, hero_image_url, is_active, created_at",
    )
    .single();

  if (error || !data) {
    const code = (error as { code?: string } | null)?.code;
    if (code === "23505") {
      return NextResponse.json(
        { error: "A campaign with this slug already exists." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error?.message ?? "Unable to create campaign." },
      { status: 400 },
    );
  }

  await logAdminActivity(supabase, adminProfileId, {
    action: "create_campaign",
    entityType: "brand_campaign",
    entityId: data.id,
    description: `Created campaign "${title}" for brand "${brandName ?? ""}"`,
  });

  return NextResponse.json({ campaign: data }, { status: 201 });
}
