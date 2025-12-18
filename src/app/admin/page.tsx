import { redirect } from "next/navigation";

import { getAdminSupabase } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-service";
import { Card, CardContent } from "@/components/ui/card";
import { AdminQuickNav } from "@/components/admin/admin-quick-nav";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function getStatusDotClass(status: string) {
  switch (status) {
    case "delivered":
      return "bg-emerald-500";
    case "processing":
      return "bg-amber-400";
    case "paid":
      return "bg-sky-500";
    case "shipped":
      return "bg-indigo-500";
    case "cancelled":
      return "bg-red-500";
    case "pending":
    default:
      return "bg-zinc-400";
  }
}

type DateRangeKey = "all" | "last7" | "last30" | "thisMonth" | "thisYear";

type AdminPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getFromIsoForRange(range: DateRangeKey): string | null {
  const now = new Date();

  switch (range) {
    case "last7": {
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      return from.toISOString();
    }
    case "last30": {
      const from = new Date(now);
      from.setDate(from.getDate() - 30);
      return from.toISOString();
    }
    case "thisMonth": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return from.toISOString();
    }
    case "thisYear": {
      const from = new Date(now.getFullYear(), 0, 1);
      return from.toISOString();
    }
    case "all":
    default:
      return null;
  }
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const resolvedSearchParams = await searchParams;

  const rawRange =
    typeof resolvedSearchParams.range === "string"
      ? resolvedSearchParams.range
      : "";

  const rangeKey: DateRangeKey =
    rawRange === "last7" ||
    rawRange === "last30" ||
    rawRange === "thisMonth" ||
    rawRange === "thisYear"
      ? rawRange
      : "all";

  const fromIso = getFromIsoForRange(rangeKey);

  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    redirect("/login?from=/admin");
  }

  const adminClient = createSupabaseAdminClient();

  let ordersQuery = supabase
    .from("orders")
    .select("id, total, status, created_at, email, shipping_address")
    .order("created_at", { ascending: false });

  if (fromIso) {
    ordersQuery = ordersQuery.gte("created_at", fromIso);
  }

  let customersQuery = adminClient
    .from("user_profiles")
    .select("id")
    .eq("role", "customer");

  if (fromIso) {
    customersQuery = customersQuery.gte("created_at", fromIso);
  }

  const [
    { data: orders },
    { data: customers },
    { data: orderItems },
    { data: products },
  ] = await Promise.all([
    ordersQuery,
    customersQuery,
    supabase
      .from("order_items")
      .select("order_id, product_id, quantity, subtotal"),
    supabase.from("products").select("id, name, stock, slug"),
  ]);

  const ordersCount = orders?.length ?? 0;
  const customersCount = customers?.length ?? 0;

  const totalSales = (orders ?? []).reduce(
    (sum, order) => (order.status === "cancelled" ? sum : sum + order.total),
    0,
  );

  const recentOrders = (orders ?? []).slice(0, 5);

  const statusCounts: Record<string, number> = {};
  for (const order of orders ?? []) {
    const status = (order.status ?? "pending") as string;
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
  }

  const orderedStatuses = [
    "pending",
    "processing",
    "paid",
    "shipped",
    "delivered",
    "cancelled",
  ] as const;

  const ordersByStatus = orderedStatuses.map((status) => ({
    status,
    count: statusCounts[status] ?? 0,
  }));

  const now = new Date();
  const monthlyBuckets: { key: string; label: string; total: number }[] = [];

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const label = date.toLocaleDateString("en-EG", {
      month: "short",
      year: "2-digit",
    });
    monthlyBuckets.push({ key, label, total: 0 });
  }

  const bucketMap = new Map<string, { key: string; label: string; total: number }>();
  for (const bucket of monthlyBuckets) {
    bucketMap.set(bucket.key, bucket);
  }

  for (const order of orders ?? []) {
    if (!order.created_at) continue;
    if (order.status === "cancelled") continue;
    const createdAt = new Date(order.created_at as string);
    const key = `${createdAt.getFullYear()}-${createdAt.getMonth() + 1}`;
    const bucket = bucketMap.get(key);
    if (bucket) {
      bucket.total += order.total as number;
    }
  }

  const maxMonthlyTotal =
    monthlyBuckets.reduce(
      (max, bucket) => (bucket.total > max ? bucket.total : max),
      0,
    ) || 0;

  const monthlySales = monthlyBuckets.map((bucket) => ({
    ...bucket,
    percent:
      maxMonthlyTotal > 0
        ? Math.max(6, Math.round((bucket.total / maxMonthlyTotal) * 100))
        : 0,
  }));

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const activeOrderIds = new Set(
    (orders ?? [])
      .filter((order) => {
        if (!order.created_at) return false;
        const createdAt = new Date(order.created_at as string);
        return createdAt >= ninetyDaysAgo && order.status !== "cancelled";
      })
      .map((order) => order.id as string),
  );

  const productNameMap = new Map<string, string>();
  for (const product of products ?? []) {
    productNameMap.set(product.id as string, product.name as string);
  }

  type ProductAgg = {
    productId: string;
    name: string;
    quantity: number;
    revenue: number;
  };

  const productAggMap = new Map<string, ProductAgg>();

  for (const item of orderItems ?? []) {
    if (!activeOrderIds.has(item.order_id as string)) continue;

    const productId = item.product_id as string;
    const name = productNameMap.get(productId) ?? "Unknown product";
    const quantity = (item.quantity as number) ?? 0;
    const revenue = (item.subtotal as number) ?? 0;

    const existing = productAggMap.get(productId);
    if (existing) {
      existing.quantity += quantity;
      existing.revenue += revenue;
    } else {
      productAggMap.set(productId, {
        productId,
        name,
        quantity,
        revenue,
      });
    }
  }

  const topProducts = Array.from(productAggMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const LOW_STOCK_LIMIT = 10;

  const lowStockProducts = (products ?? [])
    .map((product) => {
      const typed = product as {
        id: string;
        name: string;
        stock?: number | null;
        slug?: string | null;
      };

      const stockValue =
        typeof typed.stock === "number" && Number.isFinite(typed.stock)
          ? typed.stock
          : 0;

      return {
        id: typed.id,
        name: typed.name,
        stock: stockValue,
        slug: typed.slug ?? null,
      };
    })
    .filter((product) => product.stock <= LOW_STOCK_LIMIT)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 3);

  const exportRangeParam =
    rangeKey === "all" ? "" : `?range=${encodeURIComponent(rangeKey)}`;
  const ordersExportHref = `/api/admin/export/orders${exportRangeParam}`;
  const productsExportHref = `/api/admin/export/products${exportRangeParam}`;
  const customersExportHref = `/api/admin/export/customers${exportRangeParam}`;

  return (
    <div className="space-y-8 pb-12 pt-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Admin dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Overview of RimalTold store performance.
        </p>
      </div>

      <AdminQuickNav />

      <form
        method="get"
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs"
      >
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-[11px] font-medium text-muted-foreground">
            Date range
          </label>
          <select
            name="range"
            defaultValue={rangeKey === "all" ? "" : rangeKey}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All time</option>
            <option value="last7">Last 7 days</option>
            <option value="last30">Last 30 days</option>
            <option value="thisMonth">This month</option>
            <option value="thisYear">This year</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="inline-flex h-8 items-center rounded-md bg-foreground px-3 text-xs font-medium text-background hover:bg-foreground/90"
          >
            Apply
          </button>
          {rangeKey !== "all" && (
            <a
              href="/admin"
              className="text-[11px] font-medium text-muted-foreground hover:underline"
            >
              Clear
            </a>
          )}
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="space-y-1 p-4">
            <p className="text-xs text-muted-foreground">Total sales</p>
            <p className="text-lg font-semibold">{formatPrice(totalSales)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-4">
            <p className="text-xs text-muted-foreground">Orders</p>
            <p className="text-lg font-semibold">{ordersCount}</p>
          </CardContent>
        </Card>
        <Card>
          <a
            href="/admin/customers"
            className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <CardContent className="space-y-1 p-4">
              <p className="text-xs text-muted-foreground">Customers</p>
              <p className="text-lg font-semibold">{customersCount}</p>
              <p className="text-[11px] text-muted-foreground">
                View all customers
              </p>
            </CardContent>
          </a>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium tracking-tight">
                Sales (last 6 months)
              </h2>
              <span className="text-[11px] text-muted-foreground">
                Non-cancelled orders
              </span>
            </div>
            {monthlySales.every((month) => month.total === 0) ? (
              <p className="text-xs text-muted-foreground">No sales yet.</p>
            ) : (
              <div className="space-y-1.5">
                {monthlySales.map((month) => (
                  <div
                    key={month.key}
                    className="flex items-center gap-3 text-[11px]"
                  >
                    <div className="w-16 text-muted-foreground">
                      {month.label}
                    </div>
                    <div className="flex-1 rounded-full bg-muted/60">
                      <div
                        className="h-2 rounded-full bg-foreground/80"
                        style={{ width: `${month.percent}%` }}
                      />
                    </div>
                    <div className="w-24 text-right font-medium tabular-nums">
                      {formatPrice(month.total)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium tracking-tight">
                Orders by status
              </h2>
              <span className="text-[11px] text-muted-foreground">
                Total {ordersCount}
              </span>
            </div>
            {ordersCount === 0 ? (
              <p className="text-xs text-muted-foreground">No orders yet.</p>
            ) : (
              <div className="space-y-1.5 text-xs">
                {ordersByStatus.map(({ status, count }) => (
                  <div
                    key={status}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${getStatusDotClass(
                          status,
                        )}`}
                        aria-hidden="true"
                      />
                      <span className="capitalize">{status}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="tabular-nums">{count}</span>
                      <span>
                        (
                        {ordersCount > 0
                          ? Math.round((count / ordersCount) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium tracking-tight">
              Top products (last 90 days)
            </h2>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No product sales yet.
            </p>
          ) : (
            <div className="space-y-1.5 text-xs">
              <div className="hidden gap-3 pb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:grid sm:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
                <span>Product</span>
                <span className="text-right">Units sold</span>
                <span className="text-right">Revenue</span>
              </div>
              {topProducts.map((product) => (
                <div
                  key={product.productId}
                  className="grid grid-cols-1 items-start gap-2 py-1.5 sm:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.2fr)] sm:items-center"
                >
                  <span className="truncate">{product.name}</span>
                  <span className="text-right tabular-nums">
                    {product.quantity}
                  </span>
                  <span className="text-right font-medium tabular-nums">
                    {formatPrice(product.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium tracking-tight">Recent orders</h2>
            <a
              href="/admin/orders"
              className="text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              View all
            </a>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No orders yet.
            </p>
          ) : (
            <div className="divide-y text-xs">
              <div className="hidden gap-3 pb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:grid sm:grid-cols-[1.6fr_1fr_1fr_1.1fr]">
                <span>Order</span>
                <span>Date</span>
                <span>Status</span>
                <span className="text-right">Total</span>
              </div>
              {recentOrders.map((order) => {
                const createdAtDateTime = order.created_at
                  ? new Date(order.created_at as string)
                  : null;
                const createdAtDate = createdAtDateTime
                  ? createdAtDateTime.toLocaleDateString()
                  : "";
                const createdAtTime = createdAtDateTime
                  ? createdAtDateTime.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";

                const shipping = (order.shipping_address ?? null) as
                  | {
                      fullName?: string;
                    }
                  | null;
                const customerName = shipping?.fullName ?? "";

                return (
                  <a
                    key={order.id}
                    href={`/order/${order.id}`}
                    className="grid grid-cols-1 items-start gap-2 py-2 hover:bg-muted/60 sm:grid-cols-[1.8fr_1fr_1fr_1.1fr] sm:items-center"
                  >
                    <span className="space-y-0.5">
                      <span className="block font-mono text-[11px] text-muted-foreground">
                        {order.id}
                      </span>
                      {customerName && (
                        <span className="block text-[11px] text-foreground">
                          {customerName}
                        </span>
                      )}
                    </span>
                    <span className="space-y-0.5">
                      <span>{createdAtDate}</span>
                      {createdAtTime && (
                        <span className="block text-[11px] text-muted-foreground">
                          {createdAtTime}
                        </span>
                      )}
                    </span>
                    <span className="inline-flex items-center gap-2 capitalize">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${getStatusDotClass(order.status)}`}
                        aria-hidden="true"
                      />
                      {order.status}
                    </span>
                    <span className="text-right font-medium">
                      {formatPrice(order.total)}
                    </span>
                  </a>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs">
          <div className="space-y-0.5">
            <p className="text-sm font-medium tracking-tight">Export data</p>
            <p className="text-[11px] text-muted-foreground">
              Downloads CSV files for the selected date range (openable in Excel).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={ordersExportHref}
              className="inline-flex h-8 items-center rounded-full border border-border px-3 text-[11px] font-medium hover:bg-muted hover:text-foreground"
            >
              Orders CSV
            </a>
            <a
              href={productsExportHref}
              className="inline-flex h-8 items-center rounded-full border border-border px-3 text-[11px] font-medium hover:bg-muted hover:text-foreground"
            >
              Products CSV
            </a>
            <a
              href={customersExportHref}
              className="inline-flex h-8 items-center rounded-full border border-border px-3 text-[11px] font-medium hover:bg-muted hover:text-foreground"
            >
              Customers CSV
            </a>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-200/70 bg-amber-50/60 dark:border-amber-500/40 dark:bg-amber-500/5">
        <CardContent className="space-y-3 p-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h2 className="text-sm font-medium tracking-tight text-amber-800 dark:text-amber-200">
                Low stock alerts
              </h2>
              <p className="text-[11px] text-amber-700/90 dark:text-amber-200/80">
                Top products that are close to running out (≤ {LOW_STOCK_LIMIT} units).
              </p>
            </div>
            <a
              href="/admin/products"
              className="inline-flex h-7 items-center rounded-full border border-amber-300 bg-amber-100/60 px-3 text-[11px] font-medium text-amber-900 hover:bg-amber-200/70 dark:border-amber-400/60 dark:bg-transparent dark:text-amber-100 dark:hover:bg-amber-500/20"
            >
              View more
            </a>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">
              All products currently have healthy stock levels.
            </p>
          ) : (
            <div className="space-y-1.5 text-xs">
              <div className="hidden gap-3 pb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-amber-800/90 dark:text-amber-100/90 sm:grid sm:grid-cols-[minmax(0,2.2fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.3fr)]">
                <span>Product</span>
                <span className="text-right">Stock</span>
                <span className="text-right">Status</span>
                <span className="text-right">Actions</span>
              </div>
              {lowStockProducts.map((product) => {
                const level =
                  product.stock === 0
                    ? "critical"
                    : product.stock <= 3
                      ? "high"
                      : "medium";

                const dotClass =
                  level === "critical"
                    ? "bg-red-600"
                    : level === "high"
                      ? "bg-amber-500"
                      : "bg-emerald-500";

                const label =
                  level === "critical"
                    ? "Out of stock"
                    : level === "high"
                      ? `Very low (${product.stock} left)`
                      : `Low (${product.stock} left)`;

                const productHref = product.slug
                  ? `/products/${product.slug}`
                  : undefined;

                const editHref = `/admin/products/${product.id}`;

                return (
                  <div
                    key={product.id}
                    className="grid grid-cols-1 items-start gap-2 rounded-md bg-amber-100/70 px-2 py-1.5 text-amber-900 dark:bg-amber-500/10 dark:text-amber-50 sm:grid-cols-[minmax(0,2.2fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.3fr)] sm:items-center"
                  >
                    <span className="truncate">
                      {productHref ? (
                        <a
                          href={productHref}
                          className="underline-offset-4 hover:underline"
                        >
                          {product.name}
                        </a>
                      ) : (
                        product.name
                      )}
                    </span>
                    <span className="text-right tabular-nums font-semibold">
                      {product.stock}
                    </span>
                    <span className="flex items-center justify-end gap-2 text-[11px]">
                      <span
                        className={`h-2 w-2 rounded-full ${dotClass}`}
                        aria-hidden="true"
                      />
                      <span>{label}</span>
                    </span>
                    <span className="flex justify-end">
                      <a
                        href={editHref}
                        className="inline-flex h-7 items-center rounded-full border border-amber-300 bg-white/60 px-3 text-[11px] font-medium text-amber-900 hover:bg-amber-100 dark:border-amber-400/70 dark:bg-transparent dark:text-amber-50 dark:hover:bg-amber-500/30"
                      >
                        Edit stock
                      </a>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
