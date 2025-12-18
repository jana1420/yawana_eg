"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type BlogDeleteButtonProps = {
  blogId: string;
};

export function BlogDeleteButton({ blogId }: BlogDeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (isDeleting) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this blog post? This cannot be undone.",
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/blogs/${blogId}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Could not delete blog post.");
        setIsDeleting(false);
        return;
      }

      router.push("/admin/blogs");
    } catch {
      setError("Network error. Please try again.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="mt-6 space-y-2 border-t pt-4">
      {error && <p className="text-xs text-red-500">{error}</p>}
      <Button
        type="button"
        variant="outline"
        className="w-full text-sm sm:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? "Deleting..." : "Delete post"}
      </Button>
    </div>
  );
}
