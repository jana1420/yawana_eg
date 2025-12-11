"use client";

import { useState } from "react";
import Link from "next/link";

import type { Product } from "@/lib/types";
import { ProductReviews } from "@/components/product-reviews";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/components/cart/cart-provider";
import { CheckCircle2, ShoppingBag } from "lucide-react";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

type ProductDetailsProps = {
  product: Product;
};

export function ProductDetails({ product }: ProductDetailsProps) {
  const { addToCart } = useCart();

  const isInStock = product.stock > 0;
  const hasSale =
    product.originalPrice != null && product.originalPrice > product.price;
  const discountPercent = hasSale
    ? Math.round(100 - (product.price / product.originalPrice!) * 100)
    : 0;

  const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
  const hasColors = Array.isArray(product.colors) && product.colors.length > 0;
  const [selectedSize, setSelectedSize] = useState<string | null>(
    hasSizes ? product.sizes[0] ?? null : null,
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(
    hasColors && Array.isArray(product.colors) && product.colors.length > 0
      ? product.colors[0] ?? null
      : null,
  );
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  const sizeStockMap = new Map<string, number>();
  if (Array.isArray(product.sizeStock)) {
    for (const entry of product.sizeStock) {
      if (!entry || typeof entry.size !== "string") continue;
      const n =
        typeof entry.stock === "number" ? entry.stock : Number(entry.stock);
      const stock = Number.isFinite(n) ? n : 0;
      sizeStockMap.set(entry.size, stock);
    }
  }

  function handleAddToCart() {
    if (!isInStock) return;

    if (hasSizes && !selectedSize) {
      setSizeError("Please select a size.");
      return;
    }

    setSizeError(null);
    let maxQuantity = product.stock ?? 0;

    if (hasSizes && selectedSize) {
      const perSizeStock = sizeStockMap.get(selectedSize);
      if (typeof perSizeStock === "number") {
        maxQuantity = perSizeStock;
      }
    }

    if (maxQuantity <= 0) return;

    addToCart(
      product,
      1,
      selectedSize ?? null,
      selectedColor ?? null,
      maxQuantity,
    );
    setJustAdded(true);
    window.setTimeout(() => {
      setJustAdded(false);
    }, 1600);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {product.category?.slug ? (
            <Link
              href={`/categories/${product.category.slug}`}
              className="hover:underline"
            >
              {product.category.name}
            </Link>
          ) : (
            "Clothing"
          )}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {product.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {product.description ??
            "Minimalist piece designed to pair with everything in your wardrobe."}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          {hasSale && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.originalPrice!)}
            </span>
          )}
          <p className="text-lg font-semibold tracking-tight">
            {formatPrice(product.price)}
          </p>
          {hasSale && discountPercent > 0 && (
            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-600">
              -{discountPercent}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isInStock ? "secondary" : "outline"}>
            {isInStock ? "In stock" : "Sold out"}
          </Badge>
          <p className="text-xs text-muted-foreground">
            {isInStock ? "Available" : "Currently unavailable"}
          </p>
        </div>
      </div>

      {hasColors && Array.isArray(product.colors) && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Color</p>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((colorName) => {
              const colorEntry = Array.isArray(product.colorStock)
                ? product.colorStock.find((entry) => entry && entry.color === colorName)
                : undefined;

              const swatchHex =
                colorEntry && typeof colorEntry.hex === "string"
                  ? colorEntry.hex
                  : "#000000";
              const perColorStock = colorEntry?.stock ?? null;
              const isSoldOutColor =
                typeof perColorStock === "number" ? perColorStock <= 0 : false;
              const isActive = colorName === selectedColor;

              return (
                <button
                  key={colorName}
                  type="button"
                  onClick={() => {
                    if (isSoldOutColor) return;
                    setSelectedColor(colorName);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    isSoldOutColor
                      ? "cursor-not-allowed border-border bg-muted text-muted-foreground opacity-60"
                      : isActive
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-foreground hover:border-foreground/70"
                  }`}
                  aria-disabled={isSoldOutColor}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-border bg-white"
                    style={{ backgroundColor: swatchHex }}
                    aria-hidden="true"
                  />
                  <span>{colorName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {hasSizes && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Size</p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => {
              const isActive = size === selectedSize;
              const perSizeStock = sizeStockMap.has(size)
                ? sizeStockMap.get(size) ?? 0
                : null;
              const isSoldOutSize =
                perSizeStock !== null && typeof perSizeStock === "number"
                  ? perSizeStock <= 0
                  : false;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    if (isSoldOutSize) return;
                    setSelectedSize(size);
                    setSizeError(null);
                  }}
                  className={`relative inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    isSoldOutSize
                      ? "cursor-not-allowed border-border bg-muted text-muted-foreground line-through opacity-60"
                      : isActive
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-foreground hover:border-foreground/70"
                  }`}
                  aria-disabled={isSoldOutSize}
                >
                  {isSoldOutSize && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-1 top-1/2 h-px origin-center -rotate-12 bg-red-500/60"
                    />
                  )}
                  <span className="relative">{size}</span>
                </button>
              );
            })}
          </div>
          {sizeError && (
            <p className="text-[11px] text-red-500">{sizeError}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            className="inline-flex w-full items-center justify-center gap-2 sm:w-auto"
            disabled={!isInStock}
            onClick={handleAddToCart}
          >
            {isInStock ? (
              <>
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                <span>Add to cart</span>
              </>
            ) : (
              "Sold out"
            )}
          </Button>
          {justAdded && (
            <div
              className="inline-flex items-center gap-1.5 rounded-full bg-background/95 px-3 py-1.5 text-[11px] font-medium text-foreground shadow-sm ring-1 ring-border added-to-cart-toast"
              aria-live="polite"
            >
              <CheckCircle2
                className="h-3.5 w-3.5 text-emerald-600"
                aria-hidden="true"
              />
              <span>Added to cart</span>
            </div>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Cash on delivery. No payment required online.
        </p>
      </div>

      <div className="space-y-2 border-t pt-4 text-xs text-muted-foreground">
        <p>Free shipping on orders over EGP 300.</p>
        <p>Easy 30-day returns on all clothing.</p>
      </div>

      <ProductReviews product={product} />
    </div>
  );
}
