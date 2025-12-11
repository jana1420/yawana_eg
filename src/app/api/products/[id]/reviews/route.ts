import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = await createSupabaseServerClient();
  const { id } = await context.params;
  const slug = id;

  const { data: productRow, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  if (!productRow) {
    return NextResponse.json({ reviews: [] });
  }

  const productId = productRow.id as string;

  const { data, error } = await supabase
    .from("product_reviews")
    .select("id, rating, comment, created_at, user_id")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reviews: data ?? [] });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body.rating !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const rating = Math.round(body.rating);
  const comment =
    typeof body.comment === "string" && body.comment.trim().length > 0
      ? body.comment.trim()
      : null;

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  const { id } = await context.params;
  const slug = id;

  const { data: productRow, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  if (!productRow) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const productId = productRow.id as string;

  const { error } = await supabase.from("product_reviews").insert({
    product_id: productId,
    user_id: user.id,
    rating,
    comment,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
