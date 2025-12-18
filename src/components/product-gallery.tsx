"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type ProductGalleryProps = {
  images: string[];
  name: string;
};

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const validImages = images.filter(
    (src) => typeof src === "string" && src.trim().length > 0,
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const activeImage = validImages[activeIndex] ?? validImages[0] ?? null;

  // Preload all other images so switching thumbnails feels instant
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (validImages.length <= 1) return;

    const [, ...rest] = validImages;
    for (const src of rest) {
      if (!src || typeof src !== "string") continue;
      const img = new window.Image();
      img.src = src;
    }
  }, [validImages]);

  if (!activeImage && validImages.length === 0) {
    return (
      <div className="aspect-[4/5] w-full overflow-hidden rounded-xl bg-muted">
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          Image coming soon
        </div>
      </div>
    );
  }

  const hasThumbnails = validImages.length > 1;

  return (
    <>
      <div className="space-y-3 md:grid md:grid-cols-[auto_minmax(0,1fr)] md:gap-4 md:space-y-0">
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          className={`group relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-muted text-left ${
            hasThumbnails ? "md:col-start-2" : "md:col-span-2"
          }`}
        >
          {activeImage ? (
            <Image
              src={activeImage}
              alt={name}
              priority
              unoptimized
              fill
              sizes="(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Image coming soon
            </div>
          )}
          <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity duration-200 group-hover:opacity-100">
            Click to zoom
          </span>
        </button>

        {hasThumbnails && (
          <div className="flex gap-2 overflow-x-auto pt-2 md:col-start-1 md:row-start-1 md:flex-col md:overflow-visible md:pt-0">
            {validImages.map((src, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={`${src}-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border transition-colors md:h-20 md:w-20 ${
                    isActive
                      ? "border-foreground"
                      : "border-border hover:border-foreground/70"
                  }`}
                >
                  <Image
                    src={src}
                    alt={name}
                    unoptimized
                    fill
                    sizes="80px"
                    className="h-full w-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {isLightboxOpen && activeImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative h-[70vh] w-full max-w-4xl overflow-hidden rounded-xl bg-black"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={activeImage}
              alt={name}
              unoptimized
              fill
              sizes="100vw"
              className="h-full w-full max-w-full cursor-zoom-in object-contain transition-transform duration-200 ease-out hover:scale-110"
            />
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-xs font-medium text-white hover:bg-black/90"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}
