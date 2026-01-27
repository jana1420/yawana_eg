import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

export default async function BlogIndexPage() {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, cover_image_url, created_at, is_published")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const posts = (data ?? []).map((row) => {
    const createdAt = (row as { created_at?: string | null }).created_at ?? null;
    return {
      id: row.id as string,
      title: (row.title as string) ?? "Untitled post",
      slug: row.slug as string,
      excerpt: ((row as { excerpt?: string | null }).excerpt ?? "") as string,
      coverImageUrl:
        ((row as { cover_image_url?: string | null }).cover_image_url ?? null) as
          | string
          | null,
      createdAt,
    };
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12 pt-10 px-4">
      <header className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
          SistahModest journal
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Stories from SistahModest
        </h1>
        <p className="text-sm text-muted-foreground">
          Styling notes, behind-the-scenes moments, and short updates from the
          brand.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No stories yet. Once you publish a post in the admin, it will appear
          here.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {posts.map((post) => {
            const createdLabel = post.createdAt
              ? new Date(post.createdAt).toLocaleDateString()
              : null;

            return (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
              >
                <Card className="h-full overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-sm transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:shadow-md">
                  {post.coverImageUrl && (
                    <div className="h-44 w-full overflow-hidden border-b border-border/60 bg-muted sm:h-52">
                      <img
                        src={post.coverImageUrl}
                        alt={post.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="space-y-2 px-4 py-4">
                    {createdLabel && (
                      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                        {createdLabel}
                      </p>
                    )}
                    <h2 className="text-sm font-semibold tracking-tight group-hover:text-primary">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="line-clamp-3 text-xs text-muted-foreground">
                        {post.excerpt}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

