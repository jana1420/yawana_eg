import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Product, SiteSettings } from "@/lib/types";
import { NewArrivalsCarousel } from "@/components/new-arrivals-carousel";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturedProductsSection } from "@/components/home/featured-products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type HomeProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = await searchParams;
  const query =
    typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : "";
  const categorySlug =
    typeof resolvedSearchParams.category === "string"
      ? resolvedSearchParams.category
      : "";

  const supabase = await createSupabaseServerClient();

  const { data: settingsRow } = await supabase
    .from("site_settings")
    .select(
      "id, hero_title, hero_subtitle, hero_image_url, hero_primary_label, hero_primary_href, hero_secondary_label, hero_secondary_href, hero_banner_text, contact_email, contact_phone, contact_address_line1, contact_address_line2, contact_city, contact_country, hero_additional_image_urls, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const siteSettings: SiteSettings | null = settingsRow
    ? {
        id: settingsRow.id,
        heroTitle: settingsRow.hero_title,
        heroSubtitle: settingsRow.hero_subtitle,
        heroImageUrl: settingsRow.hero_image_url,
        heroAdditionalImageUrls: Array.isArray(
          (settingsRow as { hero_additional_image_urls?: unknown })
            .hero_additional_image_urls,
        )
          ? ((settingsRow as { hero_additional_image_urls?: string[] })
              .hero_additional_image_urls ?? [])
          : [],
        heroPrimaryLabel: settingsRow.hero_primary_label,
        heroPrimaryHref: settingsRow.hero_primary_href,
        heroSecondaryLabel: settingsRow.hero_secondary_label,
        heroSecondaryHref: settingsRow.hero_secondary_href,
        heroBannerText: settingsRow.hero_banner_text,
        contactEmail: settingsRow.contact_email,
        contactPhone: settingsRow.contact_phone,
        contactAddressLine1: settingsRow.contact_address_line1,
        contactAddressLine2: settingsRow.contact_address_line2,
        contactCity: settingsRow.contact_city,
        contactCountry: settingsRow.contact_country,
        createdAt: settingsRow.created_at,
      }
    : null;

  const { data: categoryRows } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name", { ascending: true });

  const categories = (categoryRows ?? []) as {
    id: string;
    name: string;
    slug: string;
  }[];

  let dbQuery = supabase
    .from("products")
    .select(
      "id, name, slug, description, price, sale_price, images, sizes, size_stock, stock, category_id, is_featured, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(12);

  if (query) {
    dbQuery = dbQuery.ilike("name", `%${query}%`);
  }

  const { data } = await dbQuery;

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
              typeof value.stock === "number"
                ? value.stock
                : Number(value.stock);
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
      createdAt: item.created_at,
    };
  });

  const sortedByDate = [...products].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
  );

  const newArrivals = sortedByDate.slice(0, 6);

  return (
    <div className="space-y-12 pb-12 pt-10">
      <HeroSection siteSettings={siteSettings} query={query} />

      {newArrivals.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium tracking-tight">New arrivals</h2>
              <p className="text-xs text-muted-foreground">
                Fresh pieces just added to the collection.
              </p>
            </div>
          </div>
          <NewArrivalsCarousel products={newArrivals} />
        </section>
      )}

      <FeaturedProductsSection
        products={products}
        categories={categories}
        initialCategorySlug={categorySlug}
      />

      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/95 px-3 py-6 shadow-sm sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/6 via-transparent to-accent/10" />

        <div className="relative mx-auto max-w-md space-y-5 sm:max-w-none sm:grid sm:gap-5 sm:grid-cols-[minmax(0,1.05fr)_minmax(0,1.5fr)] sm:items-center">
          <div className="space-y-2.5 text-center sm:space-y-3 sm:text-left">
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground sm:text-[11px]">
              LooseBrand studio
            </p>
            <h2 className="text-base font-semibold tracking-tight sm:text-lg md:text-xl">
              Pieces that look expensive, even on simple days.
            </h2>
            <p className="text-[11px] text-muted-foreground sm:text-xs">
              Smooth fabrics, soft structure, and tones that sit quietly under any light.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2 text-[10px] text-muted-foreground/90 sm:mt-3 sm:text-[11px] sm:justify-start">
              <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1 shadow-sm">
                Soft layers
              </span>
              <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1 shadow-sm">
                Everyday tailoring
              </span>
              <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1 shadow-sm">
                Neutral sneakers
              </span>
            </div>
          </div>

          <div className="mt-3 space-y-3 sm:mt-0">
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/80 px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px]">
                    Mood line
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground sm:text-[12px]">
                    A slow, continuous line of the silhouettes behind this drop.
                  </p>
                </div>
              </div>
              <div className="mt-3 overflow-hidden">
                <div className="flex animate-hero-marquee gap-2 whitespace-nowrap">
                  {["Soft tailoring", "Everyday knit", "Clean sneaker", "Off-duty set", "Weekend edit", "Layered tee", "Light jacket"].map(
                    (label) => (
                      <span
                        key={label}
                        className="inline-flex items-center rounded-full border border-border/60 bg-card/95 px-3 py-1 text-[11px] shadow-sm"
                      >
                        {label}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-3 text-[11px] sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-background/80 px-3 py-3 shadow-sm text-left transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/70">
                <p className="font-medium">Weekday ready</p>
                <p className="mt-1 text-[11px] text-muted-foreground sm:text-[12px]">
                  Pair a structured top with relaxed bottoms for balance that still feels sharp.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/80 px-3 py-3 shadow-sm text-left transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/70">
                <p className="font-medium">Off-duty clean</p>
                <p className="mt-1 text-[11px] text-muted-foreground sm:text-[12px]">
                  Swap in sneakers and a light layer for a softer, weekend version of the look.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-gradient-to-r from-background via-background to-background/90 px-4 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-md space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
              Stay in the loop
            </p>
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
              Subscribe for new drops & special offers
            </h2>
            <p className="text-xs text-muted-foreground">
              Be the first to know about new arrivals, restocks, and limited collections.
            </p>
          </div>
          <div className="w-full max-w-md space-y-2 sm:w-auto sm:space-y-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                type="email"
                placeholder="you@example.com"
                className="h-9 text-sm sm:w-64"
              />
              <Button
                type="button"
                className="h-9 px-4 text-sm font-medium"
              >
                Subscribe
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              No spam. Just occasional updates about LooseBrand pieces.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
