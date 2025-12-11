import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { getAdminSupabase, logAdminActivity } from "@/lib/admin";

const updateCampaignSchema = z.object({
  slug: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  subtitle: z.string().optional().nullable(),
  brandName: z.string().optional().nullable(),
  heroImageUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { supabase, isAdmin, adminProfileId } = await getAdminSupabase();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateCampaignSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid campaign data." }, { status: 400 });
  }

  const { id: rawId } = await context.params;
  const idResult = z.string().uuid().safeParse(rawId);

  if (!idResult.success) {
    return NextResponse.json(
      { error: `Invalid campaign id: ${rawId}` },
      { status: 400 },
    );
  }

  const id = idResult.data;

  const updateData: Record<string, unknown> = {};

  if (parsed.data.slug) {
    const normalizedSlug = parsed.data.slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!normalizedSlug) {
      return NextResponse.json({ error: "Slug is required." }, { status: 400 });
    }
    updateData.slug = normalizedSlug;
  }

  if (parsed.data.title !== undefined) {
    updateData.title = parsed.data.title;
  }

  if (parsed.data.subtitle !== undefined) {
    updateData.subtitle = parsed.data.subtitle ?? null;
  }

  if (parsed.data.brandName !== undefined) {
    updateData.brand_name = parsed.data.brandName ?? null;
  }

  if (parsed.data.heroImageUrl !== undefined) {
    updateData.hero_image_url = parsed.data.heroImageUrl ?? null;
  }

  if (parsed.data.isActive !== undefined) {
    updateData.is_active = parsed.data.isActive;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No campaign fields provided for update." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("brand_campaigns")
    .update(updateData)
    .eq("id", id)
    .select(
      "id, slug, title, subtitle, brand_name, hero_image_url, is_active, created_at",
    )
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Unable to update campaign." },
      { status: 500 },
    );
  }

  await logAdminActivity(supabase, adminProfileId, {
    action: "update_campaign",
    entityType: "brand_campaign",
    entityId: data.id,
    description: `Updated campaign "${data.title}"`,
  });

  return NextResponse.json({ campaign: data }, { status: 200 });
}
