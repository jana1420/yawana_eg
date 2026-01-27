import Link from "next/link";

export function SiteFooter({
  instagramUrl,
}: {
  instagramUrl?: string | null;
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p>&copy; {year} SistahModest. All rights reserved.</p>
          <p className="text-[11px]">
            Powered and created by{" "}
            <a
              href="https://www.zekryway.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              ZekryWay
            </a>
            .
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 text-xs md:flex-row md:items-center md:gap-6">
          <div className="flex gap-4">
            <Link href="/shipping-returns" className="hover:text-foreground">
              Shipping & returns
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="inline-flex items-center gap-2 rounded-full border border-transparent px-2 py-1 text-[11px] transition hover:border-border hover:bg-muted/60"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-[#f09433] via-[#bc1888] to-[#feda77] text-white">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                  >
                    <rect
                      x="4"
                      y="4"
                      width="16"
                      height="16"
                      rx="5"
                      ry="5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3.2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <circle cx="16.2" cy="7.8" r="0.9" fill="currentColor" />
                  </svg>
                </span>
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
