"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX_IMAGE_SIZE_BYTES = 500 * 1024;

type BlogFormProps = {
  mode: "create" | "edit";
  blogId?: string;
  initialValues?: {
    title: string;
    slug: string;
    excerpt?: string | null;
    coverImageUrl?: string | null;
    videoUrl?: string | null;
    content: string;
    isPublished: boolean;
  };
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function BlogForm({ mode, blogId, initialValues }: BlogFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [slug, setSlug] = useState(initialValues?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState(initialValues?.excerpt ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(
    initialValues?.coverImageUrl ?? "",
  );
  const [videoUrl, setVideoUrl] = useState(initialValues?.videoUrl ?? "");
  const [content, setContent] = useState(initialValues?.content ?? "");
  const [isPublished, setIsPublished] = useState(
    initialValues?.isPublished ?? true,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTitleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextTitle = event.target.value;
    setTitle(nextTitle);
    setError(null);
    if (!slugTouched) {
      setSlug(slugify(nextTitle));
    }
  }

  function handleSlugChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSlugTouched(true);
    setSlug(event.target.value);
    setError(null);
  }

  async function handleCoverImageUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError("Image size must be 500KB or less.");
      event.target.value = "";
      return;
    }

    setIsUploadingImage(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        setError(data.error ?? "Unable to upload image.");
        setIsUploadingImage(false);
        event.target.value = "";
        return;
      }

      setCoverImageUrl(data.url);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmedTitle = title.trim();
    const trimmedSlug = slugify(slug || title);
    const trimmedContent = content.trim();

    if (!trimmedTitle) {
      setError("Title is required.");
      return;
    }

    if (!trimmedSlug) {
      setError("Slug is required.");
      return;
    }

    if (!trimmedContent) {
      setError("Content is required.");
      return;
    }

    const payload = {
      title: trimmedTitle,
      slug: trimmedSlug,
      excerpt: excerpt.trim() || null,
      coverImageUrl: coverImageUrl.trim() || null,
      videoUrl: videoUrl.trim() || null,
      content: trimmedContent,
      isPublished,
    };

    setIsSubmitting(true);
    setError(null);

    try {
      const endpoint =
        mode === "create"
          ? "/api/admin/blogs"
          : `/api/admin/blogs/${blogId ?? ""}`;
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
        setError(data.error ?? "Unable to save blog post.");
        setIsSubmitting(false);
        return;
      }

      router.push("/admin/blogs");
    } catch {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Title
        </label>
        <Input
          value={title}
          onChange={handleTitleChange}
          required
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Slug (URL)
        </label>
        <Input
          value={slug}
          onChange={handleSlugChange}
          required
          className="h-9 text-sm font-mono"
          placeholder="ah-adele-story"
        />
        <p className="text-[11px] text-muted-foreground">
          Shown in the link: /blog/your-slug
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Short description (optional)
        </label>
        <textarea
          value={excerpt ?? ""}
          onChange={(event) => {
            setExcerpt(event.target.value);
            setError(null);
          }}
          rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="One or two lines that describe this story."
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Cover image
        </label>
        <div className="space-y-2">
          {coverImageUrl && (
            <div className="flex items-center gap-3">
              <div className="h-16 w-24 overflow-hidden rounded-md border border-border bg-muted">
                <img
                  src={coverImageUrl}
                  alt={title || "Blog cover"}
                  className="h-full w-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => setCoverImageUrl("")}
                className="text-[11px] text-muted-foreground underline-offset-4 hover:underline"
              >
                Remove image
              </button>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={coverImageUrl}
              onChange={(event) => {
                setCoverImageUrl(event.target.value);
                setError(null);
              }}
              placeholder="https://..."
              className="h-9 text-sm"
            />
            <label className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 text-[11px] font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
              <span>{isUploadingImage ? "Uploading..." : "Upload"}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverImageUpload}
                disabled={isUploadingImage || isSubmitting}
              />
            </label>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Used in the blog list. JPEG or PNG up to 500KB.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Video link (optional)
        </label>
        <Input
          value={videoUrl}
          onChange={(event) => {
            setVideoUrl(event.target.value);
            setError(null);
          }}
          placeholder="https://www.instagram.com/... or https://www.youtube.com/..."
          className="h-9 text-sm"
        />
        <p className="text-[11px] text-muted-foreground">
          Link to a reel or video for this story. A "Watch video" link will
          appear on the blog page.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Content (HTML)
        </label>
        <textarea
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            setError(null);
          }}
          rows={12}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Write your story here. You can use basic HTML, for example &lt;p&gt;...&lt;/p&gt; and &lt;img src=&quot;https://...&quot; alt=&quot;...&quot; /&gt;."
        />
        <p className="text-[11px] text-muted-foreground">
          The content is rendered as HTML on the blog page. Only admins can edit
          it.
        </p>
      </div>

      <div className="flex items-center gap-2 pt-1 text-xs">
        <input
          id="blog-is-published"
          type="checkbox"
          checked={isPublished}
          onChange={(event) => {
            setIsPublished(event.target.checked);
            setError(null);
          }}
          className="h-3 w-3 rounded border-input text-primary"
        />
        <label htmlFor="blog-is-published" className="text-xs text-muted-foreground">
          Visible on the public blog
        </label>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <Button
        type="submit"
        className="mt-2 w-full text-sm sm:w-auto"
        disabled={isSubmitting || isUploadingImage}
      >
        {isSubmitting
          ? mode === "create"
            ? "Creating post..."
            : "Saving post..."
          : mode === "create"
            ? "Create post"
            : "Save post"}
      </Button>
    </form>
  );
}

