import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/product-card";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function getStockLabel(stock: number) {
  if (stock <= 0) return "Sold out";
  if (stock <= 3) return "Almost gone";
  if (stock <= 10) return `${stock} left – running low`;
  return `${stock} in stock`;
}

export default async function CampaignPage({ params }: PageProps) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();

  const { data: campaign } = await supabase
    .from("brand_campaigns")
    .select(
      "id, slug, title, subtitle, brand_name, hero_image_url, hero_video_url, is_active, starts_at, ends_at, created_at",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!campaign || campaign.is_active === false) {
    return notFound();
  }

  const { data: campaignProductRows } = await supabase
    .from("brand_campaign_products")
    .select("product_id, sort_order, highlight_badge, outfit_note")
    .eq("campaign_id", campaign.id)
    .order("sort_order", { ascending: true })
    .limit(12);

  const productIds = Array.from(
    new Set((campaignProductRows ?? []).map((row) => row.product_id as string)),
  );

  if (productIds.length === 0) {
    return notFound();
  }

  const { data: productRows } = await supabase
    .from("products")
    .select(
      "id, name, slug, description, price, sale_price, images, sizes, size_stock, stock, category_id, is_featured, created_at",
    )
    .in("id", productIds);

  const productsById = new Map<string, Product>();

  for (const item of productRows ?? []) {
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

    const product: Product = {
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
      createdAt: item.created_at,
    };

    productsById.set(product.id, product);
  }

  const campaignItems = (campaignProductRows ?? [])
    .map((row) => {
      const product = productsById.get(row.product_id as string) ?? null;
      if (!product) return null;
      return {
        product,
        highlightBadge: (row as { highlight_badge?: string | null }).highlight_badge,
        outfitNote: (row as { outfit_note?: string | null }).outfit_note,
      };
    })
    .filter(Boolean) as {
    product: Product;
    highlightBadge?: string | null;
    outfitNote?: string | null;
  }[];

  if (campaignItems.length === 0) {
    return notFound();
  }

  const maxStock =
    campaignItems.reduce(
      (max, item) => (item.product.stock > max ? item.product.stock : max),
      0,
    ) || 0;

  return (
    <div className="space-y-10 pb-12 pt-10">
      <section className="overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-800 text-zinc-50">
        <div className="grid gap-6 p-6 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] sm:p-10">
          <div className="space-y-4">
            {campaign.brand_name && (
              <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-zinc-300/80">
                {campaign.brand_name}
              </p>
            )}
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {campaign.title}
            </h1>
            {campaign.subtitle && (
              <p className="text-xs text-muted-foreground">
                {campaign.subtitle}
              </p>
            )}
            <p className="text-[11px] text-zinc-300/80">
              Curated and styled by <span className="font-semibold">SistahModest</span>.
            </p>
          </div>
          <div className="relative h-48 overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-800/80 sm:h-56">
            {campaign.hero_image_url ? (
              <img
                src={campaign.hero_image_url}
                alt={campaign.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-zinc-300/80">
                Campaign visual coming soon
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium tracking-tight">Campaign pieces</h2>
            <p className="text-xs text-muted-foreground">
              Limited selection from this brand, with live stock indicators.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {campaignItems.map(({ product, highlightBadge, outfitNote }) => {
            const stock = product.stock ?? 0;
            const label = getStockLabel(stock);
            const percent =
              maxStock > 0 && stock > 0
                ? Math.max(8, Math.round((stock / maxStock) * 100))
                : 0;

            return (
              <div
                key={product.id}
                className="grid gap-5 rounded-2xl border border-border/60 bg-card/80 p-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)] sm:p-5"
              >
                <div>
                  <ProductCard product={product} />
                </div>
                <div className="flex flex-col justify-between gap-4 text-xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                        Stock spotlight
                      </p>
                      {highlightBadge && (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                          {highlightBadge}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                        <span>{label}</span>
                        {stock > 0 && (
                          <span className="font-mono text-[11px] text-foreground">
                            {stock} left
                          </span>
                        )}
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-foreground/80"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Styled by SistahModest
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {outfitNote ??
                        "Pair this piece with relaxed denim and minimal sneakers for an everyday-ready look."}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
