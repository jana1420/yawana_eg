"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";

import { Menu, ShoppingBag, User, X } from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";
import RimalToldLogo from "../../../rimal logo.png";

export function SiteHeader() {
  const { cart } = useCart();
  const itemCount = cart.items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const [isBumping, setIsBumping] = useState(false);
  const prevCountRef = useRef(0);

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const [hasMounted, setHasMounted] = useState(false);

  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [accountSummary, setAccountSummary] = useState<
    | {
        name: string | null;
      }
    | null
  >(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("zekry-lang");
    if (stored === "en" || stored === "ar") {
      setLanguage(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("zekry-lang", language);
    if (typeof document !== "undefined") {
      document.documentElement.lang = language === "ar" ? "ar" : "en";
      document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    }
    window.dispatchEvent(new CustomEvent("zekry-lang-change", { detail: language }));
  }, [language]);

  useEffect(() => {
    let cancelled = false;

    async function loadAccount() {
      try {
        const response = await fetch("/api/account/me", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok || cancelled) return;

        const data = (await response.json()) as {
          user: { id: string; email: string | null } | null;
          profile?: { full_name?: string | null; role?: string | null } | null;
        };

        if (!data.user || cancelled) {
          setAccountSummary(null);
          return;
        }

        const rawFullName = (data.profile?.full_name ?? "").trim();
        const emailLocalPart = (data.user.email ?? "").split("@")[0] || null;
        const bestName = rawFullName || emailLocalPart || null;

        setAccountSummary({ name: bestName });
      } catch {
        if (!cancelled) {
          setAccountSummary(null);
        }
      }
    }

    function handleAuthChange() {
      loadAccount();
    }

    loadAccount();

    if (typeof window !== "undefined") {
      window.addEventListener("zekry-auth-change", handleAuthChange);
    }

    return () => {
      cancelled = true;
      if (typeof window !== "undefined") {
        window.removeEventListener("zekry-auth-change", handleAuthChange);
      }
    };
  }, []);

  useEffect(() => {
    if (itemCount > prevCountRef.current) {
      setIsBumping(true);
      const timer = window.setTimeout(() => {
        setIsBumping(false);
      }, 600);
      return () => window.clearTimeout(timer);
    }
    prevCountRef.current = itemCount;
  }, [itemCount]);

  const isArabic = language === "ar";

  const labels = {
    newArrivals: isArabic ? "وصل حديثاً" : "Told By Rimal",
    allProducts: isArabic ? "كل المنتجات" : "All products",
    bestSellers: isArabic ? "تسوق حسب الفئة" : "Shop by category",
    contact: isArabic ? "اتصل بنا" : "Contact",
    account: isArabic ? "الحساب" : "Account",
    cart: isArabic ? "السلة" : "Cart",
  };

  const isSignedIn = !!accountSummary;
  const accountDisplayName = accountSummary?.name
    ? accountSummary.name.split(" ")[0] ?? accountSummary.name
    : labels.account;

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-background/75 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:grid md:grid-cols-[1fr_auto_1fr] md:py-4">
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex md:justify-self-start">
            <Link href="/all-products" className="hover:text-foreground">
              {labels.allProducts}
            </Link>
            <Link href="/categories" className="hover:text-foreground">
              {labels.bestSellers}
            </Link>
            <Link href="/contact" className="hover:text-foreground">
              {labels.contact}
            </Link>
          </nav>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 md:justify-self-center"
          >
            <Image
              src={RimalToldLogo}
              alt="RimalTold"
              className="h-10 w-auto sm:h-14 md:h-16"
              priority
            />
          </Link>
          <div className="flex items-center gap-3 text-sm md:justify-self-end">
            <Link
              href="/blog"
              className="hidden text-xs font-medium text-muted-foreground hover:text-foreground md:inline-flex"
            >
              {labels.newArrivals}
            </Link>
            <button
              type="button"
              className="hidden items-center rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:inline-flex"
              onClick={() =>
                setLanguage((prev) => (prev === "en" ? "ar" : "en"))
              }
            >
              <span>{language === "en" ? "AR" : "EN"}</span>
            </button>
            <Link
              href="/account"
              className={
                isSignedIn
                  ? "hidden items-center gap-1.5 rounded-full border border-border bg-accent/40 px-3 py-1 text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground md:inline-flex"
                  : "hidden items-center gap-1.5 text-muted-foreground hover:text-foreground md:inline-flex"
              }
            >
              <User className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{accountDisplayName}</span>
            </Link>
            <Link
              href="/cart"
              className={`inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-accent hover:text-accent-foreground ${isBumping ? "animate-[bounce_0.6s_ease-out_1]" : ""}`}
            >
              <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{labels.cart}</span>
              {itemCount > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] text-background">
                  {itemCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground md:hidden"
              aria-label={isMobileNavOpen ? "Close menu" : "Open menu"}
              onClick={() => setIsMobileNavOpen((open) => !open)}
            >
              {isMobileNavOpen ? (
                <X className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Menu className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      {hasMounted &&
        createPortal(
          <div
            className={`fixed inset-0 z-50 bg-black/55 transition-opacity duration-250 ease-out md:hidden ${
              isMobileNavOpen
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0"
            }`}
            onClick={() => setIsMobileNavOpen(false)}
          >
            <div
              className={`absolute inset-x-0 top-0 flex h-full w-full flex-col gap-4 overflow-y-auto border-b border-border/60 bg-background/95 px-4 py-5 shadow-[0_22px_70px_rgba(15,23,42,0.6)] backdrop-blur-md transition-transform duration-250 ease-out ${
                isMobileNavOpen ? "translate-y-0" : "-translate-y-full"
              }`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex justify-end pb-1">
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/80"
                  aria-label="Close menu"
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <nav className="space-y-1 text-base font-medium text-foreground">
                <Link
                  href="/all-products"
                  className="block rounded-lg px-3 py-2.5 hover:bg-muted/80"
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  {labels.allProducts}
                </Link>
                <Link
                  href="/categories"
                  className="block rounded-lg px-3 py-2.5 hover:bg-muted/80"
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  {labels.bestSellers}
                </Link>
                <Link
                  href="/blog"
                  className="block rounded-lg px-3 py-2.5 hover:bg-muted/80"
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  {labels.newArrivals}
                </Link>
                <Link
                  href="/contact"
                  className="block rounded-lg px-3 py-2.5 hover:bg-muted/80"
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  {labels.contact}
                </Link>

                <button
                  type="button"
                  className="mt-4 inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() =>
                    setLanguage((prev) => (prev === "en" ? "ar" : "en"))
                  }
                >
                  {language === "en" ? "AR" : "EN"}
                </button>

                <div className="mt-6 border-t pt-4 text-xs text-muted-foreground">
                  <Link
                    href="/account"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 hover:bg-muted/80 hover:text-foreground"
                    onClick={() => setIsMobileNavOpen(false)}
                  >
                    <User className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{labels.account}</span>
                  </Link>
                </div>
              </nav>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
