import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { getAdminSupabase, logAdminActivity } from "@/lib/admin";

const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  slug: z.string().min(1),
  sku: z.string().max(128).optional().nullable(),
  description: z.string().nullable(),
  longDescription: z.string().nullable().optional(),
  priceCents: z.number().int().nonnegative(),
  salePriceCents: z.number().int().nonnegative().optional().nullable(),
  stock: z.number().int().nonnegative(),
  images: z.array(z.string().url()).optional().default([]),
  sizes: z.array(z.string().min(1)).optional().default([]),
  sizeStock: z
    .array(
      z.object({
        size: z.string().min(1),
        stock: z.number().int().nonnegative(),
      }),
    )
    .optional()
    .default([]),
  colors: z.array(z.string().min(1)).optional().default([]),
  colorStock: z
    .array(
      z.object({
        color: z.string().min(1),
        hex: z.string().optional().nullable(),
        stock: z.number().int().nonnegative(),
        imageUrl: z.string().url().optional().nullable(),
      }),
    )
    .optional()
    .default([]),
  categoryId: z.string().uuid().nullable().or(z.literal("")),
  categoryIds: z.array(z.string().uuid()).optional().default([]),
  isFeatured: z.boolean(),
  isNewArrival: z.boolean().optional().default(false),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { supabase, isAdmin, adminProfileId } = await getAdminSupabase();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();

  const parsed = productSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const value = parsed.data;

  const rawCategoryIds =
    value.categoryIds && value.categoryIds.length > 0
      ? value.categoryIds
      : value.categoryId && value.categoryId !== ""
        ? [value.categoryId]
        : [];

  const categoryIds = rawCategoryIds.filter((id) => typeof id === "string" && id.length > 0);
  const primaryCategoryId = categoryIds[0] ?? null;

  const { id: routeId } = await context.params;

  const effectiveId =
    value.id && value.id !== "undefined" && value.id !== ""
      ? value.id
      : routeId;

  if (!effectiveId || effectiveId === "undefined") {
    return NextResponse.json(
      { error: "Missing or invalid product id for update" },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("products")
    .update({
      name: value.name,
      slug: value.slug,
      sku: value.sku ? value.sku.trim() : null,
      description: value.description,
      long_description: value.longDescription ?? null,
      price: value.priceCents,
      sale_price: value.salePriceCents ?? null,
      stock: value.stock,
      images: value.images ?? [],
      sizes: value.sizes ?? [],
      size_stock: value.sizeStock ?? [],
      colors: value.colors ?? [],
      color_stock: value.colorStock ?? [],
      category_id: primaryCategoryId,
      is_featured: value.isFeatured,
      is_new_arrival: value.isNewArrival ?? false,
    })
    .eq("id", effectiveId);

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Could not update product" },
      {
        status: 500,
      },
    );
  }

  // Sync product_categories join table
  const { error: deleteLinksError } = await supabase
    .from("product_categories")
    .delete()
    .eq("product_id", effectiveId);

  if (deleteLinksError) {
    return NextResponse.json(
      { error: deleteLinksError.message ?? "Could not update product categories" },
      { status: 500 },
    );
  }

  if (categoryIds.length > 0) {
    const uniqueCategoryIds = Array.from(new Set(categoryIds));

    const { error: insertLinksError } = await supabase
      .from("product_categories")
      .insert(
        uniqueCategoryIds.map((categoryId) => ({
          product_id: effectiveId,
          category_id: categoryId,
        })),
      );

    if (insertLinksError) {
      return NextResponse.json(
        { error: insertLinksError.message ?? "Could not update product categories" },
        { status: 500 },
      );
    }
  }

  await logAdminActivity(supabase, adminProfileId, {
    action: "update_product",
    entityType: "product",
    entityId: effectiveId,
    description: `Updated product "${value.name}"`,
  });

  return NextResponse.json({ id: effectiveId }, { status: 200 });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { supabase, isAdmin, adminProfileId } = await getAdminSupabase();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let idFromBody: string | null = null;

  try {
    const body = (await request.json()) as { id?: unknown };
    if (body && typeof body.id === "string") {
      idFromBody = body.id;
    }
  } catch {
    // ignore body parse errors, we'll fall back to route param
  }

  const { id: routeId } = await context.params;
  const rawId = idFromBody ?? routeId;

  const idResult = z.string().uuid().safeParse(rawId);

  if (!idResult.success) {
    return NextResponse.json(
      { error: `Invalid product id for delete: ${rawId}` },
      { status: 400 },
    );
  }

  const productId = idResult.data;

  const { data: existingOrderItem } = await supabase
    .from("order_items")
    .select("id")
    .eq("product_id", productId)
    .limit(1)
    .maybeSingle();

  if (existingOrderItem) {
    const { error: archiveError } = await supabase
      .from("products")
      .update({ is_archived: true })
      .eq("id", productId);

    if (archiveError) {
      return NextResponse.json(
        { error: archiveError.message ?? "Could not archive product" },
        {
          status: 500,
        },
      );
    }

    await logAdminActivity(supabase, adminProfileId, {
      action: "archive_product",
      entityType: "product",
      entityId: productId,
      description: `Archived product with id ${productId} (referenced by orders)`,
    });

    return NextResponse.json({ id: productId, archived: true }, { status: 200 });
  }

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Could not delete product" },
      {
        status: 500,
      },
    );
  }

  await logAdminActivity(supabase, adminProfileId, {
    action: "delete_product",
    entityType: "product",
    entityId: productId,
    description: `Deleted product with id ${productId}`,
  });

  return NextResponse.json({ id: productId, archived: false }, { status: 200 });
}
