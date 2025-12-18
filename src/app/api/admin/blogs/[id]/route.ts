import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { getAdminSupabase, logAdminActivity } from "@/lib/admin";

const blogSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
  videoUrl: z.string().url().optional().nullable(),
  content: z.string().min(1),
  isPublished: z.boolean().optional().default(true),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { supabase, isAdmin, adminProfileId } = await getAdminSupabase();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = blogSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const value = parsed.data;
  const { id } = await context.params;

  const { error } = await supabase
    .from("blog_posts")
    .update({
      title: value.title,
      slug: value.slug,
      excerpt: value.excerpt ?? null,
      cover_image_url: value.coverImageUrl ?? null,
      video_url: value.videoUrl ?? null,
      content_html: value.content,
      is_published: value.isPublished ?? true,
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Could not update blog post" },
      { status: 500 },
    );
  }

  await logAdminActivity(supabase, adminProfileId, {
    action: "update_blog_post",
    entityType: "blog_post",
    entityId: id,
    description: `Updated blog post "${value.title}"`,
  });

  return NextResponse.json({ id }, { status: 200 });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { supabase, isAdmin, adminProfileId } = await getAdminSupabase();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await context.params;

  const { error } = await supabase.from("blog_posts").delete().eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Could not delete blog post" },
      { status: 500 },
    );
  }

  await logAdminActivity(supabase, adminProfileId, {
    action: "delete_blog_post",
    entityType: "blog_post",
    entityId: id,
    description: `Deleted blog post with id ${id}`,
  });

  return NextResponse.json({ id }, { status: 200 });
}

