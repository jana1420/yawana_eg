import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";
import AllProductsClient from "./all-products.client";

export default async function AllProductsPage() {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("products")
    .select(
      "id, name, slug, description, price, sale_price, images, sizes, size_stock, stock, category_id, is_featured, is_archived, created_at",
    )
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  const products: Product[] = (data ?? []).map((item) => {
    const basePrice = item.price as number;
    const salePrice = (item as { sale_price?: number | null }).sale_price ?? null;
    const hasSale =
      typeof salePrice === "number" && salePrice >= 0 && salePrice < basePrice;
    const effectivePrice = hasSale ? salePrice : basePrice;

    const rawSizeStock = (item as { size_stock?: unknown }).size_stock ?? [];
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

    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description ?? null,
      price: effectivePrice,
      originalPrice: hasSale ? basePrice : null,
      salePrice: hasSale ? salePrice : null,
      images: Array.isArray(item.images) ? item.images : [],
      sizes: Array.isArray(item.sizes) ? item.sizes : [],
      sizeStock,
      stock: item.stock ?? 0,
      categoryId: (item as { category_id?: string | null }).category_id ?? null,
      category: null,
      isFeatured: item.is_featured ?? false,
      isArchived: (item as { is_archived?: boolean | null }).is_archived ?? false,
      createdAt: item.created_at,
    } satisfies Product;
  });

  return <AllProductsClient products={products} />;
}
