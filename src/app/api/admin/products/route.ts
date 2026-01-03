import { NextResponse } from "next/server";

import { z } from "zod";

import { getAdminSupabase, logAdminActivity } from "@/lib/admin";

const productSchema = z.object({
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

export async function POST(request: Request) {
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

  const { data, error } = await supabase
    .from("products")
    .insert({
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
      is_archived: false,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create product" },
      {
        status: 500,
      },
    );
  }

  if (categoryIds.length > 0) {
    const uniqueCategoryIds = Array.from(new Set(categoryIds));

    const { error: linkError } = await supabase
      .from("product_categories")
      .insert(
        uniqueCategoryIds.map((categoryId) => ({
          product_id: data.id,
          category_id: categoryId,
        })),
      );

    if (linkError) {
      return NextResponse.json(
        { error: linkError.message ?? "Could not save product categories" },
        { status: 500 },
      );
    }
  }

  await logAdminActivity(supabase, adminProfileId, {
    action: "create_product",
    entityType: "product",
    entityId: data.id,
    description: `Created product "${value.name}"`,
  });

  return NextResponse.json({ id: data.id }, { status: 201 });
}
