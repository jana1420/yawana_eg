"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX_IMAGE_SIZE_BYTES = 500 * 1024;

type Campaign = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  brand_name: string | null;
  hero_image_url: string | null;
  is_active: boolean;
  created_at: string;
};

type CampaignAdminPanelProps = {
  initialCampaigns: Campaign[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CampaignAdminPanel({ initialCampaigns }: CampaignAdminPanelProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyCampaignId, setBusyCampaignId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  function handleTitleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextTitle = event.target.value;
    setTitle(nextTitle);
    setSuccess(null);
    if (!slugTouched) {
      setSlug(slugify(nextTitle));
    }
  }

  function handleSlugChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSlugTouched(true);
    setSlug(event.target.value);
    setSuccess(null);
  }

  async function handleHeroImageUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setImageUploadError("Image is too large. Maximum size is 500KB.");
      event.target.value = "";
      return;
    }

    setIsUploadingImage(true);
    setImageUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        url?: string;
        error?: string;
      };

      if (!response.ok || !data.url) {
        setImageUploadError(data.error ?? "Unable to upload image.");
        setIsUploadingImage(false);
        event.target.value = "";
        return;
      }

      setHeroImageUrl(data.url);
      setIsUploadingImage(false);
      event.target.value = "";
    } catch {
      setImageUploadError("Network error. Please try again.");
      setIsUploadingImage(false);
      event.target.value = "";
    }
  }

  async function handleCreateCampaign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmedTitle = title.trim();
    const trimmedSlug = slugify(slug || title);

    if (!trimmedTitle) {
      setError("Title is required.");
      return;
    }

    if (!trimmedSlug) {
      setError("Slug is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trimmedTitle,
          slug: trimmedSlug,
          subtitle: subtitle.trim() || null,
          brandName: brandName.trim() || null,
          heroImageUrl: heroImageUrl.trim() || null,
          isActive,
        }),
      });

      const data = (await response.json()) as { campaign?: Campaign; error?: string };

      if (!response.ok || !data.campaign) {
        setError(data.error ?? "Unable to create campaign.");
        setIsSubmitting(false);
        return;
      }

      setCampaigns((prev) => [data.campaign as Campaign, ...prev]);
      setTitle("");
      setSlug("");
      setSlugTouched(false);
      setBrandName("");
      setSubtitle("");
      setHeroImageUrl("");
      setIsActive(true);
      setIsSubmitting(false);
      setSuccess("Campaign created. You can now add products to it.");
    } catch {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(campaign: Campaign) {
    if (busyCampaignId) return;

    setBusyCampaignId(campaign.id);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !campaign.is_active }),
      });

      const data = (await response.json()) as { campaign?: Campaign; error?: string };

      if (!response.ok || !data.campaign) {
        setError(data.error ?? "Unable to update campaign.");
        setBusyCampaignId(null);
        return;
      }

      setCampaigns((prev) =>
        prev.map((item) => (item.id === campaign.id ? (data.campaign as Campaign) : item)),
      );
      setBusyCampaignId(null);
      setSuccess("Campaign status updated.");
    } catch {
      setError("Network error. Please try again.");
      setBusyCampaignId(null);
    }
  }

  return (
    <div className="space-y-6 text-xs">
      <form className="space-y-3" onSubmit={handleCreateCampaign}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-muted-foreground">
              Campaign title
            </label>
            <Input
              value={title}
              onChange={handleTitleChange}
              placeholder="Air Max Street Drop"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-muted-foreground">
              Brand name
            </label>
            <Input
              value={brandName}
              onChange={(event) => {
                setBrandName(event.target.value);
                setSuccess(null);
              }}
              placeholder="Nike"
              className="h-8 text-xs"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-muted-foreground">
              Slug (URL)
            </label>
            <Input
              value={slug}
              onChange={handleSlugChange}
              placeholder="nike-air-max-drop"
              className="h-8 text-xs font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              Shown in the link: /campaigns/your-slug
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-muted-foreground">
              Hero image URL
            </label>
            <Input
              value={heroImageUrl}
              onChange={(event) => {
                setHeroImageUrl(event.target.value);
                setSuccess(null);
              }}
              placeholder="https://..."
              className="h-8 text-xs"
            />
            <div className="space-y-1 pt-1">
              <label className="block text-[11px] font-medium text-muted-foreground">
                Or upload image (max 500KB)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  id="campaign-hero-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleHeroImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  disabled={isUploadingImage}
                  onClick={() =>
                    document.getElementById("campaign-hero-image-upload")?.click()
                  }
                >
                  {isUploadingImage ? "Uploading..." : "Upload from device"}
                </Button>
                <span className="text-[11px] text-muted-foreground">
                  JPEG or PNG, up to 500KB.
                </span>
              </div>
              {imageUploadError && (
                <p className="text-[11px] text-red-500">{imageUploadError}</p>
              )}
            </div>
            {heroImageUrl && (
              <div className="mt-2 flex items-center gap-3">
                <div className="h-12 w-20 overflow-hidden rounded-md border border-input bg-muted">
                  <img
                    src={heroImageUrl}
                    alt="Campaign hero preview"
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Preview of the hero image used on the campaign page.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-medium text-muted-foreground">
            Subtitle / story (optional)
          </label>
          <textarea
            value={subtitle}
            onChange={(event) => {
              setSubtitle(event.target.value);
              setSuccess(null);
            }}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="A tight edit of pieces styled for Cairo streets."
          />
        </div>

        <div className="flex items-center gap-2 pt-1 text-xs">
          <input
            id="campaign-active"
            type="checkbox"
            checked={isActive}
            onChange={(event) => {
              setIsActive(event.target.checked);
              setSuccess(null);
            }}
            className="h-3 w-3 rounded border-input text-primary"
          />
          <label htmlFor="campaign-active" className="text-xs text-muted-foreground">
            Campaign is active
          </label>
        </div>

        {error && <p className="text-[11px] text-red-500">{error}</p>}
        {success && <p className="text-[11px] text-emerald-600">{success}</p>}

        <Button
          type="submit"
          size="sm"
          className="mt-1 px-3 text-xs"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating campaign..." : "Create campaign"}
        </Button>
      </form>

      <div className="space-y-2 border-t pt-4">
        <h2 className="text-sm font-medium tracking-tight">Existing campaigns</h2>
        {campaigns.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No campaigns yet. Create one above, then add products to it.
          </p>
        ) : (
          <div className="space-y-1.5 text-xs">
            <div className="hidden gap-3 pb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,1.3fr)]">
              <span>Campaign</span>
              <span>Brand</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>
            {campaigns.map((campaign) => {
              const createdAt = new Date(campaign.created_at).toLocaleDateString();
              const isActiveRow = campaign.is_active;
              const statusLabel = isActiveRow ? "Active" : "Inactive";

              return (
                <div
                  key={campaign.id}
                  className="grid grid-cols-1 items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,1.3fr)] sm:items-center"
                >
                  <div className="space-y-0.5">
                    <p className="font-medium tracking-tight">{campaign.title}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {campaign.slug}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {campaign.brand_name || "(No brand name)"}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      isActiveRow ? "text-emerald-600" : "text-muted-foreground line-through"
                    }`}
                  >
                    {statusLabel} · {createdAt}
                  </span>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(campaign)}
                      disabled={busyCampaignId === campaign.id}
                      className="text-[11px] font-medium text-muted-foreground underline-offset-4 hover:underline"
                    >
                      {campaign.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <a
                      href={`/admin/campaigns/${campaign.id}/products`}
                      className="text-[11px] font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Edit products
                    </a>
                    <a
                      href={`/campaigns/${campaign.slug}`}
                      className="text-[11px] font-medium text-primary underline-offset-4 hover:underline"
                    >
                      View page
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
