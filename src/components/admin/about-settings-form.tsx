"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AboutSettingsFormProps = {
  initialValues?: {
    aboutEnabled: boolean;
    aboutTitle: string;
    aboutBody: string;
    aboutImage1Url: string;
    aboutImage2Url: string;
  };
};

export function AboutSettingsForm({ initialValues }: AboutSettingsFormProps) {
  const MAX_IMAGE_SIZE_BYTES = 500 * 1024;

  const [aboutEnabled, setAboutEnabled] = useState(
    initialValues?.aboutEnabled ?? false,
  );
  const [aboutTitle, setAboutTitle] = useState(
    initialValues?.aboutTitle ?? "",
  );
  const [aboutBody, setAboutBody] = useState(initialValues?.aboutBody ?? "");
  const [aboutImage1Url, setAboutImage1Url] = useState(
    initialValues?.aboutImage1Url ?? "",
  );
  const [aboutImage2Url, setAboutImage2Url] = useState(
    initialValues?.aboutImage2Url ?? "",
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingImage1, setIsUploadingImage1] = useState(false);
  const [isUploadingImage2, setIsUploadingImage2] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  async function handleImageUpload(
    which: 1 | 2,
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setImageUploadError("Image is too large. Maximum size is 500KB.");
      event.target.value = "";
      return;
    }

    if (which === 1) {
      setIsUploadingImage1(true);
    } else {
      setIsUploadingImage2(true);
    }
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
        if (which === 1) {
          setIsUploadingImage1(false);
        } else {
          setIsUploadingImage2(false);
        }
        event.target.value = "";
        return;
      }

      if (which === 1) {
        setAboutImage1Url(data.url);
        setIsUploadingImage1(false);
      } else {
        setAboutImage2Url(data.url);
        setIsUploadingImage2(false);
      }
    } catch {
      setImageUploadError("Network error. Please try again.");
      if (which === 1) {
        setIsUploadingImage1(false);
      } else {
        setIsUploadingImage2(false);
      }
    } finally {
      event.target.value = "";
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const payload = {
      aboutEnabled,
      aboutTitle: aboutTitle.trim(),
      aboutBody: aboutBody.trim(),
      aboutImage1Url: aboutImage1Url.trim(),
      aboutImage2Url: aboutImage2Url.trim(),
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
        setError(data.error ?? "Unable to save About us settings.");
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
        <p className="text-[11px] font-medium text-muted-foreground">
          About us section
        </p>
        <label className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 rounded border-input"
            checked={aboutEnabled}
            onChange={(event) => setAboutEnabled(event.target.checked)}
          />
          <span>Show About us section on the homepage</span>
        </label>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Heading
        </label>
        <Input
          value={aboutTitle}
          onChange={(event) => setAboutTitle(event.target.value)}
          placeholder="Taj Sisters"
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Body text
        </label>
        <textarea
          value={aboutBody}
          onChange={(event) => setAboutBody(event.target.value)}
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Write a short story about the brand."
        />
        <p className="text-[11px] text-muted-foreground">
          This text appears under the heading in the About us block.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground">
            First image URL (optional)
          </label>
          <Input
            value={aboutImage1Url}
            onChange={(event) => setAboutImage1Url(event.target.value)}
            placeholder="https://..."
            className="h-9 text-sm"
          />
          <div className="space-y-1 pt-1 text-[11px]">
            <label className="block text-xs font-medium text-muted-foreground">
              Or upload image (max 500KB)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                id="about-image1-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleImageUpload(1, event)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={isUploadingImage1}
                onClick={() =>
                  document.getElementById("about-image1-upload")?.click()
                }
              >
                {isUploadingImage1 ? "Uploading..." : "Upload from device"}
              </Button>
            </div>
            {aboutImage1Url && (
              <div className="mt-2 flex items-center gap-3">
                <div className="h-16 w-28 overflow-hidden rounded-md border border-input bg-muted">
                  <img
                    src={aboutImage1Url}
                    alt="First about image preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground">
            Second image URL (optional)
          </label>
          <Input
            value={aboutImage2Url}
            onChange={(event) => setAboutImage2Url(event.target.value)}
            placeholder="https://..."
            className="h-9 text-sm"
          />
          <div className="space-y-1 pt-1 text-[11px]">
            <label className="block text-xs font-medium text-muted-foreground">
              Or upload image (max 500KB)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                id="about-image2-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleImageUpload(2, event)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={isUploadingImage2}
                onClick={() =>
                  document.getElementById("about-image2-upload")?.click()
                }
              >
                {isUploadingImage2 ? "Uploading..." : "Upload from device"}
              </Button>
            </div>
            {aboutImage2Url && (
              <div className="mt-2 flex items-center gap-3">
                <div className="h-16 w-28 overflow-hidden rounded-md border border-input bg-muted">
                  <img
                    src={aboutImage2Url}
                    alt="Second about image preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {imageUploadError && (
        <p className="text-[11px] text-red-500">{imageUploadError}</p>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <Button
        type="submit"
        className="mt-2 w-full text-sm sm:w-auto"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saving..." : "Save About us"}
      </Button>
    </form>
  );
}
