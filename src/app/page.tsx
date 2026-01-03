import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Product, SiteSettings } from "@/lib/types";
import Link from "next/link";
import { NewArrivalsCarousel } from "@/components/new-arrivals-carousel";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturedProductsSection } from "@/components/home/featured-products";
import { AboutSection } from "@/components/home/about-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type HomeProps = {
  searchParams: Promise<{
    category?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = await searchParams;
  const categorySlug =
    typeof resolvedSearchParams.category === "string"
      ? resolvedSearchParams.category
      : "";

  const supabase = await createSupabaseServerClient();

  const { data: settingsRow, error: settingsError } = await supabase
    .from("site_settings")
    .select(
      "id, hero_title, hero_subtitle, hero_image_url, hero_primary_label, hero_primary_href, hero_secondary_label, hero_secondary_href, hero_banner_text, about_enabled, about_label, about_title, about_body, about_image1_url, about_image2_url, contact_email, contact_phone, contact_address_line1, contact_address_line2, contact_city, contact_country, hero_additional_image_urls, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  console.log("site_settings raw result", { settingsRow, settingsError });

  if (settingsError) {
    console.error("Error fetching site_settings", settingsError);
  }

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
        aboutLabel: (settingsRow as { about_label?: string | null }).about_label ?? null,
        aboutEnabled: (settingsRow as { about_enabled?: boolean | null })
          .about_enabled ?? null,
        aboutTitle: (settingsRow as { about_title?: string | null }).about_title ?? null,
        aboutBody: (settingsRow as { about_body?: string | null }).about_body ?? null,
        aboutImage1Url:
          (settingsRow as { about_image1_url?: string | null }).about_image1_url ?? null,
        aboutImage2Url:
          (settingsRow as { about_image2_url?: string | null }).about_image2_url ?? null,
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
    .select("id, name, slug, is_featured, image_url")
    .order("name", { ascending: true });

  const rawCategories = (categoryRows ?? []) as {
    id: string;
    name: string;
    slug: string;
    is_featured?: boolean | null;
    image_url?: string | null;
  }[];

  const categories = rawCategories.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
  }));

  const shopByCategoryCards = rawCategories
    .filter((item) =>
      (item.is_featured ?? false) &&
      typeof item.image_url === "string" &&
      item.image_url.trim().length > 0,
    )
    .slice(0, 4)
    .map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      imageUrl: item.image_url as string,
    }));

  let dbQuery = supabase
    .from("products")
    .select(
      "id, name, slug, description, price, sale_price, images, sizes, size_stock, stock, category_id, is_featured, is_new_arrival, created_at",
    )
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(12);

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
      isNewArrival:
        ((item as { is_new_arrival?: boolean | null }).is_new_arrival ?? false) as
          | boolean
          | undefined,
      isArchived: (item as { is_archived?: boolean | null }).is_archived ?? false,
      createdAt: item.created_at,
    };
  });

  const sortByCreatedDesc = (a: Product, b: Product) =>
    a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;

  const flaggedNewArrivals = products
    .filter((product) => product.isNewArrival)
    .sort(sortByCreatedDesc);

  const fallbackSorted = [...products].sort(sortByCreatedDesc);

  const newArrivals =
    flaggedNewArrivals.length > 0
      ? flaggedNewArrivals.slice(0, 6)
      : fallbackSorted.slice(0, 6);

  const featuredProducts = products.filter((product) => product.isFeatured);
  const productsForFeaturedSection =
    featuredProducts.length > 0 ? featuredProducts : products;

  return (
    <div className="space-y-12 pb-12 pt-10">
      <HeroSection siteSettings={siteSettings} />
      {newArrivals.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium tracking-tight">
                New Arrivals
              </h2>
            </div>
            <Link
              href="/all-products"
              className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-3 text-xs font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              View all
            </Link>
          </div>
          <NewArrivalsCarousel products={newArrivals} />
        </section>
      )}

      {shopByCategoryCards.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium tracking-tight">
                Shop by category
              </h2>
            </div>
            <Link
              href="/categories"
              className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-3 text-[11px] font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {shopByCategoryCards.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group space-y-2"
              >
                <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    className="h-44 w-full object-cover sm:h-56"
                  />
                </div>
                <p className="text-center text-[11px] font-medium tracking-[0.18em] uppercase text-foreground group-hover:text-primary">
                  {category.name}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <FeaturedProductsSection
        products={productsForFeaturedSection}
        categories={categories}
        initialCategorySlug={categorySlug}
      />

      <AboutSection siteSettings={siteSettings} />

      <section className="rounded-3xl border border-border/60 bg-gradient-to-r from-background via-background to-background/90 px-4 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-md space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
              Stay in the loop
            </p>
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
              Join the AH Adele list
            </h2>
            <p className="text-xs text-muted-foreground">
              Be the first to discover new pieces, restocks, and limited edits.
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
                Join us
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              No spam. Only thoughtful updates from AH Adele.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
