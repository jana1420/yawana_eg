import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("blog_posts")
    .select(
      "id, title, slug, excerpt, cover_image_url, content_html, created_at, is_published",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!data || (data as { is_published?: boolean | null }).is_published === false) {
    return notFound();
  }

  const post = {
    id: data.id as string,
    title: (data.title as string) ?? "Untitled post",
    slug: data.slug as string,
    excerpt: (data as { excerpt?: string | null }).excerpt ?? null,
    coverImageUrl:
      ((data as { cover_image_url?: string | null }).cover_image_url ?? null) as
        | string
        | null,
    contentHtml:
      ((data as { content_html?: string | null }).content_html ?? "") as string,
    createdAt: (data as { created_at?: string | null }).created_at ?? null,
  };

  const createdLabel = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString()
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12 pt-10 px-4">
      <header className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
          Told By Rimal
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {post.title}
        </h1>
        {createdLabel && (
          <p className="text-xs text-muted-foreground">{createdLabel}</p>
        )}
        {post.excerpt && (
          <p className="text-sm text-muted-foreground">{post.excerpt}</p>
        )}
      </header>

      {post.coverImageUrl && (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted">
          <img
            src={post.coverImageUrl}
            alt={post.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <article className="prose prose-sm max-w-none text-muted-foreground">
        {post.contentHtml ? (
          <div
            className="text-sm leading-relaxed text-foreground"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            This story does not have any content yet.
          </p>
        )}
      </article>
    </div>
  );
}

