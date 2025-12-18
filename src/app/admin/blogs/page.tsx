import { redirect } from "next/navigation";

import { getAdminSupabase } from "@/lib/admin";
import { Card, CardContent } from "@/components/ui/card";
import { AdminQuickNav } from "@/components/admin/admin-quick-nav";

export default async function AdminBlogsPage() {
  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    redirect("/login?from=/admin/blogs");
  }

  const { data } = await supabase
    .from("blog_posts")
    .select("id, title, slug, is_published, created_at")
    .order("created_at", { ascending: false });

  const posts = (data ?? []).map((row) => {
    const createdAt = (row as { created_at?: string | null }).created_at ?? null;
    return {
      id: row.id as string,
      title: (row.title as string) ?? "Untitled post",
      slug: row.slug as string,
      isPublished: ((row as { is_published?: boolean | null }).is_published ??
        false) as boolean,
      createdAt,
    };
  });

  return (
    <div className="space-y-6 pb-12 pt-8">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Blog posts
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage stories for the "Told By Rimal" blog.
          </p>
        </div>
        <a
          href="/admin/blogs/new"
          className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          New post
        </a>
      </div>

      <AdminQuickNav />

      <Card>
        <CardContent className="p-0 text-sm">
          {!posts || posts.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              No posts yet. Use "New post" to add one.
            </div>
          ) : (
            <div className="divide-y">
              <div className="hidden border-b px-4 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,0.9fr)_auto] sm:gap-3">
                <span>Title</span>
                <span>Slug</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
              </div>
              {posts.map((post) => {
                const createdAtLabel = post.createdAt
                  ? new Date(post.createdAt).toLocaleDateString()
                  : null;
                const statusLabel = post.isPublished ? "Published" : "Draft";

                return (
                  <div
                    key={post.id}
                    className="grid grid-cols-1 items-start gap-2 px-4 py-3 text-xs hover:bg-muted/60 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,0.9fr)_auto] sm:items-center"
                  >
                    <div className="space-y-0.5">
                      <p className="font-medium tracking-tight">{post.title}</p>
                      {createdAtLabel && (
                        <p className="text-[11px] text-muted-foreground">
                          {createdAtLabel}
                        </p>
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-muted-foreground break-all sm:break-normal">
                      {post.slug}
                    </span>
                    <span
                      className={`text-xs ${
                        post.isPublished
                          ? "text-emerald-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {statusLabel}
                    </span>
                    <div className="flex justify-end gap-2">
                      <a
                        href={`/admin/blogs/${post.id}`}
                        className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                      >
                        Edit
                      </a>
                      <a
                        href={`/blog/${post.slug}`}
                        className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        View
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

