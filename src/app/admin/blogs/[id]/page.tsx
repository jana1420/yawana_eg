import { notFound, redirect } from "next/navigation";

import { getAdminSupabase } from "@/lib/admin";
import { Card, CardContent } from "@/components/ui/card";
import { AdminQuickNav } from "@/components/admin/admin-quick-nav";
import { BlogForm } from "@/components/admin/blog-form";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminEditBlogPage({ params }: PageProps) {
  const { id } = await params;

  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    redirect("/login?from=/admin/blogs");
  }

  const { data } = await supabase
    .from("blog_posts")
    .select(
      "id, title, slug, excerpt, cover_image_url, content_html, is_published",
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    return notFound();
  }

  const initialValues = {
    title: (data.title as string) ?? "Untitled post",
    slug: data.slug as string,
    excerpt: (data as { excerpt?: string | null }).excerpt ?? null,
    coverImageUrl:
      ((data as { cover_image_url?: string | null }).cover_image_url ?? null) as
        | string
        | null,
    content: ((data as { content_html?: string | null }).content_html ?? "") as string,
    isPublished:
      ((data as { is_published?: boolean | null }).is_published ?? false) as boolean,
  };

  return (
    <div className="space-y-6 pb-12 pt-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Edit blog post
        </h1>
        <p className="text-sm text-muted-foreground">
          Update the content for this story.
        </p>
      </div>

      <AdminQuickNav />

      <Card>
        <CardContent className="p-6">
          <BlogForm mode="edit" blogId={id} initialValues={initialValues} />
        </CardContent>
      </Card>
    </div>
  );
}

