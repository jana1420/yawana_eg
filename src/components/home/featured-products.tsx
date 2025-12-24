"use client";

import { useEffect, useMemo, useState } from "react";

import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/product-card";

type CategorySummary = {
  id: string;
  name: string;
  slug: string;
};

type FeaturedProductsProps = {
  products: Product[];
  categories: CategorySummary[];
  initialCategorySlug: string;
};

export function FeaturedProductsSection({
  products,
  categories,
  initialCategorySlug,
}: FeaturedProductsProps) {
  const [activeSlug, setActiveSlug] = useState(initialCategorySlug ?? "");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (activeSlug) {
      url.searchParams.set("category", activeSlug);
    } else {
      url.searchParams.delete("category");
    }
    window.history.replaceState(null, "", url.toString());
  }, [activeSlug]);

  const filteredProducts = useMemo(() => {
    if (!activeSlug) return products;

    const category = categories.find((item) => item.slug === activeSlug);
    if (!category) return products;

    return products.filter((product) => product.categoryId === category.id);
  }, [activeSlug, categories, products]);

  const hasValidCategory = categories.some((item) => item.slug === activeSlug);
  const currentSlug = hasValidCategory ? activeSlug : "";

  return (
    <section id="products" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium tracking-tight">Featured pieces</h2>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={() => setActiveSlug("")}
          className={`inline-flex h-8 items-center rounded-full border px-3 text-[11px] font-medium transition-colors ${
            !currentSlug
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-background text-foreground hover:border-foreground/70"
          }`}
        >
          All
        </button>
        {categories.map((category) => {
          const isActive = category.slug === currentSlug;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveSlug(category.slug)}
              className={`inline-flex h-8 items-center rounded-full border px-3 text-[11px] font-medium transition-colors ${
                isActive
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-foreground hover:border-foreground/70"
              }`}
            >
              {category.name}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.length === 0 ? (
          <p className="col-span-full text-sm text-muted-foreground">
            No products yet. Add some clothing items in the admin dashboard.
          </p>
        ) : (
          filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>
    </section>
  );
}
