import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function AnnouncementBar() {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("site_settings")
    .select("hero_banner_text")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const text = (data?.hero_banner_text ?? "").trim();

  if (!text) {
    return null;
  }

  const repeated = Array.from({ length: 6 }, () => text).join("  •  ");

  return (
    <div className="border-b border-border/60 bg-secondary/90 text-white backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center overflow-hidden px-4 py-2 text-[11px] font-medium tracking-wide sm:text-xs">
        <div className="flex animate-hero-marquee whitespace-nowrap">
          <span>{repeated}</span>
        </div>
      </div>
    </div>
  );
}
