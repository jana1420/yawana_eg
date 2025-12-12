import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { Card, CardContent } from "@/components/ui/card";
import { SignOutButton } from "@/components/account/sign-out-button";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-4 pb-12 pt-8">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Account
        </h1>
        <Card>
          <CardContent className="space-y-3 p-6 text-sm text-muted-foreground">
            <p>You&apos;re not signed in.</p>
            <p>Please sign in or create an account to view your orders.</p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <Link
                href="/login?from=/account"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
              <span className="text-muted-foreground">or</span>
              <Link
                href="/register"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Create account
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const displayName = (profile?.full_name ?? "").trim() || user.email || "";

  const { data: orders } = await supabase
    .from("orders")
    .select("id, total, status, created_at, user_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 pb-12 pt-8">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Account
          </h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {displayName}.
          </p>
        </div>
        <SignOutButton />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium tracking-tight">Orders</h2>
        {!orders || orders.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              You haven&apos;t placed any orders yet.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0 text-sm">
              <div className="grid grid-cols-[1.4fr_1fr_1fr_1.2fr] gap-3 border-b px-4 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <span>Order</span>
                <span>Date</span>
                <span>Status</span>
                <span className="text-right">Total</span>
              </div>
              <div className="divide-y">
                {orders.map((order) => {
                  const createdAt = order.created_at
                    ? new Date(order.created_at as string).toLocaleDateString()
                    : "";

                  return (
                    <a
                      key={order.id}
                      href={`/order/${order.id}`}
                      className="grid grid-cols-[1.4fr_1fr_1fr_1.2fr] items-center gap-3 px-4 py-3 text-xs hover:bg-muted/60"
                    >
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {order.id}
                      </span>
                      <span>{createdAt}</span>
                      <span className="capitalize">{order.status}</span>
                      <span className="text-right font-medium">
                        {formatPrice(order.total)}
                      </span>
                    </a>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
