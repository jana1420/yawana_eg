import { redirect } from "next/navigation";

import { getAdminSupabase } from "@/lib/admin";
import { Card, CardContent } from "@/components/ui/card";
import { AdminOrderRow } from "@/components/admin/admin-order-row";
import { AdminQuickNav } from "@/components/admin/admin-quick-nav";

type AdminOrdersPageSearchParams = {
  status?: string;
  q?: string;
  page?: string;
};

type AdminOrdersPageProps = {
  searchParams: Promise<AdminOrdersPageSearchParams>;
};

const PAGE_SIZE = 10;

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const resolvedSearchParams = await searchParams;

  const rawStatus =
    typeof resolvedSearchParams.status === "string"
      ? resolvedSearchParams.status
      : "";
  const statusFilter =
    rawStatus && rawStatus !== "all" ? rawStatus.toLowerCase() : "all";

  const searchQuery =
    typeof resolvedSearchParams.q === "string" &&
    resolvedSearchParams.q.trim().length > 0
      ? resolvedSearchParams.q.trim()
      : "";

  const rawPage =
    typeof resolvedSearchParams.page === "string"
      ? resolvedSearchParams.page
      : "";
  let page = Number.parseInt(rawPage, 10);
  if (!Number.isFinite(page) || page < 1) {
    page = 1;
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    redirect("/login?from=/admin/orders");
  }

  let query = supabase
    .from("orders")
    .select(
      "id, email, total, status, created_at, shipping_address, order_items(name, size, products(slug))",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  if (searchQuery) {
    const sanitized = searchQuery.replace(/[*,]/g, "");
    const pattern = `*${sanitized}*`;
    query = query.or(
      `email.ilike.${pattern},shipping_address->>phone.ilike.${pattern}`,
    );
  }

  const { data: orders, count } = await query.range(from, to);

  const totalCount = count ?? 0;
  const totalPages =
    totalCount > 0 ? Math.ceil(totalCount / PAGE_SIZE) : 1;

  const hasPreviousPage = page > 1;
  const hasNextPage = totalCount > 0 && page < totalPages;

  const baseSearchParams = new URLSearchParams();
  if (statusFilter !== "all") {
    baseSearchParams.set("status", statusFilter);
  }
  if (searchQuery) {
    baseSearchParams.set("q", searchQuery);
  }

  const previousParams = new URLSearchParams(baseSearchParams);
  if (hasPreviousPage && page - 1 > 1) {
    previousParams.set("page", String(page - 1));
  } else {
    previousParams.delete("page");
  }
  const previousHref =
    hasPreviousPage && previousParams.toString()
      ? `/admin/orders?${previousParams.toString()}`
      : "/admin/orders";

  const nextParams = new URLSearchParams(baseSearchParams);
  if (hasNextPage) {
    nextParams.set("page", String(page + 1));
  }
  const nextHref =
    hasNextPage && nextParams.toString()
      ? `/admin/orders?${nextParams.toString()}`
      : "/admin/orders";

  return (
    <div className="space-y-6 pb-12 pt-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Orders
        </h1>
        <p className="text-sm text-muted-foreground">
          View and update order status.
        </p>
      </div>
      <AdminQuickNav />
      <form
        method="get"
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs"
      >
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-[11px] font-medium text-muted-foreground">
            Status
          </label>
          <select
            name="status"
            defaultValue={statusFilter === "all" ? "" : statusFilter}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="paid">Paid</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <label className="ml-3 text-[11px] font-medium text-muted-foreground">
            Search
          </label>
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="Email or phone number"
            className="h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="inline-flex h-8 items-center rounded-md bg-foreground px-3 text-xs font-medium text-background hover:bg-foreground/90"
          >
            Apply
          </button>
          {(statusFilter !== "all" || searchQuery) && (
            <a
              href="/admin/orders"
              className="text-[11px] font-medium text-muted-foreground hover:underline"
            >
              Clear
            </a>
          )}
        </div>
      </form>
      <Card>
        <CardContent className="p-0 text-sm">
          {!orders || orders.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              No orders yet.
            </div>
          ) : (
            <>
              <div className="divide-y">
                <div className="hidden border-b px-4 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:grid sm:grid-cols-[1.6fr_1.4fr_1.2fr_1.1fr] sm:gap-3">
                  <span>Order</span>
                  <span>Customer</span>
                  <span>Status</span>
                  <span className="text-right">Total</span>
                </div>
                {orders.map((order) => (
                  <AdminOrderRow key={order.id} order={order} />
                ))}
              </div>
              {totalCount > 0 && (
                <div className="flex items-center justify-between border-t px-4 py-3 text-[11px] text-muted-foreground">
                  <span>
                    Showing {from + 1}–
                    {Math.min(from + orders.length, totalCount)} of {totalCount} orders
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href={hasPreviousPage ? previousHref : "#"}
                      className={`inline-flex h-7 items-center rounded-full border border-border px-3 text-[11px] font-medium ${
                        hasPreviousPage
                          ? "hover:bg-muted hover:text-foreground"
                          : "cursor-not-allowed opacity-50"
                      }`}
                      aria-disabled={!hasPreviousPage}
                    >
                      Previous
                    </a>
                    <span className="text-[11px]">
                      Page {page} of {totalPages}
                    </span>
                    <a
                      href={hasNextPage ? nextHref : "#"}
                      className={`inline-flex h-7 items-center rounded-full border border-border px-3 text-[11px] font-medium ${
                        hasNextPage
                          ? "hover:bg-muted hover:text-foreground"
                          : "cursor-not-allowed opacity-50"
                      }`}
                      aria-disabled={!hasNextPage}
                    >
                      Next
                    </a>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
