"use client";

import { useMemo, useState } from "react";

import type { Product } from "@/lib/types";
import { ProductGallery } from "@/components/product-gallery";
import { ProductDetails } from "@/components/product-details";
import { ProductCard } from "@/components/product-card";

type ProductPageClientProps = {
  product: Product;
  relatedProducts: Product[];
};

export function ProductPageClient({
  product,
  relatedProducts,
}: ProductPageClientProps) {
  const initialColor =
    Array.isArray(product.colors) && product.colors.length > 0
      ? product.colors[0] ?? null
      : null;

  const [selectedColor, setSelectedColor] = useState<string | null>(initialColor);

  const colorImageMap = useMemo(() => {
    const map = new Map<string, string>();
    if (Array.isArray(product.colorStock)) {
      for (const entry of product.colorStock ?? []) {
        if (!entry || typeof entry.color !== "string") continue;
        const url = (entry as { imageUrl?: string | null }).imageUrl ?? null;
        if (typeof url === "string" && url.trim().length > 0) {
          map.set(entry.color, url);
        }
      }
    }
    return map;
  }, [product.colorStock]);

  const activeImageForColor =
    selectedColor && colorImageMap.get(selectedColor)
      ? colorImageMap.get(selectedColor)!
      : null;

  const galleryImages = useMemo(() => {
    const baseImages = Array.isArray(product.images) ? product.images : [];
    if (!activeImageForColor) return baseImages;
    const without = baseImages.filter((src) => src !== activeImageForColor);
    return [activeImageForColor, ...without];
  }, [product.images, activeImageForColor]);

  return (
    <div className="space-y-10 pb-12 pt-8">
      <div className="grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <ProductGallery images={galleryImages} name={product.name} />
        <ProductDetails
          product={product}
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
        />
      </div>

      {relatedProducts.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium tracking-tight">
                You may also like
              </h2>
              <p className="text-xs text-muted-foreground">
                More pieces from this collection.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
