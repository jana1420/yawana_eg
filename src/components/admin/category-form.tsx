"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CategoryFormProps = {
  mode: "create" | "edit";
  categoryId?: string;
  initialValues?: {
    name: string;
    slug: string;
    isFeatured: boolean;
    imageUrl?: string | null;
  };
};

export function CategoryForm({ mode, categoryId, initialValues }: CategoryFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialValues?.name ?? "");
  const [slug, setSlug] = useState(initialValues?.slug ?? "");
  const [isFeatured, setIsFeatured] = useState(initialValues?.isFeatured ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState(initialValues?.imageUrl ?? "");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const payload = {
      name,
      slug,
      isFeatured,
      imageUrl: imageUrl.trim() || undefined,
    };

    setIsSubmitting(true);
    setError(null);

    try {
      const endpoint =
        mode === "create"
          ? "/api/admin/categories"
          : `/api/admin/categories/${categoryId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string; id?: string };

      if (!response.ok) {
        setError(data.error ?? "Unable to save category.");
        setIsSubmitting(false);
        return;
      }
      router.push("/admin/categories");
    } catch {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  }

  async function handleImageUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      setError("Image size must be 500KB or less.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploadingImage(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        setError(data.error ?? "Unable to upload image.");
        setIsUploadingImage(false);
        return;
      }

      setImageUrl(data.url);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleDelete() {
    if (mode !== "edit" || !categoryId || isDeleting) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this category? This cannot be undone.",
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Unable to delete category.");
        setIsDeleting(false);
        return;
      }

      router.push("/admin/categories");
    } catch {
      setError("Network error. Please try again.");
      setIsDeleting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Name
        </label>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Category image
        </label>
        <div className="space-y-2">
          {imageUrl && (
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 overflow-hidden rounded-md border border-border bg-muted">
                <img
                  src={imageUrl}
                  alt={name || "Category image"}
                  className="h-full w-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="text-[11px] text-muted-foreground underline-offset-4 hover:underline"
              >
                Remove image
              </button>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="https://..."
              className="h-9 text-sm"
            />
            <label className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 text-[11px] font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
              <span>{isUploadingImage ? "Uploading..." : "Upload"}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={isUploadingImage || isSubmitting || isDeleting}
              />
            </label>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Used in the home page "Shop by category" section. Recommended tall image.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Slug
        </label>
        <Input
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          required
          className="h-9 text-sm"
        />
      </div>

      <div className="flex items-center gap-2 pt-1 text-xs">
        <input
          id="categoryIsFeatured"
          type="checkbox"
          checked={isFeatured}
          onChange={(event) => setIsFeatured(event.target.checked)}
          className="h-3 w-3 rounded border-input text-primary"
        />
        <label
          htmlFor="categoryIsFeatured"
          className="text-xs text-muted-foreground"
        >
          Mark as featured category
        </label>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <Button
        type="submit"
        className="mt-2 w-full text-sm sm:w-auto"
        disabled={isSubmitting || isDeleting}
      >
        {isSubmitting
          ? mode === "create"
            ? "Creating category..."
            : "Saving category..."
          : mode === "create"
            ? "Create category"
            : "Save category"}
      </Button>
      {mode === "edit" && categoryId && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting || isSubmitting}
          className="mt-2 w-full text-xs text-red-600 underline-offset-4 hover:underline sm:ml-3 sm:w-auto"
        >
          {isDeleting ? "Deleting..." : "Delete category"}
        </button>
      )}
    </form>
  );
}
