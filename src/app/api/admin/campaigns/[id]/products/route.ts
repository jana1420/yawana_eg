import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { getAdminSupabase, logAdminActivity } from "@/lib/admin";

const updateCampaignProductsSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        highlightBadge: z.string().max(80).optional().nullable(),
        outfitNote: z.string().max(500).optional().nullable(),
      }),
    )
    .max(5),
});

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { supabase, isAdmin, adminProfileId } = await getAdminSupabase();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateCampaignProductsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid campaign products data." },
      { status: 400 },
    );
  }

  const { id: rawId } = await context.params;
  const idResult = z.string().uuid().safeParse(rawId);

  if (!idResult.success) {
    return NextResponse.json(
      { error: `Invalid campaign id: ${rawId}` },
      { status: 400 },
    );
  }

  const campaignId = idResult.data;

  const seen = new Set<string>();
  const deduped = parsed.data.items.filter((item) => {
    if (seen.has(item.productId)) return false;
    seen.add(item.productId);
    return true;
  });

  const { error: deleteError } = await supabase
    .from("brand_campaign_products")
    .delete()
    .eq("campaign_id", campaignId);

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message ?? "Unable to update campaign products." },
      { status: 500 },
    );
  }

  if (deduped.length > 0) {
    const rows = deduped.map((item, index) => ({
      campaign_id: campaignId,
      product_id: item.productId,
      sort_order: index,
      highlight_badge: item.highlightBadge ?? null,
      outfit_note: item.outfitNote ?? null,
    }));

    const { error: insertError } = await supabase
      .from("brand_campaign_products")
      .insert(rows);

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message ?? "Unable to update campaign products." },
        { status: 500 },
      );
    }
  }

  await logAdminActivity(supabase, adminProfileId, {
    action: "update_campaign_products",
    entityType: "brand_campaign",
    entityId: campaignId,
    description: `Updated campaign products (${deduped.length} items)` ,
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
