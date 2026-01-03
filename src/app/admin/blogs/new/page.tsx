import { redirect } from "next/navigation";

import { getAdminSupabase } from "@/lib/admin";
import { Card, CardContent } from "@/components/ui/card";
import { AdminQuickNav } from "@/components/admin/admin-quick-nav";

export default async function AdminNewBlogPage() {
  const { isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    redirect("/login?from=/admin/blogs/new");
  }

  return (
    <div className="space-y-6 pb-12 pt-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Blog posts (locked)
        </h1>
        <p className="text-sm text-muted-foreground">
          The blog feature is currently disabled; creating new posts is not available.
        </p>
      </div>

      <AdminQuickNav />

      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Blog posts are locked. You can't create new posts right now.
        </CardContent>
      </Card>
    </div>
  );
}

