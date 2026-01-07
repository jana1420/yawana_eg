"use client";

import { useEffect, useMemo, useState } from "react";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/slug";

type CategoryOption = {
  id: string;
  name: string;
};

type ProductFormProps = {
  mode: "create" | "edit";
  productId?: string;
  initialValues?: {
    name: string;
    slug: string;
    sku?: string | null;
    description: string | null;
    longDescription?: string | null;
    priceCents: number;
    salePriceCents?: number | null;
    stock: number;
    imageUrl: string | null;
    galleryImageUrls?: string[];
    sizes?: string[];
    sizeStock?: { size: string; stock: number }[];
    colors?: string[];
    colorStock?: {
      color: string;
      hex: string | null;
      stock: number;
      imageUrl?: string | null;
    }[];
    categoryId: string | null;
    categoryIds?: string[] | null;
    isFeatured: boolean;
    isNewArrival?: boolean;
  };
  categories: CategoryOption[];
};

export function ProductForm({
  mode,
  productId,
  initialValues,
  categories,
}: ProductFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const MAX_IMAGE_SIZE_BYTES = 500 * 1024;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initialValues?.name ?? "");
  const [slug, setSlug] = useState(initialValues?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValues?.slug));
  const [sku, setSku] = useState(initialValues?.sku ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? "",
  );
  const [longDescription, setLongDescription] = useState(
    initialValues?.longDescription ?? "",
  );
  const [price, setPrice] = useState(
    initialValues ? (initialValues.priceCents / 100).toString() : "",
  );
  const [salePrice, setSalePrice] = useState(
    initialValues?.salePriceCents != null
      ? (initialValues.salePriceCents / 100).toString()
      : "",
  );
  const [stock, setStock] = useState(
    initialValues ? String(initialValues.stock) : "0",
  );
  const [imageUrl, setImageUrl] = useState(initialValues?.imageUrl ?? "");
  const [galleryImages, setGalleryImages] = useState(
    initialValues?.galleryImageUrls?.join("\n") ?? "",
  );
  const [sizeRows, setSizeRows] = useState<
    { size: string; stock: string }[]
  >(() => {
    const fromInitial = initialValues?.sizeStock ?? [];
    const baseSizes =
      initialValues?.sizes && initialValues.sizes.length > 0
        ? initialValues.sizes
        : fromInitial.map((entry) => entry.size);

    if (!baseSizes || baseSizes.length === 0) {
      return [];
    }

    const stockBySize = new Map(
      fromInitial.map((entry) => [entry.size, String(entry.stock)]),
    );

    return baseSizes.map((size) => ({
      size,
      stock: stockBySize.get(size) ?? "",
    }));
  });

  const [colorRows, setColorRows] = useState<
    { color: string; hex: string; stock: string; imageUrl: string }[]
  >(() => {
    const fromInitial = initialValues?.colorStock ?? [];
    const baseColors =
      initialValues?.colors && initialValues.colors.length > 0
        ? initialValues.colors
        : fromInitial.map((entry) => entry.color);

    if (!baseColors || baseColors.length === 0) {
      return [];
    }

    const stockByColor = new Map(
      fromInitial.map((entry) => [entry.color, String(entry.stock)]),
    );
    const hexByColor = new Map(
      fromInitial.map((entry) => [entry.color, entry.hex ?? ""]),
    );
    const imageUrlByColor = new Map(
      fromInitial.map((entry) => [entry.color, entry.imageUrl ?? ""]),
    );

    return baseColors.map((color) => ({
      color,
      hex: hexByColor.get(color) ?? "#000000",
      stock: stockByColor.get(color) ?? "",
      imageUrl: imageUrlByColor.get(color) ?? "",
    }));
  });

  const [categoryIds, setCategoryIds] = useState<string[]>(() => {
    if (initialValues?.categoryIds && initialValues.categoryIds.length > 0) {
      return Array.from(new Set(initialValues.categoryIds));
    }
    if (initialValues?.categoryId) {
      return [initialValues.categoryId];
    }
    return [];
  });
  const [isFeatured, setIsFeatured] = useState(
    initialValues?.isFeatured ?? false,
  );
  const [isNewArrival, setIsNewArrival] = useState(
    initialValues?.isNewArrival ?? false,
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  function handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextName = event.target.value;
    setName(nextName);
    if (!slugTouched) {
      setSlug(slugify(nextName));
    }
  }

  function handleSlugChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSlugTouched(true);
    setSlug(slugify(event.target.value));
  }

  function parseImageList(value: string) {
    return value
      .split(/\r?\n|,/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  const productImageList = useMemo(() => {
    const mainImage = imageUrl.trim();
    const extraImageUrls = parseImageList(galleryImages);

    const merged = [
      ...(mainImage ? [mainImage] : []),
      ...extraImageUrls.filter((url) => url !== mainImage),
    ];

    return Array.from(new Set(merged));
  }, [galleryImages, imageUrl]);

  function handleRemoveProductImage(targetUrl: string) {
    const mainImage = imageUrl.trim();
    const extraImageUrls = parseImageList(galleryImages);

    const merged = [
      ...(mainImage ? [mainImage] : []),
      ...extraImageUrls.filter((url) => url !== mainImage),
    ];

    const nextAll = merged.filter((url) => url !== targetUrl);
    const nextMain = nextAll[0] ?? "";
    const nextExtras = nextAll.slice(1);

    setImageUrl(nextMain);
    setGalleryImages(nextExtras.join("\n"));
  }

  function handleSetMainProductImage(targetUrl: string) {
    const mainImage = imageUrl.trim();
    const extraImageUrls = parseImageList(galleryImages);

    const merged = [
      ...(mainImage ? [mainImage] : []),
      ...extraImageUrls.filter((url) => url !== mainImage),
    ];

    const rest = merged.filter((url) => url !== targetUrl);
    const nextAll = [targetUrl, ...rest];
    const unique = Array.from(new Set(nextAll));

    setImageUrl(unique[0] ?? "");
    setGalleryImages(unique.slice(1).join("\n"));
  }

  useEffect(() => {
    const totalFromSizes = sizeRows.reduce((sum, row) => {
      const trimmed = row.stock.trim();
      if (!trimmed) return sum;
      const n = Number.parseInt(trimmed, 10);
      if (!Number.isFinite(n) || n < 0) return sum;
      return sum + n;
    }, 0);

    if (totalFromSizes > 0) {
      setStock(String(totalFromSizes));
    }
  }, [sizeRows]);

  async function handleImageUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const tooLarge = files.find((file) => file.size > MAX_IMAGE_SIZE_BYTES);
    if (tooLarge) {
      setImageUploadError("Image is too large. Maximum size is 500KB.");
      event.target.value = "";
      return;
    }

    setIsUploadingImage(true);
    setImageUploadError(null);

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
          setImageUploadError(data.error ?? "Unable to upload image.");
          continue;
        }

        uploadedUrls.push(data.url);
      }

      if (uploadedUrls.length === 0) {
        setIsUploadingImage(false);
        return;
      }

      // Set main image if not already chosen
      setImageUrl((current) => (current ? current : uploadedUrls[0] ?? current));

      // Append to gallery images textarea
      setGalleryImages((current) => {
        const existing = current
          .split(/\r?\n|,/)
          .map((value) => value.trim())
          .filter(Boolean);
        const merged = [...existing, ...uploadedUrls];
        const unique = Array.from(new Set(merged));
        return unique.join("\n");
      });

      setIsUploadingImage(false);
    } catch {
      setImageUploadError("Network error. Please try again.");
      setIsUploadingImage(false);
    } finally {
      event.target.value = "";
    }
  }

  async function handleColorImageUpload(
    index: number,
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

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        setImageUploadError(data.error ?? "Unable to upload image.");
        return;
      }

      setColorRows((rows) =>
        rows.map((row, i) =>
          i === index
            ? {
                ...row,
                imageUrl: data.url ?? "",
              }
            : row,
        ),
      );
    } catch {
      setImageUploadError("Network error. Please try again.");
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmedName = name.trim();
    const finalSlug = slugify(slug || name);

    if (!trimmedName) {
      setError("Name is required.");
      return;
    }

    if (!finalSlug) {
      setError("Slug is required.");
      return;
    }

    const priceNumber = Number.parseFloat(price.replace(",", "."));
    let stockNumber = Number.parseInt(stock, 10);

    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      setError("Price must be a positive number.");
      return;
    }

    if (!Number.isInteger(stockNumber) || stockNumber < 0) {
      setError("Stock must be a non-negative integer.");
      return;
    }

    const priceCents = Math.round(priceNumber * 100);

    const salePriceTrimmed = salePrice.trim();
    let salePriceCents: number | null = null;

    if (salePriceTrimmed) {
      const salePriceNumber = Number.parseFloat(
        salePriceTrimmed.replace(",", "."),
      );

      if (!Number.isFinite(salePriceNumber) || salePriceNumber < 0) {
        setError("Sale price must be a positive number.");
        return;
      }

      if (salePriceNumber >= priceNumber) {
        setError("Sale price must be lower than regular price.");
        return;
      }

      salePriceCents = Math.round(salePriceNumber * 100);
    }

    const pathSegments = pathname.split("/").filter(Boolean);
    const idFromPath = pathSegments[pathSegments.length - 1] ?? "";
    const effectiveProductId = productId ?? idFromPath;

    if (mode === "edit" && (!effectiveProductId || effectiveProductId === "undefined")) {
      setError("Missing product id for update.");
      return;
    }

    const mainImage = imageUrl.trim();
    const extraImageUrls = galleryImages
      .split(/\r?\n|,/)
      .map((value) => value.trim())
      .filter(Boolean);

    const images = [
      ...(mainImage ? [mainImage] : []),
      ...extraImageUrls.filter((url) => url !== mainImage),
    ];

    const cleanedSizeRows = sizeRows
      .map((row) => ({
        size: row.size.trim(),
        stock: row.stock.trim(),
      }))
      .filter((row) => row.size.length > 0);

    const sizeStockPayload: { size: string; stock: number }[] = [];

    for (const row of cleanedSizeRows) {
      if (!row.stock) {
        sizeStockPayload.push({ size: row.size, stock: 0 });
        continue;
      }

      const n = Number.parseInt(row.stock, 10);
      if (!Number.isInteger(n) || n < 0) {
        setError("Per-size stock must be a non-negative integer.");
        return;
      }

      sizeStockPayload.push({ size: row.size, stock: n });
    }

    const sizes = cleanedSizeRows.map((row) => row.size);

    if (sizeStockPayload.length > 0) {
      stockNumber = sizeStockPayload.reduce(
        (sum, entry) => sum + entry.stock,
        0,
      );
    }

    const cleanedColorRows = colorRows
      .map((row) => ({
        color: row.color.trim(),
        hex: row.hex.trim(),
        stock: row.stock.trim(),
        imageUrl: row.imageUrl.trim(),
      }))
      .filter((row) => row.color.length > 0);

    const colorStockPayload: {
      color: string;
      hex: string | null;
      stock: number;
      imageUrl: string | null;
    }[] = [];

    for (const row of cleanedColorRows) {
      let stockForColor = 0;
      if (row.stock) {
        const n = Number.parseInt(row.stock, 10);
        if (!Number.isInteger(n) || n < 0) {
          setError("Per-color stock must be a non-negative integer.");
          return;
        }
        stockForColor = n;
      }

      const hex =
        row.hex && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(row.hex)
          ? row.hex
          : null;

      const imageUrl =
        row.imageUrl && row.imageUrl.length > 0 ? row.imageUrl : null;

      colorStockPayload.push({
        color: row.color,
        hex,
        stock: stockForColor,
        imageUrl,
      });
    }

    const colors = cleanedColorRows.map((row) => row.color);

    const primaryCategoryId = categoryIds[0] ?? null;

    const payload = {
      id: mode === "edit" ? effectiveProductId : undefined,
      name: trimmedName,
      slug: finalSlug,
      sku: sku.trim() || null,
      description: description || null,
      longDescription: longDescription || null,
      priceCents,
      salePriceCents,
      stock: stockNumber,
      images,
      sizes,
      sizeStock: sizeStockPayload,
      colors,
      colorStock: colorStockPayload,
      categoryId: primaryCategoryId,
      categoryIds,
      isFeatured,
      isNewArrival,
    };

    setIsSubmitting(true);
    setError(null);

    try {
      const endpoint =
        mode === "create"
          ? "/api/admin/products"
          : `/api/admin/products/${effectiveProductId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        error?: string;
        id?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Unable to save product.");
        setIsSubmitting(false);
        return;
      }

      router.push("/admin/products");
    } catch {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (mode !== "edit" || isDeleting) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this product? This cannot be undone.",
    );
    if (!confirmed) return;

    const pathSegments = pathname.split("/").filter(Boolean);
    const idFromPath = pathSegments[pathSegments.length - 1] ?? "";
    const idToDelete = productId ?? idFromPath;

    if (!idToDelete || idToDelete === "undefined") {
      setError("Missing product id for delete.");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/products/${idToDelete}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: idToDelete }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Unable to delete product.");
        setIsDeleting(false);
        return;
      }

      router.push("/admin/products");
    } catch {
      setError("Network error. Please try again.");
      setIsDeleting(false);
    }
  }

  function handleSizeRowChange(
    index: number,
    field: "size" | "stock",
    value: string,
  ) {
    setSizeRows((rows) =>
      rows.map((row, i) =>
        i === index
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    );
  }

  function handleAddSizeRow() {
    setSizeRows((rows) => [...rows, { size: "", stock: "" }]);
  }

  function handleRemoveSizeRow(index: number) {
    setSizeRows((rows) => rows.filter((_, i) => i !== index));
  }

  function handleColorRowChange(
    index: number,
    field: "color" | "hex" | "stock" | "imageUrl",
    value: string,
  ) {
    setColorRows((rows) =>
      rows.map((row, i) =>
        i === index
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    );
  }

  function handleAddColorRow() {
    setColorRows((rows) => [
      ...rows,
      { color: "", hex: "#000000", stock: "", imageUrl: "" },
    ]);
  }

  function handleRemoveColorRow(index: number) {
    setColorRows((rows) => rows.filter((_, i) => i !== index));
  }

  function handleToggleCategory(categoryId: string) {
    setCategoryIds((current) => {
      if (current.includes(categoryId)) {
        return current.filter((id) => id !== categoryId);
      }
      return [...current, categoryId];
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Name
        </label>
        <Input
          value={name}
          onChange={handleNameChange}
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
          onChange={handleSlugChange}
          required
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          SKU (optional)
        </label>
        <Input
          value={sku}
          onChange={(event) => setSku(event.target.value)}
          placeholder="Internal code like JW-001"
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Description
        </label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Long description (optional)
        </label>
        <textarea
          value={longDescription}
          onChange={(event) => setLongDescription(event.target.value)}
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="More detailed story or care instructions. Shows under the shipping info on the product page."
        />
        <p className="text-[11px] text-muted-foreground">
          Shown under the shipping/returns text on the product page. Line breaks
          are preserved.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground">
            Price (EGP)
          </label>
          <Input
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            required
            inputMode="decimal"
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground">
            Stock
          </label>
          <Input
            value={stock}
            onChange={(event) => setStock(event.target.value)}
            required
            inputMode="numeric"
            className="h-9 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Sale price (EGP, optional)
        </label>
        <Input
          value={salePrice}
          onChange={(event) => setSalePrice(event.target.value)}
          inputMode="decimal"
          placeholder="Leave empty if not on sale"
          className="h-9 text-sm"
        />
        <p className="text-[11px] text-muted-foreground">
          When set, customers will see the original price crossed out with this
          sale price and a discount badge.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Image URL
        </label>
        <Input
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder="https://..."
          className="h-9 text-sm"
        />
        <p className="text-[11px] text-muted-foreground">
          You can also upload images below. Uploaded image URLs will be added to
          the main image and gallery images.
        </p>
        <div className="mt-1 space-y-1 rounded-md border border-dashed border-input bg-muted/20 p-2 text-[11px]">
          <div className="flex flex-wrap items-center gap-2">
            <input
              id="product-image-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={isUploadingImage}
              onClick={() =>
                document.getElementById("product-image-upload")?.click()
              }
            >
              {isUploadingImage ? "Uploading..." : "Upload from device"}
            </Button>
            <span className="text-[11px] text-muted-foreground">
              Max 500KB per image. You can select multiple images.
            </span>
          </div>
          {imageUploadError && (
            <p className="text-[11px] text-red-500">{imageUploadError}</p>
          )}
        </div>

        {productImageList.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground">
              Current images
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {productImageList.map((url) => {
                const isMain = url === imageUrl.trim();
                return (
                  <div
                    key={url}
                    className="space-y-1 rounded-md border border-input bg-background p-2"
                  >
                    <div className="aspect-square w-full overflow-hidden rounded-md border border-input bg-muted">
                      <Image
                        src={url}
                        alt={isMain ? "Main product image" : "Product image"}
                        unoptimized
                        width={256}
                        height={256}
                        sizes="160px"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] text-muted-foreground">
                        {isMain ? "Main" : "Gallery"}
                      </span>
                      <div className="flex items-center gap-2">
                        {!isMain && (
                          <button
                            type="button"
                            onClick={() => handleSetMainProductImage(url)}
                            className="text-[11px] font-medium text-primary hover:underline"
                          >
                            Set as main
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveProductImage(url)}
                          className="text-[11px] text-muted-foreground hover:text-red-500"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground">
            Categories
          </label>
          <div className="space-y-1 rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm">
            {categories.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                No categories defined yet.
              </p>
            ) : (
              <div className="grid gap-1 sm:grid-cols-2">
                {categories.map((category) => {
                  const checked = categoryIds.includes(category.id);
                  return (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 text-[11px] text-muted-foreground"
                    >
                      <input
                        type="checkbox"
                        className="h-3 w-3 rounded border-input"
                        checked={checked}
                        onChange={() => handleToggleCategory(category.id)}
                      />
                      <span>{category.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            You can select more than one category. The first selected will be
            treated as the primary category.
          </p>
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground">
            Sizes & per-size stock (optional)
          </label>
          <div className="space-y-2 rounded-md border border-dashed border-input bg-muted/20 p-2">
            {sizeRows.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                Add sizes like S, M, L and set stock for each size.
              </p>
            ) : (
              <div className="space-y-1">
                {sizeRows.map((row, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2"
                  >
                    <Input
                      value={row.size}
                      onChange={(event) =>
                        handleSizeRowChange(index, "size", event.target.value)
                      }
                      placeholder="Size"
                      className="h-8 w-20 text-xs"
                    />
                    <Input
                      value={row.stock}
                      onChange={(event) =>
                        handleSizeRowChange(index, "stock", event.target.value)
                      }
                      placeholder="Stock"
                      inputMode="numeric"
                      className="h-8 w-20 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSizeRow(index)}
                      className="ml-1 text-[11px] text-muted-foreground hover:text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={handleAddSizeRow}
              className="text-[11px] font-medium text-primary hover:underline"
            >
              + Add size
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            When you set per-size stock, total stock is calculated from these
            values when saving.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Colors &amp; per-color stock (optional)
        </label>
        <div className="space-y-2 rounded-md border border-dashed border-input bg-muted/20 p-2">
          {colorRows.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">
              Add colors like Black, White and pick a color swatch and stock
              for each.
            </p>
          ) : (
            <div className="space-y-1">
              {colorRows.map((row, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-center gap-2"
                >
                  <Input
                    value={row.color}
                    onChange={(event) =>
                      handleColorRowChange(index, "color", event.target.value)
                    }
                    placeholder="Color name"
                    className="h-8 w-28 text-xs"
                  />
                  <input
                    type="color"
                    value={row.hex || "#000000"}
                    onChange={(event) =>
                      handleColorRowChange(index, "hex", event.target.value)
                    }
                    className="h-8 w-10 cursor-pointer rounded-md border border-input bg-background p-0"
                  />
                  <Input
                    value={row.stock}
                    onChange={(event) =>
                      handleColorRowChange(index, "stock", event.target.value)
                    }
                    placeholder="Stock"
                    inputMode="numeric"
                    className="h-8 w-20 text-xs"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      id={`color-image-upload-${index}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => handleColorImageUpload(index, event)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-[11px]"
                      disabled={isUploadingImage}
                      onClick={() =>
                        document
                          .getElementById(`color-image-upload-${index}`)
                          ?.click()
                      }
                    >
                      {row.imageUrl ? "Change image" : "Upload image"}
                    </Button>
                    {row.imageUrl && (
                      <div className="h-8 w-8 overflow-hidden rounded-md border border-input bg-muted">
                        <Image
                          src={row.imageUrl}
                          alt={`${row.color || "Color"} preview`}
                          unoptimized
                          width={32}
                          height={32}
                          sizes="32px"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveColorRow(index)}
                    className="ml-1 text-[11px] text-muted-foreground hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={handleAddColorRow}
            className="text-[11px] font-medium text-primary hover:underline"
          >
            + Add color
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Colors are saved with a swatch for display. Total stock still comes
          from the main stock field or per-size stock.
        </p>
      </div>

      <div className="flex items-center gap-2 pt-1 text-xs">
        <input
          id="isFeatured"
          type="checkbox"
          checked={isFeatured}
          onChange={(event) => setIsFeatured(event.target.checked)}
          className="h-3 w-3 rounded border-input text-primary"
        />
        <label htmlFor="isFeatured" className="text-xs text-muted-foreground">
          Mark as featured
        </label>
      </div>
      <div className="flex items-center gap-2 pt-1 text-xs">
        <input
          id="isNewArrival"
          type="checkbox"
          checked={isNewArrival}
          onChange={(event) => setIsNewArrival(event.target.checked)}
          className="h-3 w-3 rounded border-input text-primary"
        />
        <label htmlFor="isNewArrival" className="text-xs text-muted-foreground">
          Show in "New Arrivals" section
        </label>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <Button
        type="submit"
        className="mt-2 w-full text-sm sm:w-auto"
        disabled={isSubmitting}
      >
        {isSubmitting
          ? mode === "create"
            ? "Creating product..."
            : "Saving product..."
          : mode === "create"
            ? "Create product"
            : "Save product"}
      </Button>
      {mode === "edit" && productId && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting || isSubmitting}
          className="mt-2 w-full text-xs text-red-600 underline-offset-4 hover:underline sm:ml-3 sm:w-auto"
        >
          {isDeleting ? "Deleting..." : "Delete product"}
        </button>
      )}
    </form>
  );
}
