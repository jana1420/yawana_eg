"use client";

import { useMemo, useState } from "react";

import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/product-card";

type AllProductsClientProps = {
  products: Product[];
};

const SORT_OPTIONS = [
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price: Low to high" },
  { id: "price-desc", label: "Price: High to low" },
  { id: "sale", label: "On sale" },
] as const;

export default function AllProductsClient({ products }: AllProductsClientProps) {
  const [sortBy, setSortBy] = useState<(typeof SORT_OPTIONS)[number]["id"]>(
    "newest",
  );
  const [inStockOnly, setInStockOnly] = useState(false);

  const visibleProducts = useMemo(() => {
    let result = [...products];

    if (inStockOnly) {
      result = result.filter((product) => product.stock > 0);
    }

    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "sale":
        result.sort((a, b) => {
          const aOnSale = !!a.salePrice && a.salePrice < a.price;
          const bOnSale = !!b.salePrice && b.salePrice < b.price;
          if (aOnSale === bOnSale) {
            return b.createdAt.localeCompare(a.createdAt);
          }
          return aOnSale === bOnSale ? 0 : aOnSale ? -1 : 1;
        });
        break;
      case "newest":
      default:
        result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
    }

    return result;
  }, [products, sortBy, inStockOnly]);

  if (products.length === 0) {
    return (
      <div className="space-y-6 pb-12 pt-8">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
            All products
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse the full collection.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">No products found yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 pt-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
            All products
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse the full collection.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-[13px]">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Sort by</span>
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as (typeof SORT_OPTIONS)[number]["id"])
              }
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <label className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <input
              type="checkbox"
              className="h-3 w-3 rounded border-input text-primary"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
            />
            <span>In stock only</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
