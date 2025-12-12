"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function CartPage() {
  const { cart, clear, updateQuantity, removeItem } = useCart();
  const router = useRouter();

  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const itemCount = cart.items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const hasItems = cart.items.length > 0;

  return (
    <div className="space-y-8 pb-12 pt-8">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Cart
        </h1>
        <p className="text-sm text-muted-foreground">
          Review your selected clothing before continuing to checkout.
        </p>
      </div>

      {!hasItems ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-4 p-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>Your cart is empty.</p>
            <Link
              href="/"
              className="text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              Continue shopping
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.productId}
                className="flex items-start justify-between gap-4 border-b pb-4 last:border-b-0"
              >
                <div className="flex flex-1 flex-col gap-1">
                  <p className="text-sm font-medium tracking-tight">
                    {item.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatPrice(item.price)} each</span>
                    <div className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1">
                      <button
                        type="button"
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-[11px] font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() =>
                          item.quantity > 1 &&
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="min-w-[1.5rem] text-center text-[11px] text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-[11px] font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        disabled={
                          typeof item.maxQuantity === "number" &&
                          item.maxQuantity > 0 &&
                          item.quantity >= item.maxQuantity
                        }
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="text-[11px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      onClick={() => removeItem(item.productId)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <p className="text-sm font-semibold">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span>{itemCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Cash on delivery. Shipping and taxes are calculated at delivery.
              </p>
              <div className="space-y-2 pt-2">
                <Button
                  type="button"
                  className="w-full text-sm"
                  onClick={() => router.push("/checkout")}
                >
                  Continue to checkout
                </Button>
                <button
                  type="button"
                  className="w-full text-xs text-muted-foreground underline-offset-4 hover:underline"
                  onClick={() => clear()}
                >
                  Clear cart
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
