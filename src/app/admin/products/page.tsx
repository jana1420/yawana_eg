import { redirect } from "next/navigation";

import { getAdminSupabase } from "@/lib/admin";
import { Card, CardContent } from "@/components/ui/card";
import { AdminQuickNav } from "@/components/admin/admin-quick-nav";
import { AdminProductsTable } from "./products-table";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function AdminProductsPage() {
  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    redirect("/login?from=/admin/products");
  }

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, slug, sku, price, sale_price, stock, is_featured, is_archived, created_at, images, category_id",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("id, name"),
  ]);

  const categoryNameById = new Map<string, string>();

  for (const category of categories ?? []) {
    const id = (category as { id?: string }).id;
    const name = (category as { name?: string | null }).name;
    if (id && name) {
      categoryNameById.set(id, name);
    }
  }

  const rows = (products ?? []).map((product) => {
    const salePrice = (product as { sale_price?: number | null }).sale_price;
    const images = (product as { images?: string[] | null }).images ?? [];
    const categoryId = (product as { category_id?: string | null }).category_id ?? null;
    const categoryName = categoryId ? categoryNameById.get(categoryId) ?? null : null;

    return {
      id: product.id as string,
      name: product.name as string,
      slug: product.slug as string,
      sku: (product as { sku?: string | null }).sku ?? null,
      price: product.price as number,
      sale_price: salePrice ?? null,
      stock: product.stock as number,
      is_featured: product.is_featured as boolean,
      is_archived:
        ((product as { is_archived?: boolean | null }).is_archived ?? false) ===
        true,
      created_at: product.created_at as string,
      images,
      category_name: categoryName ?? null,
    };
  });

  return (
    <div className="space-y-6 pb-12 pt-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Products
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage the clothing catalog for SistahModest.
        </p>
      </div>
      <AdminQuickNav />

      <Card>
        <CardContent className="p-0 text-sm">
          <AdminProductsTable products={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
