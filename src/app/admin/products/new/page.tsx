import { redirect } from "next/navigation";

import { getAdminSupabase } from "@/lib/admin";
import { Card, CardContent } from "@/components/ui/card";
import { ProductForm } from "@/components/admin/product-form";
import { AdminQuickNav } from "@/components/admin/admin-quick-nav";

export default async function AdminNewProductPage() {
  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    redirect("/login?from=/admin/products/new");
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });

  return (
    <div className="space-y-6 pb-12 pt-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          New product
        </h1>
        <p className="text-sm text-muted-foreground">
          Create a new item in the clothing catalog.
        </p>
      </div>
      <AdminQuickNav />
      <Card>
        <CardContent className="p-6">
          <ProductForm
            mode="create"
            categories={categories ?? []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
