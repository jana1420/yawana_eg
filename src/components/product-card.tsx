import Link from "next/link";
import Image from "next/image";

import type { Product } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const isInStock = product.stock > 0;
  const hasSale =
    product.originalPrice != null && product.originalPrice > product.price;
  const discountPercent = hasSale
    ? Math.round(100 - (product.price / product.originalPrice!) * 100)
    : 0;

  const isLowStock = isInStock && product.stock <= 3;
  const stockLabel = !isInStock
    ? "Sold out"
    : isLowStock
      ? `Only ${product.stock} left`
      : "In stock";

  const hasFirstImage = Boolean(product.images[0]);
  const hasSecondImage = Boolean(product.images[1]);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
    >
      <Card className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/90 text-foreground shadow-sm transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:border-border/80 hover:bg-card/95">
        <div className="px-3.5 pt-3.5 sm:px-4 sm:pt-4">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-muted/40 ring-1 ring-border/40 sm:aspect-[4/3]">
            {hasFirstImage ? (
              hasSecondImage ? (
                <>
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] group-hover:opacity-0 group-active:opacity-0 group-focus-visible:opacity-0"
                  />
                  <Image
                    src={product.images[1]}
                    alt={product.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                    className="absolute inset-0 h-full w-full object-cover opacity-0 transition-transform duration-500 ease-out group-hover:scale-[1.03] group-hover:opacity-100 group-active:scale-[1.03] group-active:opacity-100 group-focus-visible:scale-[1.03] group-focus-visible:opacity-100"
                  />
                </>
              ) : (
                <div className="relative h-full w-full">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                </div>
              )
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Image coming soon
              </div>
            )}
            {isInStock && hasSale && discountPercent > 0 && (
              <div className="pointer-events-none absolute left-3 top-3 inline-flex items-center rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 ring-1 ring-emerald-100/80">
                -{discountPercent}%
              </div>
            )}
            {!isInStock && (
              <div className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-1.75 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-700 ring-1 ring-zinc-200/80">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                Sold out
              </div>
            )}
          </div>
        </div>
        <CardContent className="flex flex-1 flex-col justify-between px-3 pb-3 pt-2.5 sm:px-3.5 sm:pb-3.5">
          <div className="space-y-1 sm:space-y-1.5">
            <h3 className="line-clamp-2 text-[13px] font-semibold tracking-tight sm:text-sm">
              {product.name}
            </h3>
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                {hasSale && (
                  <span className="text-[11px] text-muted-foreground line-through">
                    {formatPrice(product.originalPrice!)}
                  </span>
                )}
                <span
                  className={`text-[13px] font-semibold tracking-tight sm:text-sm ${
                    hasSale ? "text-emerald-600" : ""
                  }`}
                >
                  {formatPrice(product.price)}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-medium sm:text-[11px] ${
                  !isInStock
                    ? "text-red-500"
                    : isLowStock
                      ? "text-amber-600"
                      : "text-muted-foreground"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    !isInStock
                      ? "bg-red-500"
                      : isLowStock
                        ? "bg-amber-500"
                        : "bg-zinc-300"
                  }`}
                />
                {stockLabel}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

