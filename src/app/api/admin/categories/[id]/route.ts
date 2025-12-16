import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { getAdminSupabase } from "@/lib/admin";

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  isFeatured: z.boolean().optional().default(false),
  imageUrl: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
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

  const { id } = await context.params;

  const { error } = await supabase
    .from("categories")
    .update({
      name: value.name,
      slug: value.slug,
      is_featured: value.isFeatured ?? false,
      image_url: value.imageUrl ?? null,
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Could not update category" },
      { status: 500 },
    );
  }

  return NextResponse.json({ id }, { status: 200 });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await context.params;

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Could not delete category" },
      { status: 500 },
    );
  }

  return NextResponse.json({ id }, { status: 200 });
}
