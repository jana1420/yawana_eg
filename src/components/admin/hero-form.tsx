"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX_IMAGE_SIZE_BYTES = 500 * 1024;

type HeroFormProps = {
  initialValues?: {
    heroTitle: string;
    heroSubtitle: string;
    heroImageUrl: string;
    heroAdditionalImageUrls?: string[];
    heroPrimaryLabel: string;
    heroPrimaryHref: string;
    heroSecondaryLabel: string;
    heroSecondaryHref: string;
    heroBannerText?: string;
  };
};

export function HeroForm({ initialValues }: HeroFormProps) {
  const [heroTitle, setHeroTitle] = useState(
    initialValues?.heroTitle ?? "Minimal essentials for everyday wear.",
  );
  const [heroSubtitle, setHeroSubtitle] = useState(
    initialValues?.heroSubtitle ??
      "Curated clothing in soft neutrals, clean lines, and comfortable fabrics.",
  );
  const [heroImageUrl, setHeroImageUrl] = useState(
    initialValues?.heroImageUrl ?? "",
  );
  const [heroAdditionalImages, setHeroAdditionalImages] = useState(
    (initialValues?.heroAdditionalImageUrls ?? []).join("\n"),
  );
  const [heroPrimaryLabel, setHeroPrimaryLabel] = useState(
    initialValues?.heroPrimaryLabel ?? "Shop now",
  );
  const [heroPrimaryHref, setHeroPrimaryHref] = useState(
    initialValues?.heroPrimaryHref ?? "#products",
  );
  const [heroSecondaryLabel, setHeroSecondaryLabel] = useState(
    initialValues?.heroSecondaryLabel ?? "View lookbook",
  );
  const [heroSecondaryHref, setHeroSecondaryHref] = useState(
    initialValues?.heroSecondaryHref ?? "#products",
  );
  const [heroBannerText, setHeroBannerText] = useState(
    initialValues?.heroBannerText ?? "FREE DELIVERY TO YOUR HOME FROM EGP2000",
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [isUploadingAdditionalImages, setIsUploadingAdditionalImages] =
    useState(false);
  const [additionalImagesUploadError, setAdditionalImagesUploadError] =
    useState<string | null>(null);

  async function handleImageUpload(
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

  async function handleAdditionalImagesUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const tooLarge = files.find((file) => file.size > MAX_IMAGE_SIZE_BYTES);
    if (tooLarge) {
      setAdditionalImagesUploadError(
        "Image is too large. Maximum size is 500KB.",
      );
      event.target.value = "";
      return;
    }

    setIsUploadingAdditionalImages(true);
    setAdditionalImagesUploadError(null);

    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
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
          setAdditionalImagesUploadError(
            data.error ?? "Unable to upload image.",
          );
          continue;
        }

        uploadedUrls.push(data.url);
      }

      if (uploadedUrls.length > 0) {
        setHeroAdditionalImages((current) => {
          const existing = current
            .split(/\r?\n|,/)
            .map((value) => value.trim())
            .filter(Boolean);
          const merged = [...existing, ...uploadedUrls];
          const unique = Array.from(new Set(merged));
          return unique.join("\n");
        });
      }

      setIsUploadingAdditionalImages(false);
    } catch {
      setAdditionalImagesUploadError("Network error. Please try again.");
      setIsUploadingAdditionalImages(false);
    } finally {
      event.target.value = "";
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const additionalUrls = heroAdditionalImages
      .split(/\r?\n|,/)
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    const payload = {
      heroTitle,
      heroSubtitle,
      heroImageUrl,
      heroAdditionalImageUrls: additionalUrls,
      heroPrimaryLabel,
      heroPrimaryHref,
      heroSecondaryLabel,
      heroSecondaryHref,
      heroBannerText,
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
        setError(data.error ?? "Unable to save hero section.");
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
          Headline
        </label>
        <Input
          value={heroTitle}
          onChange={(event) => setHeroTitle(event.target.value)}
          required
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Subheading
        </label>
        <textarea
          value={heroSubtitle}
          onChange={(event) => setHeroSubtitle(event.target.value)}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Hero image URL
        </label>
        <Input
          value={heroImageUrl}
          onChange={(event) => setHeroImageUrl(event.target.value)}
          placeholder="https://..."
          className="h-9 text-sm"
        />
        <div className="space-y-1 pt-1">
          <label className="block text-xs font-medium text-muted-foreground">
            Or upload image (max 500KB)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              id="hero-image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={isUploadingImage}
              onClick={() =>
                document.getElementById("hero-image-upload")?.click()
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
          <div className="mt-3 flex items-center gap-3">
            <div className="h-16 w-28 overflow-hidden rounded-md border border-input bg-muted">
              <img
                src={heroImageUrl}
                alt="Hero preview"
                className="h-full w-full object-cover"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              This is how the main hero image will roughly appear on the
              homepage.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Additional hero image URLs (optional)
        </label>
        <textarea
          value={heroAdditionalImages}
          onChange={(event) => setHeroAdditionalImages(event.target.value)}
          rows={3}
          placeholder="One image URL per line"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="space-y-1 pt-1">
          <label className="block text-xs font-medium text-muted-foreground">
            Or upload images (max 500KB each)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              id="hero-additional-images-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleAdditionalImagesUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={isUploadingAdditionalImages}
              onClick={() =>
                document
                  .getElementById("hero-additional-images-upload")
                  ?.click()
              }
            >
              {isUploadingAdditionalImages
                ? "Uploading..."
                : "Upload from device"}
            </Button>
            <span className="text-[11px] text-muted-foreground">
              You can select multiple images.
            </span>
          </div>
          {additionalImagesUploadError && (
            <p className="text-[11px] text-red-500">
              {additionalImagesUploadError}
            </p>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          These images will rotate automatically in the homepage hero along with
          the main hero image.
        </p>
        {heroAdditionalImages.trim().length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {heroAdditionalImages
              .split(/\r?\n|,/)
              .map((value) => value.trim())
              .filter((value, index, arr) => value && arr.indexOf(value) === index)
              .slice(0, 6)
              .map((url) => (
                <div
                  key={url}
                  className="h-14 w-24 overflow-hidden rounded-md border border-input bg-muted"
                >
                  <img
                    src={url}
                    alt="Additional hero preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Announcement bar text (top of site)
        </label>
        <Input
          value={heroBannerText}
          onChange={(event) => setHeroBannerText(event.target.value)}
          placeholder="FREE DELIVERY TO YOUR HOME FROM EGP2000 • ..."
          className="h-9 text-sm"
        />
        <p className="text-[11px] text-muted-foreground">
          This text appears in the thin bar at the very top of the site and
          scrolls continuously.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground">
            Primary button label
          </label>
          <Input
            value={heroPrimaryLabel}
            onChange={(event) => setHeroPrimaryLabel(event.target.value)}
            required
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground">
            Primary button link
          </label>
          <Input
            value={heroPrimaryHref}
            onChange={(event) => setHeroPrimaryHref(event.target.value)}
            required
            className="h-9 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground">
            Secondary button label (optional)
          </label>
          <Input
            value={heroSecondaryLabel}
            onChange={(event) => setHeroSecondaryLabel(event.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground">
            Secondary button link (optional)
          </label>
          <Input
            value={heroSecondaryHref}
            onChange={(event) => setHeroSecondaryHref(event.target.value)}
            className="h-9 text-sm"
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <Button
        type="submit"
        className="mt-2 w-full text-sm sm:w-auto"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saving hero..." : "Save hero"}
      </Button>
    </form>
  );
}
