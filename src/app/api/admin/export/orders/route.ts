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
    .from("orders")
    .select("id, created_at, status, email, total, shipping_address")
    .order("created_at", { ascending: false });

  if (fromIso) {
    query = query.gte("created_at", fromIso);
  }

  const { data, error } = await query;

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to export orders" },
      { status: 500 },
    );
  }

  const header = [
    "id",
    "created_at",
    "status",
    "email",
    "total_egp",
    "customer_name",
    "city",
    "phone",
  ];

  const lines = [header.join(",")];

  for (const order of data) {
    const createdAt = order.created_at ?? "";
    const totalEgp = typeof order.total === "number" ? order.total / 100 : "";
    const shipping = (order.shipping_address ?? null) as
      | {
          fullName?: string;
          city?: string;
          phone?: string;
        }
      | null;

    const row = [
      escapeCsvValue(order.id),
      escapeCsvValue(createdAt),
      escapeCsvValue(order.status),
      escapeCsvValue(order.email),
      escapeCsvValue(totalEgp),
      escapeCsvValue(shipping?.fullName ?? ""),
      escapeCsvValue(shipping?.city ?? ""),
      escapeCsvValue(shipping?.phone ?? ""),
    ];

    lines.push(row.join(","));
  }

  const csv = lines.join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${Date.now()}.csv"`,
    },
  });
}
