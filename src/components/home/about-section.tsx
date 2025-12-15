import type { SiteSettings } from "@/lib/types";

type AboutSectionProps = {
  siteSettings: SiteSettings | null;
};

export function AboutSection({ siteSettings }: AboutSectionProps) {
  const enabled = !!siteSettings?.aboutEnabled;
  const rawLabel = (siteSettings?.aboutLabel ?? "").trim();
  const label = rawLabel || "ABOUT US";
  const title = (siteSettings?.aboutTitle ?? "").trim();
  const body = (siteSettings?.aboutBody ?? "").trim();

  const images = [
    (siteSettings?.aboutImage1Url ?? "").trim(),
    (siteSettings?.aboutImage2Url ?? "").trim(),
  ].filter((url) => url.length > 0);

  if (!enabled || (!title && !body && images.length === 0)) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-border/60 bg-card/95 px-4 py-6 sm:px-8 sm:py-10">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-center">
        <div className="space-y-3 sm:space-y-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
            {label}
          </p>
          {title && (
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
              {title}
            </h2>
          )}
          {body && (
            <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-line">
              {body}
            </p>
          )}
        </div>
        {images.length > 0 && (
          <div className={images.length === 1 ? "flex justify-center" : "grid gap-3 sm:grid-cols-2"}>
            {images.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="overflow-hidden rounded-2xl border border-border/70 bg-background/80 shadow-sm"
              >
                <img
                  src={url}
                  alt="About us"
                  className="h-40 w-full object-cover sm:h-56"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
