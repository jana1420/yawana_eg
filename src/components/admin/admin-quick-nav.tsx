"use client";

import { useEffect, useState } from "react";

import {
  Info,
  LayoutDashboard,
  Megaphone,
  Package,
  Phone,
  Plus,
  ScanLine,
  ShoppingCart,
  Sparkles,
  Tags,
  TicketPercent,
  Users,
  FileText,
} from "lucide-react";

export function AdminQuickNav() {
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

  const labels = {
    dashboard: isArabic ? "لوحة التحكم" : "Dashboard",
    addProduct: isArabic ? "إضافة منتج" : "Add product",
    viewProducts: isArabic ? "عرض المنتجات" : "View products",
    viewCategories: isArabic ? "عرض الأقسام" : "View categories",
    editHero: isArabic ? "تعديل الهيرو" : "Edit hero",
    aboutSection: isArabic ? "قسم من نحن" : "About section",
    contactInfo: isArabic ? "بيانات التواصل" : "Contact info",
    viewOrders: isArabic ? "عرض الطلبات" : "View orders",
    coupons: isArabic ? "قسائم الخصم" : "Coupons",
    campaigns: isArabic ? "حملات العلامات" : "Brand campaigns",
    admins: isArabic ? "مديرو النظام" : "Admins",
    scanStock: isArabic ? "مسح الباركود" : "Scan stock",
    blogPosts: isArabic ? "المدونة" : "Blog posts",
  };

  return (
    <div className="flex flex-wrap gap-3">
      <a
        href="/admin"
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{labels.dashboard}</span>
      </a>
      <a
        href="/admin/products/new"
        className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{labels.addProduct}</span>
      </a>
      <a
        href="/admin/scan"
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <ScanLine className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{labels.scanStock}</span>
      </a>
      <a
        href="/admin/products"
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <Package className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{labels.viewProducts}</span>
      </a>
      <a
        href="/admin/categories"
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <Tags className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{labels.viewCategories}</span>
      </a>
      <a
        href="/admin/hero"
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{labels.editHero}</span>
      </a>
      <a
        href="/admin/about"
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{labels.aboutSection}</span>
      </a>
      <a
        href="/admin/contact"
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <Phone className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{labels.contactInfo}</span>
      </a>
      <a
        href="/admin/orders"
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{labels.viewOrders}</span>
      </a>
      <a
        href="/admin/coupons"
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <TicketPercent className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{labels.coupons}</span>
      </a>
      <a
        href="/admin/campaigns"
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <Megaphone className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{labels.campaigns}</span>
      </a>
      <a
        href="/admin/admins"
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <Users className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{labels.admins}</span>
      </a>
    </div>
  );
}
