// frontend/lib/utils.ts  ← paste this entire file
import { type ClassValue } from "react";

export function cn(...inputs: ClassValue[]) {
  return inputs
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

// Keep all your existing helpers
export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
};

// Add more of your old helpers here if you want... this is the format to keep all existing helpers
