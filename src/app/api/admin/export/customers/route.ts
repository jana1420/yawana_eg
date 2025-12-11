import { NextRequest, NextResponse } from "next/server";

import { getAdminSupabase } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-service";

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
  const { isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const adminClient = createSupabaseAdminClient();

  const { searchParams } = new URL(request.url);
  const rangeParam = searchParams.get("range");
  const fromIso = getFromIsoForRange(rangeParam);

  let query = adminClient
    .from("user_profiles")
    .select("id, user_id, email, full_name, phone, role, created_at")
    .order("created_at", { ascending: false });

  if (fromIso) {
    query = query.gte("created_at", fromIso);
  }

  const { data, error } = await query;

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to export customers" },
      { status: 500 },
    );
  }

  const header = [
    "id",
    "user_id",
    "email",
    "full_name",
    "phone",
    "role",
    "created_at",
  ];

  const lines = [header.join(",")];

  for (const customer of data) {
    const row = [
      escapeCsvValue(customer.id),
      escapeCsvValue(customer.user_id),
      escapeCsvValue(customer.email),
      escapeCsvValue(customer.full_name),
      escapeCsvValue(customer.phone),
      escapeCsvValue(customer.role),
      escapeCsvValue(customer.created_at ?? ""),
    ];

    lines.push(row.join(","));
  }

  const csv = lines.join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="customers-${Date.now()}.csv"`,
    },
  });
}
