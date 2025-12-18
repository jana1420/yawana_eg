import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SiteSettings } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { ContactForm } from "@/components/contact-form";

export default async function ContactPage() {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("site_settings")
    .select(
      "id, contact_email, contact_phone, contact_address_line1, contact_address_line2, contact_city, contact_country, contact_instagram_url, contact_facebook_url, contact_tiktok_url, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const settings: SiteSettings | null = data
    ? {
        id: data.id,
        heroTitle: null,
        heroSubtitle: null,
        heroImageUrl: null,
        heroPrimaryLabel: null,
        heroPrimaryHref: null,
        heroSecondaryLabel: null,
        heroSecondaryHref: null,
        heroBannerText: null,
        contactEmail: data.contact_email ?? null,
        contactPhone: data.contact_phone ?? null,
        contactAddressLine1: data.contact_address_line1 ?? null,
        contactAddressLine2: data.contact_address_line2 ?? null,
        contactCity: data.contact_city ?? null,
        contactCountry: data.contact_country ?? null,
        contactInstagramUrl: data.contact_instagram_url ?? null,
        contactFacebookUrl: data.contact_facebook_url ?? null,
        contactTiktokUrl: data.contact_tiktok_url ?? null,
        createdAt: data.created_at,
      }
    : null;

  return (
    <div className="space-y-8 pb-12 pt-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Contact us
        </h1>
        <p className="text-sm text-muted-foreground">
          Have a question about an order or a product? Send us a message or use the
          contact details below.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="text-sm font-medium tracking-tight">Send a message</h2>
            <ContactForm />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-6 p-6 text-sm">
            <div className="space-y-1">
              <h2 className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Contact details
              </h2>
              {settings?.contactEmail && (
                <p>
                  <span className="text-xs text-muted-foreground">Email</span>
                  <br />
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {settings.contactEmail}
                  </a>
                </p>
              )}
              {settings?.contactPhone && (
                <p className="pt-2">
                  <span className="text-xs text-muted-foreground">Phone</span>
                  <br />
                  <a
                    href={`tel:${settings.contactPhone}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {settings.contactPhone}
                  </a>
                </p>
              )}
            </div>

            {settings?.contactInstagramUrl && (
              <div className="space-y-2 pt-2">
                <h2 className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Social
                </h2>
                <div className="flex flex-wrap gap-3 text-sm">
                  {settings?.contactInstagramUrl && (
                    <a
                      href={settings.contactInstagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-transparent px-2 py-1 text-xs transition hover:border-border hover:bg-muted/60"
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
                      <span className="font-medium">Instagram</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {(settings?.contactAddressLine1 || settings?.contactCity ||
              settings?.contactCountry) && (
              <div className="space-y-1 pt-2">
                <h2 className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Address
                </h2>
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {settings?.contactAddressLine1}
                  {settings?.contactAddressLine2
                    ? `\n${settings.contactAddressLine2}`
                    : ""}
                  {settings?.contactCity ? `\n${settings.contactCity}` : ""}
                  {settings?.contactCountry ? `\n${settings.contactCountry}` : ""}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
