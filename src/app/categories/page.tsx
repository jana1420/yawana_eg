import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function CategoriesPage() {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name", { ascending: true });

  const categories = (data ?? []) as {
    id: string;
    name: string;
    slug: string;
  }[];

  return (
    <div className="space-y-6 pb-12 pt-8">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
          Shop by category
        </h1>
        <p className="text-sm text-muted-foreground">
          Browse pieces by category.
        </p>
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">No categories found yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {category.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
