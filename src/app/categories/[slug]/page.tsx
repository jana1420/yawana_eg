import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/product-card";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!category) {
    return notFound();
  }

  const { data: productCategoryRows } = await supabase
    .from("product_categories")
    .select("product_id")
    .eq("category_id", category.id);

  const productIds = Array.from(
    new Set((productCategoryRows ?? []).map((row) => row.product_id as string)),
  );

  const mapRowsToProducts = (rows: unknown[] | null): Product[] => {
    return (rows ?? []).map((raw) => {
      const item = raw as Record<string, unknown>;

      const basePrice = item.price as number;
      const salePrice = (item as { sale_price?: number | null }).sale_price ?? null;
      const hasSale =
        typeof salePrice === "number" && salePrice >= 0 && salePrice < basePrice;
      const effectivePrice = hasSale ? salePrice : basePrice;

      const rawSizeStock = (item as { size_stock?: unknown }).size_stock ?? [];
      let sizeStock: { size: string; stock: number }[] = [];

      if (Array.isArray(rawSizeStock)) {
        sizeStock = rawSizeStock
          .map((entry) => {
            if (!entry || typeof entry !== "object") return null;
            const value = entry as { size?: unknown; stock?: unknown };
            if (typeof value.size !== "string") return null;
            const n =
              typeof value.stock === "number" ? value.stock : Number(value.stock);
            const stock = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
            return { size: value.size, stock };
          })
          .filter(
            (value): value is { size: string; stock: number } => value !== null,
          );
      }

      return {
        id: item.id as string,
        name: item.name as string,
        slug: item.slug as string,
        description: (item as { description?: string | null }).description ?? null,
        price: effectivePrice,
        originalPrice: hasSale ? basePrice : null,
        salePrice: hasSale ? salePrice : null,
        images: Array.isArray(item.images) ? (item.images as string[]) : [],
        sizes: Array.isArray(item.sizes) ? (item.sizes as string[]) : [],
        sizeStock,
        stock: (item as { stock?: number | null }).stock ?? 0,
        categoryId: (item as { category_id?: string | null }).category_id ?? null,
        category: null,
        isFeatured: (item as { is_featured?: boolean | null }).is_featured ?? false,
        isArchived:
          (item as { is_archived?: boolean | null }).is_archived ?? false,
        createdAt: item.created_at as string,
      };
    });
  };

  let products: Product[] = [];

  if (productIds.length > 0) {
    const { data } = await supabase
      .from("products")
      .select(
        "id, name, slug, description, price, sale_price, images, sizes, size_stock, stock, category_id, is_featured, is_archived, created_at",
      )
      .in("id", productIds)
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    products = mapRowsToProducts(data as unknown[] | null);
  } else {
    const { data } = await supabase
      .from("products")
      .select(
        "id, name, slug, description, price, sale_price, images, sizes, size_stock, stock, category_id, is_featured, is_archived, created_at",
      )
      .eq("category_id", category.id)
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    products = mapRowsToProducts(data as unknown[] | null);
  }

  return (
    <div className="space-y-6 pb-12 pt-8">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Category
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {category.name}
        </h1>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.length === 0 ? (
          <p className="col-span-full text-sm text-muted-foreground">
            No products in this category yet.
          </p>
        ) : (
          products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>
    </div>
  );
}
