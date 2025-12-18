import { NextResponse } from "next/server";

import { z } from "zod";

import { getAdminSupabase, logAdminActivity } from "@/lib/admin";

const blogSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
  content: z.string().min(1),
  isPublished: z.boolean().optional().default(true),
});

export async function GET() {
  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, cover_image_url, is_published, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Could not fetch blog posts" },
      { status: 500 },
    );
  }

  return NextResponse.json({ posts: data ?? [] }, { status: 200 });
}

export async function POST(request: Request) {
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

  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      title: value.title,
      slug: value.slug,
      excerpt: value.excerpt ?? null,
      cover_image_url: value.coverImageUrl ?? null,
      content_html: value.content,
      is_published: value.isPublished ?? true,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create blog post" },
      { status: 500 },
    );
  }

  await logAdminActivity(supabase, adminProfileId, {
    action: "create_blog_post",
    entityType: "blog_post",
    entityId: data.id as string,
    description: `Created blog post "${value.title}"`,
  });

  return NextResponse.json({ id: data.id }, { status: 201 });
}

