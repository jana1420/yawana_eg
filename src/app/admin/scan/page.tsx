import { redirect } from "next/navigation";

import { getAdminSupabase } from "@/lib/admin";
import { Card, CardContent } from "@/components/ui/card";
import { AdminQuickNav } from "@/components/admin/admin-quick-nav";
import { AdminScanStock } from "@/components/admin/admin-scan-stock";

export default async function AdminScanPage() {
  const { isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    redirect("/login?from=/admin/scan");
  }

  return (
    <div className="space-y-6 pb-12 pt-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Scan &amp; update stock
        </h1>
        <p className="text-sm text-muted-foreground">
          Use your phone camera to scan product barcodes and keep online stock in
          sync with in-store sales.
        </p>
      </div>

      <AdminQuickNav />

      <Card>
        <CardContent className="p-4 text-xs sm:p-6">
          <AdminScanStock />
        </CardContent>
      </Card>
    </div>
  );
}
