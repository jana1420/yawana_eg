"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

import type { SiteSettings } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DEFAULT_HERO_TITLE_EN = "Minimal essentials for everyday wear.";
const DEFAULT_HERO_SUBTITLE_EN =
  "Curated clothing in soft neutrals, clean lines, and comfortable fabrics. From tees to tailoring, everything is designed to mix and match.";
const DEFAULT_PRIMARY_LABEL_EN = "Shop now";
const DEFAULT_SECONDARY_LABEL_EN = "View lookbook";

type HeroSectionProps = {
  siteSettings: SiteSettings | null;
};

export function HeroSection({ siteSettings }: HeroSectionProps) {
  const [language, setLanguage] = useState<"en" | "ar">("en");

  useEffect(() => {
    if (typeof window === "undefined") return;

    function syncFromDom() {
      if (typeof document !== "undefined") {
        const lang = document.documentElement.lang;
        if (lang === "en" || lang === "ar") {
          setLanguage(lang);
          return;
        }
      }

      const stored = window.localStorage.getItem("zekry-lang");
      if (stored === "en" || stored === "ar") {
        setLanguage(stored);
      }
    }

    syncFromDom();

    function handleLangChange(event: Event) {
      const custom = event as CustomEvent<string>;
      const next = custom.detail;
      if (next === "en" || next === "ar") {
        setLanguage(next);
      } else {
        syncFromDom();
      }
    }

    window.addEventListener("zekry-lang-change", handleLangChange);
    return () => window.removeEventListener("zekry-lang-change", handleLangChange);
  }, []);

  const isArabic = language === "ar";

  const rawHeroTitle = (siteSettings?.heroTitle ?? "").trim();
  const heroTitle =
    !rawHeroTitle || rawHeroTitle === DEFAULT_HERO_TITLE_EN
      ? isArabic
        ? "قطع أساسية بسيطة للاستخدام اليومي."
        : DEFAULT_HERO_TITLE_EN
      : rawHeroTitle;

  const rawHeroSubtitle = (siteSettings?.heroSubtitle ?? "").trim();
  const heroSubtitle =
    !rawHeroSubtitle || rawHeroSubtitle === DEFAULT_HERO_SUBTITLE_EN
      ? isArabic
        ? "تشكيلة مختارة بألوان هادئة وخطوط نظيفة لتناسب أسلوب حياتك اليومي."
        : DEFAULT_HERO_SUBTITLE_EN
      : rawHeroSubtitle;

  const rawPrimaryLabel = (siteSettings?.heroPrimaryLabel ?? "").trim();
  const primaryLabel =
    !rawPrimaryLabel || rawPrimaryLabel === DEFAULT_PRIMARY_LABEL_EN
      ? isArabic
        ? "تسوق الآن"
        : DEFAULT_PRIMARY_LABEL_EN
      : rawPrimaryLabel;

  const rawSecondaryLabel = (siteSettings?.heroSecondaryLabel ?? "").trim();
  const secondaryLabel =
    !rawSecondaryLabel || rawSecondaryLabel === DEFAULT_SECONDARY_LABEL_EN
      ? isArabic
        ? "عرض الإطلالات"
        : DEFAULT_SECONDARY_LABEL_EN
      : rawSecondaryLabel;
  const images = useMemo(() => {
    const urls: string[] = [];
    if (siteSettings?.heroImageUrl) {
      urls.push(siteSettings.heroImageUrl);
    }
    if (Array.isArray(siteSettings?.heroAdditionalImageUrls)) {
      for (const url of siteSettings.heroAdditionalImageUrls) {
        if (typeof url === "string" && url.trim().length > 0) {
          urls.push(url.trim());
        }
      }
    }
    return urls;
  }, [siteSettings?.heroImageUrl, siteSettings?.heroAdditionalImageUrls]);

  const hasHeroImage = images.length > 0;

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;

    setIndex(0);

    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 6000);

    return () => window.clearInterval(id);
  }, [images.length]);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-muted/40 shadow-sm">
      {hasHeroImage && (
        <div className="relative h-[260px] w-full sm:h-[380px] md:h-[460px] lg:h-[520px]">
          {images.map((url, i) => (
            <Image
              key={`${url}-${i}`}
              src={url}
              alt={siteSettings?.heroTitle ?? "Hero image"}
              fill
              priority={i === 0}
              sizes="100vw"
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out ${
                i === index ? "opacity-100 scale-100" : "opacity-0 scale-105"
              }`}
            />
          ))}
          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous hero image"
                className="group absolute left-4 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-black/15 text-white/90 shadow-sm backdrop-blur-sm transition hover:border-white hover:bg-black/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/30"
                onClick={() =>
                  setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next hero image"
                className="group absolute right-4 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-black/15 text-white/90 shadow-sm backdrop-blur-sm transition hover:border-white hover:bg-black/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/30"
                onClick={() =>
                  setIndex((prev) => (prev + 1) % images.length)
                }
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-4 rounded-full bg-white/30 transition-all ${
                      i === index ? "bg-white/90" : "opacity-70"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div
        className={`flex flex-col justify-end sm:justify-center gap-3 sm:gap-5 px-4 py-8 sm:px-10 md:px-16 ${
          hasHeroImage
            ? "absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent text-white pointer-events-none"
            : "text-foreground pointer-events-none"
        }`}
      >
        <div className="order-2 space-y-3 sm:order-1 sm:space-y-4 pointer-events-auto">
          <h1 className="max-w-2xl text-lg font-semibold tracking-tight sm:text-2xl md:text-3xl">
            {heroTitle}
          </h1>
          <p
            className={`max-w-xl text-xs sm:text-sm md:text-base hidden sm:block ${
              hasHeroImage ? "text-white/80" : "text-muted-foreground"
            }`}
          >
            {heroSubtitle}
          </p>
        </div>
        <div className="order-1 mt-3 sm:order-2 sm:mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6 pointer-events-auto">
          <div className="flex gap-3">
            <a
              href="/all-products"
              className={`inline-flex h-8 sm:h-9 items-center rounded-full px-3 sm:px-4 text-[11px] sm:text-xs font-medium transition-colors ${
                hasHeroImage
                  ? "bg-white text-black hover:bg-white/90"
                  : "bg-foreground text-background hover:bg-foreground/90"
              }`}
            >
              {primaryLabel}
            </a>
            {(siteSettings?.heroSecondaryLabel ||
              siteSettings?.heroSecondaryHref) && (
              <a
                href={siteSettings.heroSecondaryHref || "#products"}
                className={`hidden sm:inline-flex h-8 sm:h-9 items-center rounded-full border px-3 sm:px-4 text-[11px] sm:text-xs font-medium transition-colors ${
                  hasHeroImage
                    ? "border-white text-white hover:bg-white/10 hover:text-white"
                    : "border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {secondaryLabel}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
