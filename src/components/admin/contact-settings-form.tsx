"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ContactSettingsFormProps = {
  initialValues?: {
    contactEmail: string;
    contactPhone: string;
    contactAddressLine1: string;
    contactAddressLine2: string;
    contactCity: string;
    contactCountry: string;
    contactInstagramUrl?: string;
    contactFacebookUrl?: string;
    contactTiktokUrl?: string;
    themeKey?: string;
    shippingFlatFeeCents?: number;
    shippingReturnsContent?: string;
    termsContent?: string;
    privacyContent?: string;
  };
};

export function ContactSettingsForm({ initialValues }: ContactSettingsFormProps) {
  const [contactEmail, setContactEmail] = useState(
    initialValues?.contactEmail ?? "",
  );
  const [contactPhone, setContactPhone] = useState(
    initialValues?.contactPhone ?? "",
  );
  const [contactAddressLine1, setContactAddressLine1] = useState(
    initialValues?.contactAddressLine1 ?? "",
  );
  const [contactAddressLine2, setContactAddressLine2] = useState(
    initialValues?.contactAddressLine2 ?? "",
  );
  const [contactCity, setContactCity] = useState(
    initialValues?.contactCity ?? "",
  );
  const [contactCountry, setContactCountry] = useState(
    initialValues?.contactCountry ?? "",
  );
  const [contactInstagramUrl, setContactInstagramUrl] = useState(
    initialValues?.contactInstagramUrl ?? "",
  );
  const [contactFacebookUrl, setContactFacebookUrl] = useState(
    initialValues?.contactFacebookUrl ?? "",
  );
  const [contactTiktokUrl, setContactTiktokUrl] = useState(
    initialValues?.contactTiktokUrl ?? "",
  );
  const [themeKey, setThemeKey] = useState(initialValues?.themeKey ?? "marios");

  const [shippingFlatFee, setShippingFlatFee] = useState(
    initialValues?.shippingFlatFeeCents != null
      ? (initialValues.shippingFlatFeeCents / 100).toString()
      : "",
  );

  const [shippingReturnsContent, setShippingReturnsContent] = useState(
    initialValues?.shippingReturnsContent ?? "",
  );
  const [termsContent, setTermsContent] = useState(
    initialValues?.termsContent ?? "",
  );
  const [privacyContent, setPrivacyContent] = useState(
    initialValues?.privacyContent ?? "",
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleThemeChange(nextTheme: string) {
    setThemeKey(nextTheme);

    // Instant preview: update data-theme on <html> in the current tab
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = nextTheme;
    }

    try {
      await fetch("/api/admin/site-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ themeKey: nextTheme }),
      });
    } catch {
      // Ignore network errors here; main form submit still exists as fallback
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmedShipping = shippingFlatFee.trim();
    let shippingFlatFeeCents: number | undefined;

    if (trimmedShipping) {
      const n = Number.parseFloat(trimmedShipping.replace(",", "."));
      if (!Number.isFinite(n) || n < 0) {
        setError("Shipping fee must be a non-negative number.");
        return;
      }
      shippingFlatFeeCents = Math.round(n * 100);
    } else {
      shippingFlatFeeCents = 0;
    }

    const payload = {
      contactEmail,
      contactPhone,
      contactAddressLine1,
      contactAddressLine2,
      contactCity,
      contactCountry,
      contactInstagramUrl,
      contactFacebookUrl,
      contactTiktokUrl,
      themeKey,
      shippingFlatFeeCents,
      shippingReturnsContent,
      termsContent,
      privacyContent,
    };

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/site-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Unable to save contact settings.");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
    } catch {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Contact email
        </label>
        <Input
          type="email"
          value={contactEmail}
          onChange={(event) => setContactEmail(event.target.value)}
          placeholder="store@example.com"
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-3 pt-4">
        <p className="text-[11px] font-medium text-muted-foreground">
          Legal pages content
        </p>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground">
            Shipping &amp; returns page
          </label>
          <textarea
            value={shippingReturnsContent}
            onChange={(event) => setShippingReturnsContent(event.target.value)}
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-[11px] text-muted-foreground">
            This text appears on the "Shipping &amp; returns" page linked in the
            footer.
          </p>
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground">
            Terms page
          </label>
          <textarea
            value={termsContent}
            onChange={(event) => setTermsContent(event.target.value)}
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-[11px] text-muted-foreground">
            This text appears on the "Terms" page linked in the footer.
          </p>
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground">
            Privacy page
          </label>
          <textarea
            value={privacyContent}
            onChange={(event) => setPrivacyContent(event.target.value)}
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-[11px] text-muted-foreground">
            This text appears on the "Privacy" page linked in the footer.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Phone number
        </label>
        <Input
          value={contactPhone}
          onChange={(event) => setContactPhone(event.target.value)}
          placeholder="+20 1X XXX XXXX"
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Address line 1
        </label>
        <Input
          value={contactAddressLine1}
          onChange={(event) => setContactAddressLine1(event.target.value)}
          placeholder="Street and building"
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Address line 2 (optional)
        </label>
        <Input
          value={contactAddressLine2}
          onChange={(event) => setContactAddressLine2(event.target.value)}
          placeholder="Apartment, floor, etc."
          className="h-9 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground">
            City
          </label>
          <Input
            value={contactCity}
            onChange={(event) => setContactCity(event.target.value)}
            placeholder="City"
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground">
            Country
          </label>
          <Input
            value={contactCountry}
            onChange={(event) => setContactCountry(event.target.value)}
            placeholder="Country"
            className="h-9 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Shipping fee (per order)
        </label>
        <Input
          value={shippingFlatFee}
          onChange={(event) => setShippingFlatFee(event.target.value)}
          placeholder="e.g. 10.00"
          className="h-9 text-sm"
        />
        <p className="text-[11px] text-muted-foreground">
          This flat fee is added once per order at checkout. Use 0 for free
          shipping.
        </p>
      </div>

      <div className="space-y-2 pt-2">
        <label className="block text-[11px] font-medium text-muted-foreground">
          Social media links (optional)
        </label>
        <div className="space-y-2">
          <Input
            value={contactInstagramUrl}
            onChange={(event) => setContactInstagramUrl(event.target.value)}
            placeholder="Instagram profile URL"
            className="h-9 text-sm"
          />
          <Input
            value={contactFacebookUrl}
            onChange={(event) => setContactFacebookUrl(event.target.value)}
            placeholder="Facebook page URL"
            className="h-9 text-sm"
          />
          <Input
            value={contactTiktokUrl}
            onChange={(event) => setContactTiktokUrl(event.target.value)}
            placeholder="TikTok profile URL"
            className="h-9 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <label className="block text-[11px] font-medium text-muted-foreground">
          Theme color
        </label>
        <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-5">
          {[
            { key: "marios", label: "MARIOS Navy", color: "#11253b" },
            { key: "default", label: "Default", color: "#111827" },
            { key: "palette-1", label: "Soft Grey", color: "#e1e1e6" },
            { key: "palette-2", label: "Forest Green", color: "#16a34a" },
            { key: "palette-3", label: "Mauve", color: "#a855f7" },
            { key: "palette-4", label: "Ink Purple", color: "#8b5cf6" },
            { key: "palette-5", label: "Black", color: "#020617" },
            { key: "palette-6", label: "Sand", color: "#e2d4c3" },
            { key: "palette-7", label: "Sky", color: "#2563eb" },
            { key: "palette-8", label: "Sage", color: "#4b6251" },
            { key: "palette-9", label: "Blush", color: "#fb7185" },
            { key: "palette-15", label: "Rose Gold", color: "#c27b7f" },
            { key: "palette-10", label: "Stone", color: "#9ca3af" },
            { key: "palette-11", label: "Midnight", color: "#020617" },
            { key: "palette-12", label: "Teal", color: "#0f766e" },
            { key: "palette-13", label: "Charcoal", color: "#111827" },
            { key: "palette-14", label: "Platinum", color: "#e2e8f0" },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => handleThemeChange(option.key)}
              className={`flex flex-col items-center justify-center rounded-xl border bg-background px-3 py-3 text-[11px] shadow-sm transition hover:border-primary/70 hover:bg-accent/40 ${
                themeKey === option.key ? "border-primary" : "border-border"
              }`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                <span
                  className="h-7 w-7 rounded-full"
                  style={{ backgroundColor: option.color }}
                />
              </span>
              <span className="mt-1 text-[11px] font-medium text-muted-foreground">
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <Button
        type="submit"
        className="mt-2 w-full text-sm sm:w-auto"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saving..." : "Save contact info"}
      </Button>
    </form>
  );
}
