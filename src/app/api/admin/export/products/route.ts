import { NextRequest, NextResponse } from "next/server";

import { getAdminSupabase } from "@/lib/admin";

function getFromIsoForRange(rangeParam: string | null): string | null {
  const now = new Date();
  let from: Date | null = null;

  switch (rangeParam) {
    case "last7": {
      from = new Date(now);
      from.setDate(from.getDate() - 7);
      break;
    }
    case "last30": {
      from = new Date(now);
      from.setDate(from.getDate() - 30);
      break;
    }
    case "thisMonth": {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    }
    case "thisYear": {
      from = new Date(now.getFullYear(), 0, 1);
      break;
    }
    default: {
      from = null;
    }
  }

  return from ? from.toISOString() : null;
}

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (!/[",\n]/.test(str)) {
    return str;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const rangeParam = searchParams.get("range");
  const fromIso = getFromIsoForRange(rangeParam);

  let query = supabase
    .from("products")
    .select("id, name, slug, sku, price, sale_price, stock, category_id, created_at")
    .order("created_at", { ascending: false });

  if (fromIso) {
    query = query.gte("created_at", fromIso);
  }

  const { data, error } = await query;

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to export products" },
      { status: 500 },
    );
  }

  const header = [
    "id",
    "name",
    "slug",
    "sku",
    "price_egp",
    "sale_price_egp",
    "stock",
    "category_id",
    "created_at",
  ];

  const lines = [header.join(",")];

  for (const product of data) {
    const priceEgp = typeof product.price === "number" ? product.price / 100 : "";
    const salePriceEgp =
      typeof product.sale_price === "number" ? product.sale_price / 100 : "";

    const row = [
      escapeCsvValue(product.id),
      escapeCsvValue(product.name),
      escapeCsvValue(product.slug),
      escapeCsvValue(product.sku),
      escapeCsvValue(priceEgp),
      escapeCsvValue(salePriceEgp),
      escapeCsvValue(product.stock),
      escapeCsvValue(product.category_id),
      escapeCsvValue(product.created_at ?? ""),
    ];

    lines.push(row.join(","));
  }

  const csv = lines.join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="products-${Date.now()}.csv"`,
    },
  });
}
