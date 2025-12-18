import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/lib/types";
import { ProductPageClient } from "@/components/product-page-client";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("products")
    .select(
      "id, name, slug, description, long_description, price, sale_price, images, sizes, size_stock, colors, color_stock, stock, category_id, is_featured, created_at",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!data) {
    return notFound();
  }

  let category: Category | null = null;
  const categoryId = (data as { category_id?: string | null }).category_id ?? null;

  if (categoryId) {
    const { data: categoryRow } = await supabase
      .from("categories")
      .select("id, name, slug, is_featured, created_at")
      .eq("id", categoryId)
      .maybeSingle();

    if (categoryRow) {
      category = {
        id: categoryRow.id,
        name: categoryRow.name,
        slug: categoryRow.slug,
        isFeatured: categoryRow.is_featured ?? false,
        createdAt: categoryRow.created_at,
      };
    }
  }

  const basePrice = data.price as number;
  const salePrice = (data as { sale_price?: number | null }).sale_price ?? null;
  const hasSale =
    typeof salePrice === "number" && salePrice >= 0 && salePrice < basePrice;
  const effectivePrice = hasSale ? salePrice : basePrice;

  const rawSizeStock = (data as { size_stock?: unknown }).size_stock ?? [];
  const sizeStock = Array.isArray(rawSizeStock)
    ? (rawSizeStock
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const value = entry as { size?: unknown; stock?: unknown };
          if (typeof value.size !== "string") return null;
          const n =
            typeof value.stock === "number"
              ? value.stock
              : Number(value.stock);
          const stock = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
          return { size: value.size, stock };
        })
        .filter(Boolean) as { size: string; stock: number }[])
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
            imageUrl?: unknown;
          };
          if (typeof value.color !== "string") return null;
          const n =
            typeof value.stock === "number" ? value.stock : Number(value.stock);
          const stock = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
          const hex =
            typeof value.hex === "string" && value.hex.length > 0
              ? value.hex
              : null;
          const imageUrl =
            typeof value.imageUrl === "string" && value.imageUrl.length > 0
              ? value.imageUrl
              : null;
          return { color: value.color, hex, stock, imageUrl };
        })
        .filter(Boolean) as {
          color: string;
          hex: string | null;
          stock: number;
          imageUrl: string | null;
        }[])
    : [];

  const product: Product = {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description ?? null,
    longDescription:
      ((data as { long_description?: string | null }).long_description ?? null) as
        | string
        | null,
    price: effectivePrice,
    originalPrice: hasSale ? basePrice : null,
    salePrice: hasSale ? salePrice : null,
    images: Array.isArray(data.images) ? data.images : [],
    sizes: Array.isArray(data.sizes) ? data.sizes : [],
    sizeStock,
    colors: Array.isArray((data as { colors?: string[] }).colors)
      ? (((data as { colors?: string[] }).colors ?? []) as string[])
      : [],
    colorStock,
    stock: data.stock ?? 0,
    categoryId,
    category,
    isFeatured: data.is_featured ?? false,
    createdAt: data.created_at,
  };

  let relatedProducts: Product[] = [];

  if (categoryId) {
    const { data: relatedRows } = await supabase
      .from("products")
      .select(
        "id, name, slug, description, price, sale_price, images, sizes, size_stock, stock, category_id, is_featured, created_at",
      )
      .eq("category_id", categoryId)
      .neq("id", data.id)
      .order("created_at", { ascending: false })
      .limit(6);

    relatedProducts = (relatedRows ?? []).map((item) => {
      const basePrice = item.price as number;
      const salePrice = (item as { sale_price?: number | null }).sale_price ?? null;
      const hasSaleInternal =
        typeof salePrice === "number" && salePrice >= 0 && salePrice < basePrice;
      const effectivePriceInternal = hasSaleInternal ? salePrice : basePrice;

      const rawSizeStock = (item as { size_stock?: unknown }).size_stock ?? [];
      const sizeStockInternal = Array.isArray(rawSizeStock)
        ? (rawSizeStock
            .map((entry) => {
              if (!entry || typeof entry !== "object") return null;
              const value = entry as { size?: unknown; stock?: unknown };
              if (typeof value.size !== "string") return null;
              const n =
                typeof value.stock === "number" ? value.stock : Number(value.stock);
              const stockValue = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
              return { size: value.size, stock: stockValue };
            })
            .filter(Boolean) as { size: string; stock: number }[])
        : [];

      return {
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description ?? null,
        price: effectivePriceInternal,
        originalPrice: hasSaleInternal ? basePrice : null,
        salePrice: hasSaleInternal ? salePrice : null,
        images: Array.isArray(item.images) ? item.images : [],
        sizes: Array.isArray(item.sizes) ? item.sizes : [],
        sizeStock: sizeStockInternal,
        stock: item.stock ?? 0,
        categoryId: (item as { category_id?: string | null }).category_id ?? null,
        category: null,
        isFeatured: item.is_featured ?? false,
        createdAt: item.created_at,
      } satisfies Product;
    });
  }

  return <ProductPageClient product={product} relatedProducts={relatedProducts} />;
}
