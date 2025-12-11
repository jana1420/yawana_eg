import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatOrderId(id: string): string {
  const compact = id.replace(/-/g, "");
  const tail = compact.slice(-8) || compact;
  return `LB-${tail.toUpperCase()}`;
}
