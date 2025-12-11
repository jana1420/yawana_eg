"use client";

import { useEffect, useRef } from "react";

import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/product-card";

type NewArrivalsCarouselProps = {
  products: Product[];
};

export function NewArrivalsCarousel({ products }: NewArrivalsCarouselProps) {
  if (products.length === 0) return null;

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || products.length <= 3) return;

    let direction: 1 | -1 = 1;

    const id = window.setInterval(() => {
      if (!el) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;

      const step = el.clientWidth * 0.9;
      const next = el.scrollLeft + direction * step;

      if (next >= maxScroll) {
        el.scrollTo({ left: maxScroll, behavior: "smooth" });
        direction = -1;
      } else if (next <= 0) {
        el.scrollTo({ left: 0, behavior: "smooth" });
        direction = 1;
      } else {
        el.scrollTo({ left: next, behavior: "smooth" });
      }
    }, 4500);

    return () => {
      window.clearInterval(id);
    };
  }, [products.length]);

  return (
    <div
      ref={scrollRef}
      className="new-arrivals-scroll flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth"
    >
      {products.map((product) => (
        <div
          key={product.id}
          className="min-w-[260px] sm:min-w-[280px] md:min-w-[300px] max-w-[320px] snap-start"
        >
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
