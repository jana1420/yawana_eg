import type { Product } from "./types";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  size?: string | null;
  color?: string | null;
  // Optional upper bound for how many units can be in the cart (e.g. stock level)
  maxQuantity?: number | null;
  // Optional thumbnail image URL used in cart and checkout summaries
  imageUrl?: string | null;
};

export type Cart = {
  items: CartItem[];
};

const STORAGE_KEY = "luma-cart";

export function loadCart(): Cart {
  if (typeof window === "undefined") {
    return { items: [] };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw) as Cart;
    if (!parsed || !Array.isArray(parsed.items)) return { items: [] };
    return { items: parsed.items.filter((item) => item.quantity > 0) };
  } catch {
    return { items: [] };
  }
}

export function saveCart(cart: Cart) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

export function addProductToCart(
  cart: Cart,
  product: Product,
  quantity = 1,
  size?: string | null,
  color?: string | null,
  maxQuantity?: number | null,
): Cart {
  if (quantity <= 0) return cart;

  const sizeKey = size ?? null;
  const colorKey = color ?? null;

  const existing = cart.items.find(
    (item) =>
      item.productId === product.id &&
      (item.size ?? null) === sizeKey &&
      (item.color ?? null) === colorKey,
  );

  const limit =
    typeof maxQuantity === "number" && Number.isFinite(maxQuantity)
      ? Math.max(Math.floor(maxQuantity), 0)
      : existing?.maxQuantity ?? null;

  if (!existing) {
    const nextQuantity =
      limit !== null && limit >= 0 ? Math.min(quantity, limit) : quantity;
    if (nextQuantity <= 0) return cart;
    return {
      items: [
        ...cart.items,
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          quantity: nextQuantity,
          size: sizeKey,
          color: colorKey,
          maxQuantity: limit,
          imageUrl:
            Array.isArray(product.images) && product.images.length > 0
              ? product.images[0] ?? null
              : null,
        },
      ],
    };
  }

  const proposed = existing.quantity + quantity;
  const nextQuantity =
    limit !== null && limit >= 0 ? Math.min(proposed, limit) : proposed;

  if (nextQuantity <= 0) {
    return {
      items: cart.items.filter(
        (item) =>
          !(
            item.productId === product.id &&
            (item.size ?? null) === sizeKey &&
            (item.color ?? null) === colorKey
          ),
      ),
    };
  }

  return {
    items: cart.items.map((item) =>
      item.productId === product.id &&
      (item.size ?? null) === sizeKey &&
      (item.color ?? null) === colorKey
        ? { ...item, quantity: nextQuantity, maxQuantity: limit }
        : item,
    ),
  };
}

export function updateCartItemQuantity(
  cart: Cart,
  productId: string,
  quantity: number,
): Cart {
  // Remove item when quantity goes to zero or below
  if (quantity <= 0) {
    return {
      items: cart.items.filter((item) => item.productId !== productId),
    };
  }

  return {
    items: cart.items.map((item) => {
      if (item.productId !== productId) return item;

      const limit =
        typeof item.maxQuantity === "number" &&
        Number.isFinite(item.maxQuantity)
          ? Math.max(Math.floor(item.maxQuantity), 0)
          : null;

      const nextQuantity =
        limit !== null && limit >= 0 ? Math.min(quantity, limit) : quantity;

      if (nextQuantity <= 0) {
        return { ...item, quantity: 0 };
      }

      return { ...item, quantity: nextQuantity };
    }),
  };
}

export function clearCart(): Cart {
  return { items: [] };
}

export function getCartTotals(cart: Cart) {
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return {
    subtotal,
    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
  };
}
