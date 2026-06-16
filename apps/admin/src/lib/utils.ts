import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(cents: number) {
  const number = new Intl.NumberFormat("en-ZA", {
    maximumFractionDigits: 0,
  }).format(cents / 100);
  return `R${number.replace(/\s+/g, ",")}`;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
