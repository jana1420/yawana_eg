import { redirect } from "next/navigation";

import { getAdminSupabase } from "@/lib/admin";
import { Card, CardContent } from "@/components/ui/card";
import { AdminQuickNav } from "@/components/admin/admin-quick-nav";

export default async function AdminCategoriesPage() {
  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    redirect("/login?from=/admin/categories");
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, is_featured, image_url, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 pb-12 pt-8">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Categories
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage the product categories for RimalTold.
          </p>
        </div>
        <a
          href="/admin/categories/new"
          className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          New category
        </a>
      </div>
      <AdminQuickNav />

      <Card>
        <CardContent className="p-0 text-sm">
          {!categories || categories.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              No categories yet. Use "New category" to add one.
            </div>
          ) : (
            <div className="divide-y">
              <div className="hidden border-b px-4 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:grid sm:grid-cols-[1.6fr_1.2fr_1fr_auto] sm:gap-3">
                <span>Category</span>
                <span>Slug</span>
                <span>Featured</span>
                <span className="text-right">Actions</span>
              </div>
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="grid grid-cols-1 items-start gap-2 px-4 py-3 text-xs hover:bg-muted/60 sm:grid-cols-[1.6fr_1.2fr_1fr_auto] sm:items-center"
                >
                  <div className="flex items-center gap-3">
                    {category.image_url && (
                      <div className="hidden h-10 w-10 overflow-hidden rounded-md border border-border bg-muted sm:block">
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="space-y-0.5">
                      <p className="font-medium tracking-tight">{category.name}</p>
                      {category.image_url && (
                        <p className="text-[11px] text-muted-foreground">
                          Has image for home section
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground break-all sm:break-normal">
                    {category.slug}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {category.is_featured ? "Featured" : "Standard"}
                  </span>
                  <div className="flex justify-end">
                    <a
                      href={`/admin/categories/${category.id}`}
                      className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Edit
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
