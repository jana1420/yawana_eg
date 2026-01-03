import { redirect } from "next/navigation";

import { getAdminSupabase } from "@/lib/admin";
import { Card, CardContent } from "@/components/ui/card";
import { AdminQuickNav } from "@/components/admin/admin-quick-nav";

export default async function AdminBlogsPage() {
  const { isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    redirect("/login?from=/admin/blogs");
  }

  return (
    <div className="space-y-6 pb-12 pt-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Blog posts (locked)
        </h1>
        <p className="text-sm text-muted-foreground">
          The blog feature is currently disabled in this store.
        </p>
      </div>

      <AdminQuickNav />

      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Blog management is locked. Any existing posts are hidden from customers.
        </CardContent>
      </Card>
    </div>
  );
}

