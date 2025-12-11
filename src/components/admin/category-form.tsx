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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const payload = {
      name,
      slug,
      isFeatured,
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
