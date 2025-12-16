import { notFound, redirect } from "next/navigation";

import { getAdminSupabase } from "@/lib/admin";
import { Card, CardContent } from "@/components/ui/card";
import { ProductForm } from "@/components/admin/product-form";
import { AdminQuickNav } from "@/components/admin/admin-quick-nav";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminEditProductPage({ params }: PageProps) {
  const { id } = await params;

  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    redirect("/login?from=/admin/products");
  }

  const [{ data: product }, { data: categories }, { data: productCategoryRows }] =
    await Promise.all([
      supabase
        .from("products")
        .select(
          "id, name, slug, sku, description, price, sale_price, stock, images, sizes, size_stock, colors, color_stock, category_id, is_featured",
        )
        .eq("id", id)
        .maybeSingle(),
      supabase.from("categories").select("id, name").order("name", {
        ascending: true,
      }),
      supabase
        .from("product_categories")
        .select("category_id")
        .eq("product_id", id),
    ]);

  if (!product) {
    return notFound();
  }

  const imagesArray = Array.isArray(product.images) ? product.images : [];
  const imageUrl = imagesArray[0] ?? null;
  const galleryImageUrls = imagesArray.slice(1);

  const sizes = Array.isArray(product.sizes) ? product.sizes : [];

  const rawSizeStock = (product as { size_stock?: unknown }).size_stock ?? [];
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

  const categoryIdsFromJoin = (productCategoryRows ?? [])
    .map((row) => (row as { category_id?: string | null }).category_id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  const primaryCategoryId = (product as { category_id?: string | null }).category_id ?? null;

  const initialCategoryIds = categoryIdsFromJoin.length
    ? Array.from(new Set(categoryIdsFromJoin))
    : primaryCategoryId
      ? [primaryCategoryId]
      : [];

  const colors = Array.isArray((product as { colors?: unknown }).colors)
    ? ((product as { colors?: string[] }).colors ?? [])
    : [];

  const rawColorStock = (product as { color_stock?: unknown }).color_stock ?? [];
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

  return (
    <div className="space-y-6 pb-12 pt-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Edit product
        </h1>
        <p className="text-sm text-muted-foreground">
          Update details for this item.
        </p>
      </div>
      <AdminQuickNav />
      <Card>
        <CardContent className="p-6">
          <ProductForm
            mode="edit"
            productId={product.id}
            categories={categories ?? []}
            initialValues={{
              name: product.name,
              slug: product.slug,
              sku: (product as { sku?: string | null }).sku ?? null,
              description: product.description ?? null,
              priceCents: product.price,
              salePriceCents: product.sale_price ?? null,
              stock: product.stock ?? 0,
              imageUrl,
              galleryImageUrls,
              sizes,
              sizeStock,
              colors,
              colorStock,
              categoryId: primaryCategoryId,
              categoryIds: initialCategoryIds,
              isFeatured: product.is_featured ?? false,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
