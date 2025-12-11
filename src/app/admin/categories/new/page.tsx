import { redirect } from "next/navigation";

import { getAdminSupabase } from "@/lib/admin";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryForm } from "@/components/admin/category-form";
import { AdminQuickNav } from "@/components/admin/admin-quick-nav";

export default async function AdminNewCategoryPage() {
  const { isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    redirect("/login?from=/admin/categories/new");
  }

  return (
    <div className="space-y-6 pb-12 pt-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          New category
        </h1>
        <p className="text-sm text-muted-foreground">
          Create a new category for organizing products.
        </p>
      </div>
      <AdminQuickNav />
      <Card>
        <CardContent className="p-6">
          <CategoryForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
