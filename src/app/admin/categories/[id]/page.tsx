import { notFound, redirect } from "next/navigation";

import { getAdminSupabase } from "@/lib/admin";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryForm } from "@/components/admin/category-form";
import { AdminQuickNav } from "@/components/admin/admin-quick-nav";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminEditCategoryPage({ params }: PageProps) {
  const { id } = await params;

  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    redirect("/login?from=/admin/categories");
  }

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug, is_featured")
    .eq("id", id)
    .maybeSingle();

  if (!category) {
    return notFound();
  }

  return (
    <div className="space-y-6 pb-12 pt-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Edit category
        </h1>
        <p className="text-sm text-muted-foreground">
          Update the details for this category.
        </p>
      </div>
      <AdminQuickNav />
      <Card>
        <CardContent className="p-6">
          <CategoryForm
            mode="edit"
            categoryId={category.id}
            initialValues={{
              name: category.name,
              slug: category.slug,
              isFeatured: category.is_featured ?? false,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
