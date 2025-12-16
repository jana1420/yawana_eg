import { NextResponse } from "next/server";

import { z } from "zod";

import { getAdminSupabase } from "@/lib/admin";

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  isFeatured: z.boolean().optional().default(false),
  imageUrl: z.string().optional(),
});

export async function GET() {
  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, is_featured, image_url, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Could not fetch categories" },
      { status: 500 },
    );
  }

  return NextResponse.json({ categories: data ?? [] }, { status: 200 });
}

export async function POST(request: Request) {
  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = categorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const value = parsed.data;

  const { data, error } = await supabase
    .from("categories")
    .insert({
      name: value.name,
      slug: value.slug,
      is_featured: value.isFeatured ?? false,
      image_url: value.imageUrl ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create category" },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
