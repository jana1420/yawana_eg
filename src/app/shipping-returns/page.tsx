import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ShippingReturnsPage() {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("site_settings")
    .select("shipping_returns_content, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const content = (data?.shipping_returns_content ?? "").trim();

  return (
    <div className="space-y-6 pb-12 pt-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Shipping &amp; returns
        </h1>
        <p className="text-sm text-muted-foreground">
          Learn how delivery and returns work for RimalTold orders.
        </p>
      </div>

      <div className="prose prose-sm max-w-3xl text-muted-foreground">
        {content ? (
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
            {content}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Shipping &amp; returns details will appear here once configured in the
            admin dashboard.
          </p>
        )}
      </div>
    </div>
  );
}
