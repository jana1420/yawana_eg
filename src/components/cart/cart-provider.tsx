"use client";

import * as React from "react";

import type { Product } from "@/lib/types";
import {
  addProductToCart,
  clearCart,
  getCartTotals,
  loadCart,
  saveCart,
  updateCartItemQuantity,
  type Cart,
} from "@/lib/cart";

export type CartContextValue = {
  cart: Cart;
  addToCart: (
    product: Product,
    quantity?: number,
    size?: string | null,
    color?: string | null,
    maxQuantity?: number | null,
  ) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

const CartContext = React.createContext<CartContextValue | undefined>(
  undefined,
);

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cart, setCart] = React.useState<Cart>({ items: [] });

  React.useEffect(() => {
    setCart(loadCart());
  }, []);

  React.useEffect(() => {
    saveCart(cart);
  }, [cart]);

  const addToCart = React.useCallback(
    (
      product: Product,
      quantity = 1,
      size?: string | null,
      color?: string | null,
      maxQuantity?: number | null,
    ) => {
      setCart((current) =>
        addProductToCart(current, product, quantity, size, color, maxQuantity),
      );
    },
    [],
  );

  const updateQuantity = React.useCallback(
    (productId: string, quantity: number) => {
      setCart((current) =>
        updateCartItemQuantity(current, productId, quantity),
      );
    },
    [],
  );

  const removeItem = React.useCallback((productId: string) => {
    setCart((current) => updateCartItemQuantity(current, productId, 0));
  }, []);

  const clear = React.useCallback(() => {
    setCart({ items: [] });
  }, []);

  const value = React.useMemo(
    () => ({ cart, addToCart, updateQuantity, removeItem, clear }),
    [cart, addToCart, updateQuantity, removeItem, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
