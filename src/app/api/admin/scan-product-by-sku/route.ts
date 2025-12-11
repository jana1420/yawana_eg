import { NextResponse } from "next/server";

import { z } from "zod";

import { getAdminSupabase } from "@/lib/admin";

const querySchema = z.object({
  sku: z.string().min(1).max(128),
});

export async function GET(request: Request) {
  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const url = new URL(request.url);
  const skuParam = url.searchParams.get("sku") ?? "";

  const parsed = querySchema.safeParse({ sku: skuParam.trim() });

  if (!parsed.success) {
    return NextResponse.json({ error: "Missing or invalid sku" }, { status: 400 });
  }

  const sku = parsed.data.sku;

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, slug, sku, stock, images, sizes, size_stock, colors, color_stock",
    )
    .eq("sku", sku)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Could not look up product" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Product not found for this SKU" }, { status: 404 });
  }

  const imagesArray = Array.isArray((data as { images?: unknown }).images)
    ? ((data as { images: string[] }).images ?? [])
    : [];

  const rawSizes = (data as { sizes?: unknown }).sizes ?? [];
  const sizes = Array.isArray(rawSizes)
    ? (rawSizes.filter((value) => typeof value === "string") as string[])
    : [];

  const rawSizeStock = (data as { size_stock?: unknown }).size_stock ?? [];
  const sizeStock = Array.isArray(rawSizeStock)
    ? (rawSizeStock
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const value = entry as { size?: unknown; stock?: unknown };
          if (typeof value.size !== "string") return null;
          const n =
            typeof value.stock === "number" ? value.stock : Number(value.stock);
          const stock = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
          return { size: value.size, stock };
        })
        .filter(Boolean) as { size: string; stock: number }[])
    : [];

  const rawColors = (data as { colors?: unknown }).colors ?? [];
  const colors = Array.isArray(rawColors)
    ? (rawColors.filter((value) => typeof value === "string") as string[])
    : [];

  const rawColorStock = (data as { color_stock?: unknown }).color_stock ?? [];
  const colorStock = Array.isArray(rawColorStock)
    ? (rawColorStock
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const value = entry as {
            color?: unknown;
            hex?: unknown;
            stock?: unknown;
          };
          if (typeof value.color !== "string") return null;
          const n =
            typeof value.stock === "number" ? value.stock : Number(value.stock);
          const stock = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
          const hex =
            typeof value.hex === "string" && value.hex.length > 0
              ? value.hex
              : null;
          return { color: value.color, hex, stock };
        })
        .filter(Boolean) as { color: string; hex: string | null; stock: number }[])
    : [];

  return NextResponse.json(
    {
      product: {
        id: data.id as string,
        name: data.name as string,
        slug: data.slug as string,
        sku: (data as { sku?: string | null }).sku ?? null,
        stock: (data as { stock?: number | null }).stock ?? 0,
        imageUrl: imagesArray[0] ?? null,
        sizes,
        sizeStock,
        colors,
        colorStock,
      },
    },
    { status: 200 },
  );
}
