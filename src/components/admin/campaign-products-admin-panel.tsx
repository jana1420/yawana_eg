"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  stock: number;
  images?: string[] | null;
  selected: boolean;
  highlightBadge: string;
  outfitNote: string;
};

type CampaignProductsAdminPanelProps = {
  campaignId: string;
  campaignTitle: string;
  initialProducts: ProductRow[];
};

export function CampaignProductsAdminPanel({
  campaignId,
  campaignTitle,
  initialProducts,
}: CampaignProductsAdminPanelProps) {
  const router = useRouter();

  const [rows, setRows] = useState<ProductRow[]>(initialProducts);
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      row.name.toLowerCase().includes(q) || row.slug.toLowerCase().includes(q),
    );
  }, [rows, query]);

  const selectedCount = rows.filter((row) => row.selected).length;

  function handleToggleSelected(id: string, nextSelected: boolean) {
    setRows((prev) => {
      const currentSelected = prev.filter((row) => row.selected).length;
      if (nextSelected && currentSelected >= 5) {
        setError("You can include up to 5 products in a campaign.");
        return prev;
      }
      setError(null);
      setSuccess(null);
      return prev.map((row) =>
        row.id === id ? { ...row, selected: nextSelected } : row,
      );
    });
  }

  function handleFieldChange(
    id: string,
    field: "highlightBadge" | "outfitNote",
    value: string,
  ) {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    );
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const selected = rows.filter((row) => row.selected);

    if (selected.length === 0) {
      setError("Select at least one product for this campaign.");
      return;
    }

    if (selected.length > 5) {
      setError("You can include up to 5 products in a campaign.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const items = selected.map((row) => ({
        productId: row.id,
        highlightBadge: row.highlightBadge.trim() || null,
        outfitNote: row.outfitNote.trim() || null,
      }));

      const response = await fetch(`/api/admin/campaigns/${campaignId}/products`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items }),
      });

      const data = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !data.success) {
        setError(data.error ?? "Unable to update campaign products.");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setSuccess("Campaign products updated.");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4 text-xs" onSubmit={handleSubmit}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
            Campaign products
          </p>
          <p className="text-xs text-muted-foreground">
            Choose up to 5 pieces to feature in this campaign. These will show
            with live stock bars and "Styled by AH Adele" notes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">
            {selectedCount} selected
          </span>
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products by name or slug..."
            className="h-8 w-52 text-xs"
          />
        </div>
      </div>

      {error && <p className="text-[11px] text-red-500">{error}</p>}
      {success && <p className="text-[11px] text-emerald-600">{success}</p>}

      <div className="space-y-1.5 rounded-md border border-border bg-card/60 p-2">
        {filtered.length === 0 ? (
          <p className="px-1 py-2 text-xs text-muted-foreground">
            No products match your search.
          </p>
        ) : (
          filtered.map((row) => {
            const mainImageUrl = Array.isArray(row.images) ? row.images[0] ?? null : null;

            return (
              <div
                key={row.id}
                className="grid gap-3 rounded-md px-2 py-2 hover:bg-muted/60 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,2fr)]"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-md border border-border bg-muted">
                    {mainImageUrl ? (
                      <img
                        src={mainImageUrl}
                        alt={row.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                        N/A
                      </div>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-medium tracking-tight">{row.name}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {row.slug}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Stock: {row.stock}
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={(event) =>
                          handleToggleSelected(row.id, event.target.checked)
                        }
                        className="h-3 w-3 rounded border-input text-primary"
                      />
                      <span>Include in campaign</span>
                    </label>
                  </div>
                  {row.selected && (
                    <div className="space-y-1.5">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="block text-[11px] font-medium text-muted-foreground">
                            Highlight badge (optional)
                          </label>
                          <Input
                            value={row.highlightBadge}
                            onChange={(event) =>
                              handleFieldChange(
                                row.id,
                                "highlightBadge",
                                event.target.value,
                              )
                            }
                            placeholder="Best seller, New drop, Limited"
                            className="h-8 text-[11px]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[11px] font-medium text-muted-foreground">
                            Styled by AH Adele (optional)
                          </label>
                          <textarea
                            value={row.outfitNote}
                            onChange={(event) =>
                              handleFieldChange(
                                row.id,
                                "outfitNote",
                                event.target.value,
                              )
                            }
                            rows={2}
                            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-[11px] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            placeholder="How would you style this piece?"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Button
        type="submit"
        size="sm"
        className="mt-1 px-3 text-xs"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saving campaign products..." : "Save campaign products"}
      </Button>
    </form>
  );
}
