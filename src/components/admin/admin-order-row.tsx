"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function formatOrderId(id: string) {
  if (id.length <= 8) return id;
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

type AdminOrderRowProps = {
  order: {
    id: string;
    email: string;
    total: number;
    status: string;
    created_at: string | null;
    shipping_address?: unknown;
  };
};

const statuses = [
  "pending",
  "processing",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
] as const;

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

export function AdminOrderRow({ order }: AdminOrderRowProps) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shipping = (order.shipping_address ?? null) as
    | {
        fullName?: string;
        phone?: string;
      }
    | null;
  const customerName = shipping?.fullName ?? "";
  const rawPhone = shipping?.phone ?? "";

  const rawItems = (order as unknown as {
    order_items?:
      | {
          name?: string;
          size?: string | null;
          products?: {
            slug?: string | null;
          } | null;
        }[]
      | null;
  }).order_items;

  let primaryItemName = "";
  let primaryItemSize: string | null = null;
  let primaryItemSlug = "";

  if (Array.isArray(rawItems) && rawItems.length > 0) {
    const first = rawItems[0];
    if (first) {
      if (typeof first.name === "string") {
        primaryItemName = first.name.trim();
      }
      if (typeof first.size === "string" && first.size.trim().length > 0) {
        primaryItemSize = first.size.trim();
      }
      const products = first.products as { slug?: string | null } | null;
      if (products && typeof products.slug === "string") {
        primaryItemSlug = products.slug;
      }
    }
  }

  const createdAt = order.created_at
    ? new Date(order.created_at).toLocaleDateString()
    : "";

  async function handleSave() {
    if (isSaving) return;
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Unable to update order.");
        setIsSaving(false);
        return;
      }

      router.refresh();
      setIsSaving(false);
    } catch {
      setError("Network error. Please try again.");
      setIsSaving(false);
    }
  }

  function getSanitizedPhoneForWhatsApp() {
    const digits = rawPhone.replace(/\D/g, "");
    if (!digits) return null;

    if (digits.startsWith("20")) {
      return digits;
    }

    if (digits.startsWith("0")) {
      return `2${digits}`;
    }

    if (digits.length >= 10) {
      return `20${digits}`;
    }

    return null;
  }

  function buildWhatsAppLink() {
    const phoneForWa = getSanitizedPhoneForWhatsApp();
    if (!phoneForWa) return null;

    const safeName = (customerName || "عميلنا").trim();
    const lowerStatus = String(status || order.status || "").toLowerCase();

    let englishLine = "Your order status has been updated.";
    let arabicLine = "تم تحديث حالة طلبك.";

    switch (lowerStatus) {
      case "processing":
        englishLine = `Your order *#${order.id}* is now *being processed*. We'll let you know once it ships.`;
        arabicLine = `طلبك رقم *#${order.id}* الآن في حالة: *قيد المعالجة*. هنبلغك أول ما يطلع للشحن.`;
        break;
      case "paid":
        englishLine = `Your payment for order *#${order.id}* has been *received*. Thank you!`;
        arabicLine = `تم استلام الدفع لطلبك رقم *#${order.id}*. شكرًا لك!`;
        break;
      case "shipped":
        englishLine = `Good news! Your order *#${order.id}* has been *shipped*.`;
        arabicLine = `خبر حلو! طلبك رقم *#${order.id}* تم *شحنه الآن*.`;
        break;
      case "delivered":
        englishLine = `Your order *#${order.id}* has been *delivered* 🎉 We hope you enjoy it! If you liked it, please rate us 5 stars.`;
        arabicLine = `طلبك رقم *#${order.id}* تم *تسليمه* 🎉 نتمنى يعجبك! لو عجبك المنتج قيّمنا بخمس نجوم.`;
        break;
      case "cancelled":
        englishLine = `Your order *#${order.id}* has been *cancelled*. If this was not expected, please contact us.`;
        arabicLine = `تم *إلغاء* طلبك رقم *#${order.id}*. لو الإلغاء غير متوقع، تواصل معنا من فضلك.`;
        break;
      default:
        englishLine = `Your order *#${order.id}* status is now: *${lowerStatus || "updated"}*.`;
        arabicLine = `حالة طلبك رقم *#${order.id}* الآن: *${lowerStatus || "محدَّثة"}*.`;
        break;
    }

    let productUrl = "";
    if (primaryItemSlug) {
      let origin = "https://zekryway.com";
      if (typeof window !== "undefined" && window.location?.origin) {
        origin = window.location.origin;
      }
      productUrl = `${origin}/products/${primaryItemSlug}`;
    }

    const lines: string[] = [
      `Hi ${safeName}, 👋`,
      englishLine,
      "",
      `أهلاً ${safeName} 👋`,
      arabicLine,
    ];

    if (primaryItemName) {
      const englishItemLine = primaryItemSize
        ? `- ${primaryItemName} (Size ${primaryItemSize})`
        : `- ${primaryItemName}`;
      lines.push("", "Order items:", englishItemLine);
      if (productUrl) {
        lines.push(`Link: ${productUrl}`);
      }
    }

    lines.push(
      "",
      "Customer support on WhatsApp: +201027741885",
      "خدمة عملاء LooseBrand على واتساب: +201027741885",
    );
    const msg = lines.join("\n");

    return `https://wa.me/${phoneForWa}?text=${encodeURIComponent(msg)}`;
  }

  function handleWhatsAppClick() {
    const link = buildWhatsAppLink();
    if (!link) return;
    if (typeof window !== "undefined") {
      window.open(link, "_blank", "noopener,noreferrer");
    }
  }

  const canSendWhatsApp =
    status !== "pending" && !!getSanitizedPhoneForWhatsApp();

  return (
    <div className="grid grid-cols-1 items-start gap-3 px-4 py-3 text-xs sm:grid-cols-[1.8fr_1.4fr_1.3fr_1.1fr] sm:items-center">
      <div className="space-y-0.5">
        <a
          href={`/order/${order.id}`}
          className="font-mono text-[11px] text-primary underline-offset-4 hover:underline"
        >
          {formatOrderId(order.id)}
        </a>
        {customerName && (
          <p className="text-[11px] text-foreground">{customerName}</p>
        )}
        <p className="text-[11px] text-muted-foreground">{createdAt}</p>
      </div>
      <div className="space-y-0.5">
        <p className="text-xs break-all sm:break-normal">{order.email}</p>
      </div>
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          <span
            className={`h-2 w-2 rounded-full ${getStatusDotClass(status)}`}
            aria-hidden="true"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-8 min-w-[120px] rounded-md border border-input bg-background px-2 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {statuses.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            className="text-xs"
            disabled={isSaving}
            onClick={handleSave}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
        {canSendWhatsApp && (
          <div className="flex flex-wrap items-center gap-2 pt-1 sm:flex-nowrap sm:pl-4">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2 text-[11px]"
              onClick={handleWhatsAppClick}
            >
              Send WhatsApp update
            </Button>
          </div>
        )}
      </div>
      <div className="text-right font-medium">
        {formatPrice(order.total)}
      </div>
      {error && (
        <div className="pt-1 text-[11px] text-red-500 sm:col-span-4">{error}</div>
      )}
    </div>
  );
}
