import { NextResponse } from "next/server";

import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  sendOrderConfirmationEmail,
  sendNewOrderNotificationEmail,
} from "@/lib/email";
import { sendNewOrderTelegramNotification } from "@/lib/telegram";
import { formatOrderId } from "@/lib/utils";

const checkoutSchema = z.object({
  email: z.string().email(),
  shippingAddress: z.object({
    fullName: z.string().min(1),
    phone: z.string().min(1),
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().optional(),
    country: z.string().min(1),
    height: z.string().optional(),
  }),
  shippingCityId: z.string().uuid().optional(),
  couponCode: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
        size: z.string().min(1).optional().nullable(),
        color: z.string().min(1).optional().nullable(),
      }),
    )
    .min(1),
});

export async function POST(request: Request) {
  const body = await request.json();

  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid checkout payload" },
      { status: 400 },
    );
  }

  const { email, shippingAddress, items, couponCode, shippingCityId } =
    parsed.data;

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const productIds = [...new Set(items.map((item) => item.productId))];

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, price, sale_price, stock")
    .in("id", productIds);

  if (productsError) {
    return NextResponse.json(
      { error: "Could not fetch products" },
      { status: 500 },
    );
  }

  const productMap = new Map<
    string,
    { id: string; name: string; price: number; salePrice: number | null; stock: number }
  >();

  for (const product of products ?? []) {
    productMap.set(product.id, {
      id: product.id,
      name: product.name,
      price: product.price,
      salePrice: (product as { sale_price?: number | null }).sale_price ?? null,
      stock: product.stock ?? 0,
    });
  }

  const orderItems: {
    order_id: string;
    product_id: string;
    name: string;
    size: string | null;
    color: string | null;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }[] = [];

  let total = 0;

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      return NextResponse.json(
        { error: "One of the products no longer exists" },
        { status: 400 },
      );
    }

    if (product.stock < item.quantity) {
      return NextResponse.json(
        { error: `Not enough stock for ${product.name}` },
        { status: 400 },
      );
    }

    const effectivePrice =
      product.salePrice != null && product.salePrice >= 0
        ? product.salePrice
        : product.price;

    const subtotal = effectivePrice * item.quantity;
    total += subtotal;
  }

  let discountCents = 0;

  const normalizedCoupon = couponCode?.trim() || "";
  if (normalizedCoupon) {
    const upper = normalizedCoupon.toUpperCase();

    const { data: coupon } = await supabase
      .from("coupons")
      .select("code, discount_percent, min_order_total_cents, active")
      .eq("code", upper)
      .maybeSingle();

    if (!coupon || !(coupon.active as boolean)) {
      return NextResponse.json(
        { error: "Invalid or inactive coupon code." },
        { status: 400 },
      );
    }

    const minTotal =
      (coupon.min_order_total_cents as number | null) != null
        ? (coupon.min_order_total_cents as number)
        : 0;

    if (total < minTotal) {
      return NextResponse.json(
        { error: "Order total does not meet the minimum for this coupon." },
        { status: 400 },
      );
    }

    const percent = (coupon.discount_percent as number) ?? 0;
    if (percent <= 0 || percent > 100) {
      return NextResponse.json(
        { error: "Coupon configuration is invalid." },
        { status: 500 },
      );
    }

    discountCents = Math.floor((total * percent) / 100);
    if (discountCents < 0) discountCents = 0;
    if (discountCents > total) discountCents = total;
  }

  let shippingFeeCents = 0;

  if (shippingCityId) {
    const { data: shippingCity, error: shippingCityError } = await supabase
      .from("shipping_cities")
      .select("id, name, fee_cents, active")
      .eq("id", shippingCityId)
      .maybeSingle();

    if (shippingCityError) {
      return NextResponse.json(
        { error: "Could not load shipping city." },
        { status: 500 },
      );
    }

    if (!shippingCity || !(shippingCity.active as boolean)) {
      return NextResponse.json(
        { error: "Selected shipping city is not available." },
        { status: 400 },
      );
    }

    shippingFeeCents = (shippingCity.fee_cents as number | null) ?? 0;
  } else {
    // Fallback to flat shipping fee from site settings (default 0 if not configured)
    const { data: settingsRow } = await supabase
      .from("site_settings")
      .select("shipping_flat_fee_cents")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    shippingFeeCents =
      (settingsRow?.shipping_flat_fee_cents as number | null) ?? 0;
  }

  const orderTotal = total - discountCents + shippingFeeCents;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user?.id ?? null,
      email,
      total: orderTotal,
      status: "pending",
      shipping_address: shippingAddress,
      stripe_payment_intent_id: null,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: "Could not create order" },
      { status: 500 },
    );
  }

  for (const item of items) {
    const product = productMap.get(item.productId)!;
    const effectivePrice =
      product.salePrice != null && product.salePrice >= 0
        ? product.salePrice
        : product.price;
    const subtotal = effectivePrice * item.quantity;

    orderItems.push({
      order_id: order.id,
      product_id: product.id,
      name: product.name,
      size: item.size ?? null,
      color: item.color ?? null,
      quantity: item.quantity,
      unit_price: effectivePrice,
      subtotal,
    });
  }

  const { error: orderItemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (orderItemsError) {
    return NextResponse.json(
      { error: "Could not create order items" },
      { status: 500 },
    );
  }

  for (const item of items) {
    const product = productMap.get(item.productId)!;
    const newStock = Math.max(product.stock - item.quantity, 0);

    await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("id", product.id);
  }

  try {
    const prettyOrderId = formatOrderId(order.id);
    const emailItems = orderItems.map((item) => ({
      name: item.name,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      subtotal: item.subtotal,
    }));

    const emailItemsWithShipping =
      shippingFeeCents > 0
        ? [
            ...emailItems,
            {
              name: "Shipping",
              size: null,
              color: null,
              quantity: 1,
              unitPrice: shippingFeeCents,
              subtotal: shippingFeeCents,
            },
          ]
        : emailItems;

    // Customer confirmation
    await sendOrderConfirmationEmail({
      to: email,
      orderId: prettyOrderId,
      total: orderTotal,
      items: emailItemsWithShipping,
    });

    // Admin notification (uses ORDER_NOTIFICATIONS_EMAIL if set, otherwise EMAIL_FROM)
    const adminEmail =
      process.env.ORDER_NOTIFICATIONS_EMAIL ?? process.env.EMAIL_FROM ?? null;

    if (adminEmail) {
      await sendNewOrderNotificationEmail({
        to: adminEmail,
        orderId: prettyOrderId,
        total: orderTotal,
        items: emailItemsWithShipping,
        customerEmail: email,
        customerName: shippingAddress.fullName,
        customerPhone: shippingAddress.phone,
        customerHeight:
          typeof (shippingAddress as { height?: unknown }).height === "string"
            ? ((shippingAddress as { height?: string }).height ?? null)
            : null,
      });
    }

    await sendNewOrderTelegramNotification({
      orderId: prettyOrderId,
      total: orderTotal,
      items: emailItemsWithShipping,
      customerEmail: email,
      customerName: shippingAddress.fullName,
      customerPhone: shippingAddress.phone,
      shippingAddress: {
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2 ?? null,
        city: shippingAddress.city,
        state: shippingAddress.state ?? null,
        country: shippingAddress.country,
        height:
          typeof (shippingAddress as { height?: unknown }).height === "string"
            ? ((shippingAddress as { height?: string }).height ?? null)
            : null,
      },
    });
  } catch {
  }

  return NextResponse.json({ orderId: order.id }, { status: 200 });
}
