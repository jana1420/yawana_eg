import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p>&copy; {year} LooseBrand. All rights reserved.</p>
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
            <a
              href="#"
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
            <a
              href="#"
              aria-label="Facebook"
              className="inline-flex items-center gap-2 rounded-full border border-transparent px-2 py-1 text-[11px] transition hover:border-border hover:bg-muted/60"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1877f2] text-white">
                <span className="text-[11px] font-semibold leading-none">f</span>
              </span>
            </a>
            <a
              href="#"
              aria-label="TikTok"
              className="inline-flex items-center gap-2 rounded-full border border-transparent px-2 py-1 text-[11px] transition hover:border-border hover:bg-muted/60"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5"
                >
                  <path
                    d="M16.5 7.2c-0.8-0.6-1.3-1.4-1.5-2.4h-2.3v9.2a2.1 2.1 0 1 1-1.5-2V9.1A4.6 4.6 0 0 0 7 13.7 4.6 4.6 0 0 0 11.6 18c2.5 0 4.4-1.9 4.4-4.4v-5a4.3 4.3 0 0 0 2.2.7V7.1a3.3 3.3 0 0 1-1.7-0.6Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
