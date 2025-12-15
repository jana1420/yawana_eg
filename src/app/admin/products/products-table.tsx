"use client";

import { useMemo, useState } from "react";

import { Card } from "@/components/ui/card";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  price: number;
  sale_price?: number | null;
  stock: number;
  is_featured: boolean;
   is_archived: boolean;
  created_at: string;
  images?: string[] | null;
  category_name?: string | null;
};

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function AdminProductsTable({
  products,
}: {
  products: ProductRow[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(q) ||
        product.slug.toLowerCase().includes(q) ||
        (product.sku ? product.sku.toLowerCase().includes(q) : false)
      );
    });
  }, [products, query]);

  if (!products || products.length === 0) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        No products yet. Use "New product" to add one.
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4 pt-3">
      <div className="flex items-center justify-between gap-3 pb-2">
        <span className="text-[11px] text-muted-foreground">
          {filtered.length} of {products.length} products
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, slug, or SKU..."
          className="h-8 w-48 rounded-md border border-input bg-background px-2 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="divide-y rounded-md border border-border bg-card">
        <div className="hidden gap-3 border-b px-4 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:grid sm:grid-cols-[1.6fr_1.1fr_1fr_0.8fr_1.1fr_auto]">
          <span>Product</span>
          <span>Category</span>
          <span>Price</span>
          <span>Stock</span>
          <span className="text-right">Status</span>
          <span className="text-right">Actions</span>
        </div>
        {filtered.map((product) => {
          const basePrice = product.price as number;
          const salePrice = product.sale_price ?? null;
          const hasSale =
            typeof salePrice === "number" &&
            salePrice >= 0 &&
            salePrice < basePrice;
          const effectivePrice = hasSale ? salePrice : basePrice;

          const imageArray = Array.isArray(product.images)
            ? product.images
            : [];
          const mainImageUrl = imageArray[0] ?? null;

          const rowClasses = `grid grid-cols-1 items-start gap-2 px-4 py-3 text-xs hover:bg-muted/60 sm:grid-cols-[1.6fr_1.1fr_1fr_0.8fr_1.1fr_auto] sm:items-center ${
            product.is_archived ? "opacity-60" : ""
          }`;

          return (
            <div key={product.id} className={rowClasses}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 overflow-hidden rounded-md border border-border bg-muted">
                  {mainImageUrl ? (
                    <img
                      src={mainImageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                      N/A
                    </div>
                  )}
                </div>
                <div className="space-y-0.5">
                  <p className="font-medium tracking-tight">{product.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {product.slug}
                  </p>
                  {product.sku && (
                    <p className="font-mono text-[11px] text-muted-foreground">
                      SKU: {product.sku}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {product.category_name || "Uncategorized"}
              </span>
              <span className="text-xs">
                {hasSale && (
                  <span className="mr-1 text-[11px] text-muted-foreground line-through">
                    {formatPrice(basePrice)}
                  </span>
                )}
                <span className="font-medium">
                  {formatPrice(effectivePrice)}
                </span>
              </span>
              <span>{product.stock}</span>
              <span
                className={`text-right text-xs ${
                  product.is_archived
                    ? "text-muted-foreground/80 italic"
                    : "text-muted-foreground"
                }`}
              >
                {product.is_archived
                  ? "Archived"
                  : product.is_featured
                    ? "Featured"
                    : "Standard"}
              </span>
              <div className="flex justify-end">
                <a
                  href={`/admin/products/${product.id}`}
                  className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                >
                  Edit
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
