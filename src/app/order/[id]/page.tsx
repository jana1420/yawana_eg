import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatOrderId } from "@/lib/utils";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
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

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function OrderPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, email, total, status, shipping_address, created_at, order_items (product_id, name, size, color, quantity, unit_price, subtotal, products (images))",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return (
      <div className="space-y-4 pb-12 pt-8">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Order details
        </h1>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find this order, or you don&apos;t have permission to view
          it.
        </p>
        <p className="text-xs text-muted-foreground">
          {user
            ? "Make sure you are viewing an order that belongs to this account."
            : "You may need to sign in to view your orders."}
        </p>
        {error && (
          <p className="text-[11px] text-red-500">
            Debug info (temporary): {error.message}
          </p>
        )}
        {!user && (
          <Link
            href={`/login?from=/order/${id}`}
            className="text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in to view your orders
          </Link>
        )}
      </div>
    );
  }

  const createdAt = data.created_at
    ? new Date(data.created_at).toLocaleString()
    : "";

  const shipping = data.shipping_address as {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    country?: string;
  };

  const items = (data.order_items ?? []).map((item) => {
    const typed = item as {
      name: string;
      size?: string | null;
      color?: string | null;
      quantity: number;
      unit_price: number;
      subtotal: number;
      products?: {
        images?: string[] | null;
      } | null;
    };

    const productImages = Array.isArray(typed.products?.images)
      ? (typed.products?.images as string[])
      : [];

    return {
      name: typed.name,
      size: typed.size ?? null,
      color: typed.color ?? null,
      quantity: typed.quantity,
      unit_price: typed.unit_price,
      subtotal: typed.subtotal,
      imageUrl: productImages[0] ?? null,
    };
  }) as {
    name: string;
    size: string | null;
    color: string | null;
    quantity: number;
    unit_price: number;
    subtotal: number;
    imageUrl: string | null;
  }[];

  return (
    <div className="space-y-8 pb-12 pt-8">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Order confirmed
        </h1>
        <p className="text-sm text-muted-foreground">
          Thank you for ordering from LooseBrand. We&apos;ll send a confirmation email
          shortly.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-4 text-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Order ID</p>
            <p className="font-mono text-xs">{formatOrderId(data.id)}</p>
            {shipping.fullName && (
              <p className="text-xs text-muted-foreground">{shipping.fullName}</p>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="inline-flex items-center gap-2 text-xs capitalize">
              <span
                className={`h-1.5 w-1.5 rounded-full ${getStatusDotClass(data.status)}`}
                aria-hidden="true"
              />
              {data.status}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Placed on</p>
            <p>{createdAt}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Contact</p>
            <p>{data.email}</p>
            {shipping.phone && <p>{shipping.phone}</p>}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Payment method</p>
            <p>Cash on delivery</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Shipping address</p>
            <p>
              {shipping.fullName && <span>{shipping.fullName}</span>}
              {shipping.fullName && <br />}
              {shipping.addressLine1 && <span>{shipping.addressLine1}</span>}
              {shipping.addressLine1 && <br />}
              {shipping.addressLine2 && (
                <>
                  <span>{shipping.addressLine2}</span>
                  <br />
                </>
              )}
              {(shipping.city || shipping.state) && (
                <span>
                  {shipping.city}
                  {shipping.state ? `, ${shipping.state}` : ""}
                </span>
              )}
              {(shipping.city || shipping.state) && <br />}
              {shipping.country && <span>{shipping.country}</span>}
            </p>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Items</p>
            <div className="space-y-2 rounded-xl border bg-card p-4">
              {items.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="flex items-start gap-3"
                >
                  {item.imageUrl ? (
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-12 flex-shrink-0 rounded-md bg-muted" />
                  )}
                  <div className="flex flex-1 items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium tracking-tight">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {(() => {
                          const parts = [
                            item.size ? `Size ${item.size}` : null,
                            item.color ? `Color ${item.color}` : null,
                          ].filter(Boolean);
                          if (parts.length === 0) return null;
                          return <>{parts.join(" · ")} · </>;
                        })()}
                        {formatPrice(item.unit_price)} each · Qty {item.quantity}
                      </p>
                    </div>
                    <p className="text-xs font-semibold">
                      {formatPrice(item.subtotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-1 rounded-xl border bg-card p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">{formatPrice(data.total)}</span>
            </div>
            <p className="pt-1 text-[11px] text-muted-foreground">
              You&apos;ll pay in cash when your order is delivered.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
