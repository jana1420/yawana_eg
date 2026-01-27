import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type VideoEmbedConfig = {
  type: "iframe" | "video";
  src: string;
  platform?: "youtube" | "instagram" | "tiktok" | "direct" | "other";
};

function getVideoEmbedConfig(url: string): VideoEmbedConfig {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      let videoId: string | null = null;

      if (host.includes("youtu.be")) {
        videoId = parsed.pathname.split("/").filter(Boolean)[0] ?? null;
      } else if (parsed.searchParams.get("v")) {
        videoId = parsed.searchParams.get("v");
      } else if (
        parsed.pathname.startsWith("/shorts/") ||
        parsed.pathname.startsWith("/embed/")
      ) {
        const parts = parsed.pathname.split("/").filter(Boolean);
        videoId = parts[1] ?? null;
      }

      if (videoId) {
        return {
          type: "iframe",
          src: `https://www.youtube.com/embed/${videoId}`,
          platform: "youtube",
        };
      }
    }

    if (host.includes("instagram.com")) {
      const parts = parsed.pathname.split("/").filter(Boolean);

      // Expect paths like /reel/{code}/, /p/{code}/, /tv/{code}/
      if (parts.length >= 2) {
        const type = parts[0];
        const code = parts[1];
        const embedSrc = `https://www.instagram.com/${type}/${code}/embed/`;
        return { type: "iframe", src: embedSrc, platform: "instagram" };
      }

      return { type: "iframe", src: url, platform: "instagram" };
    }

    if (host.includes("tiktok.com")) {
      return { type: "iframe", src: url, platform: "tiktok" };
    }

    const lowerPath = parsed.pathname.toLowerCase();
    if (/\.(mp4|webm|ogg|mov|m4v)$/.test(lowerPath)) {
      return { type: "video", src: url, platform: "direct" };
    }

    return { type: "video", src: url, platform: "other" };
  } catch {
    return { type: "video", src: url, platform: "other" };
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("blog_posts")
    .select(
      "id, title, slug, excerpt, cover_image_url, video_url, content_html, created_at, is_published",
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
    videoUrl:
      ((data as { video_url?: string | null }).video_url ?? null) as
        | string
        | null,
    contentHtml:
      ((data as { content_html?: string | null }).content_html ?? "") as string,
    createdAt: (data as { created_at?: string | null }).created_at ?? null,
  };

  const createdLabel = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString()
    : null;

  const videoEmbed = post.videoUrl
    ? getVideoEmbedConfig(post.videoUrl)
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12 pt-10 px-4">
      <header className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
          SistahModest journal
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

      {videoEmbed && (
        <div className="rounded-2xl border border-border/70 bg-card p-4 text-sm text-muted-foreground">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Video
          </p>
          <div className="mt-2 w-full overflow-hidden rounded-xl bg-background">
            {videoEmbed.type === "iframe" ? (
              videoEmbed.platform === "instagram" ? (
                <iframe
                  src={videoEmbed.src}
                  className="h-[600px] w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                />
              ) : (
                <div className="aspect-video w-full">
                  <iframe
                    src={videoEmbed.src}
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              )
            ) : (
              <div className="aspect-video w-full bg-black">
                <video
                  src={videoEmbed.src}
                  controls
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            If the player does not load, you can{" "}
            <a
              href={post.videoUrl ?? videoEmbed.src}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              open the video in a new tab
            </a>
            .
          </p>
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

