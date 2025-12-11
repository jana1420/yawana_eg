import { redirect } from "next/navigation";

import { getAdminSupabase } from "@/lib/admin";
import { Card, CardContent } from "@/components/ui/card";
import { AdminQuickNav } from "@/components/admin/admin-quick-nav";
import { AdminProductsTable } from "./products-table";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export default async function AdminProductsPage() {
  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    redirect("/login?from=/admin/products");
  }

  const { data: products } = await supabase
    .from("products")
    .select(
      "id, name, slug, sku, price, sale_price, stock, is_featured, created_at, images, category_id, categories(name)",
    )
    .order("created_at", { ascending: false });

  const rows = (products ?? []).map((product) => {
    const salePrice = (product as { sale_price?: number | null }).sale_price;
    const images = (product as { images?: string[] | null }).images ?? [];
    const categoryName = (product as {
      categories?: { name?: string | null } | null;
    }).categories?.name;

    return {
      id: product.id as string,
      name: product.name as string,
      slug: product.slug as string,
      sku: (product as { sku?: string | null }).sku ?? null,
      price: product.price as number,
      sale_price: salePrice ?? null,
      stock: product.stock as number,
      is_featured: product.is_featured as boolean,
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
          Manage the clothing catalog for LooseBrand.
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
