import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function TermsPage() {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("site_settings")
    .select("terms_content, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const content = (data?.terms_content ?? "").trim();

  return (
    <div className="space-y-6 pb-12 pt-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Terms &amp; conditions
        </h1>
        <p className="text-sm text-muted-foreground">
          The rules for using the RimalTold store and placing orders.
        </p>
      </div>

      <div className="prose prose-sm max-w-3xl text-muted-foreground">
        {content ? (
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
            {content}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Your terms &amp; conditions will appear here once configured in the
            admin dashboard.
          </p>
        )}
      </div>
    </div>
  );
}
