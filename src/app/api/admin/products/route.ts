import { NextResponse } from "next/server";

import { z } from "zod";

import { getAdminSupabase, logAdminActivity } from "@/lib/admin";

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  sku: z.string().max(128).optional().nullable(),
  description: z.string().nullable(),
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
  isFeatured: z.boolean(),
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

  const { data, error } = await supabase
    .from("products")
    .insert({
      name: value.name,
      slug: value.slug,
      sku: value.sku ? value.sku.trim() : null,
      description: value.description,
      price: value.priceCents,
      sale_price: value.salePriceCents ?? null,
      stock: value.stock,
      images: value.images ?? [],
      sizes: value.sizes ?? [],
      size_stock: value.sizeStock ?? [],
      colors: value.colors ?? [],
      color_stock: value.colorStock ?? [],
      category_id: value.categoryId || null,
      is_featured: value.isFeatured,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Could not create product" }, {
      status: 500,
    });
  }

  await logAdminActivity(supabase, adminProfileId, {
    action: "create_product",
    entityType: "product",
    entityId: data.id,
    description: `Created product "${value.name}"`,
  });

  return NextResponse.json({ id: data.id }, { status: 201 });
}
