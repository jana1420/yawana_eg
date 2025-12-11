import { NextResponse } from "next/server";

import { z } from "zod";

import { getAdminSupabase, logAdminActivity } from "@/lib/admin";

const bodySchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  mode: z.enum(["sell", "add"]),
  size: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  const { supabase, isAdmin, adminProfileId } = await getAdminSupabase();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const rawBody = await request.json();
  const parsed = bodySchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { productId, quantity, mode, size, color } = parsed.data;

  if (size && color) {
    return NextResponse.json(
      { error: "Please specify either size or color, not both." },
      { status: 400 },
    );
  }

  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("id, name, stock, sizes, size_stock, colors, color_stock")
    .eq("id", productId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: "Could not load product" }, { status: 500 });
  }

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const currentStock =
    typeof (product as { stock?: number | null }).stock === "number"
      ? ((product as { stock?: number | null }).stock as number)
      : 0;

  const rawSizeStock = (product as { size_stock?: unknown }).size_stock ?? [];
  let sizeStock = Array.isArray(rawSizeStock)
    ? (rawSizeStock
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const value = entry as { size?: unknown; stock?: unknown };
          if (typeof value.size !== "string") return null;
          const n =
            typeof value.stock === "number" ? value.stock : Number(value.stock);
          const stock = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
          return { size: value.size, stock };
        })
        .filter(Boolean) as { size: string; stock: number }[])
    : [];

  const rawColorStock = (product as { color_stock?: unknown }).color_stock ?? [];
  let colorStock = Array.isArray(rawColorStock)
    ? (rawColorStock
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const value = entry as {
            color?: unknown;
            hex?: unknown;
            stock?: unknown;
          };
          if (typeof value.color !== "string") return null;
          const n =
            typeof value.stock === "number" ? value.stock : Number(value.stock);
          const stock = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
          const hex =
            typeof value.hex === "string" && value.hex.length > 0
              ? value.hex
              : null;
          return { color: value.color, hex, stock };
        })
        .filter(Boolean) as { color: string; hex: string | null; stock: number }[])
    : [];

  const delta = mode === "sell" ? -quantity : quantity;

  let nextStock = currentStock;

  if (size) {
    let found = false;
    sizeStock = sizeStock.map((entry) => {
      if (entry.size !== size) return entry;
      found = true;
      const next = entry.stock + delta;
      return { ...entry, stock: next < 0 ? 0 : next };
    });

    if (!found) {
      return NextResponse.json(
        { error: `Size ${size} is not configured for this product.` },
        { status: 400 },
      );
    }

    nextStock = sizeStock.reduce((sum, entry) => sum + entry.stock, 0);
  } else if (color) {
    let found = false;
    colorStock = colorStock.map((entry) => {
      if (entry.color !== color) return entry;
      found = true;
      const next = entry.stock + delta;
      return { ...entry, stock: next < 0 ? 0 : next };
    });

    if (!found) {
      return NextResponse.json(
        { error: `Color ${color} is not configured for this product.` },
        { status: 400 },
      );
    }

    nextStock = colorStock.reduce((sum, entry) => sum + entry.stock, 0);
  } else {
    if (mode === "sell") {
      nextStock = Math.max(0, currentStock - quantity);
    } else {
      nextStock = currentStock + quantity;
    }
  }

  const updatePayload: Record<string, unknown> = {
    stock: nextStock,
  };

  if (size) {
    updatePayload.size_stock = sizeStock;
  }

  if (color) {
    updatePayload.color_stock = colorStock;
  }

  const { error: updateError } = await supabase
    .from("products")
    .update(updatePayload)
    .eq("id", productId);

  if (updateError) {
    return NextResponse.json({ error: "Could not update stock" }, { status: 500 });
  }

  await logAdminActivity(supabase, adminProfileId, {
    action: "adjust_stock",
    entityType: "product",
    entityId: productId,
    description: `${mode === "sell" ? "Sold" : "Adjusted"} ${quantity} units${
      size ? ` (size ${size})` : ""
    }${color ? ` (color ${color})` : ""} (stock ${currentStock} → ${nextStock})`,
  });

  return NextResponse.json(
    {
      stock: nextStock,
      sizeStock,
      colorStock,
    },
    { status: 200 },
  );
}
