import { redirect } from "next/navigation";

import { getAdminSupabase } from "@/lib/admin";
import { Card, CardContent } from "@/components/ui/card";
import { AdminQuickNav } from "@/components/admin/admin-quick-nav";
import { BlogForm } from "@/components/admin/blog-form";

export default async function AdminNewBlogPage() {
  const { isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    redirect("/login?from=/admin/blogs/new");
  }

  return (
    <div className="space-y-6 pb-12 pt-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          New blog post
        </h1>
        <p className="text-sm text-muted-foreground">
          Create a new story for the "Told By Rimal" blog.
        </p>
      </div>

      <AdminQuickNav />

      <Card>
        <CardContent className="p-6">
          <BlogForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}

