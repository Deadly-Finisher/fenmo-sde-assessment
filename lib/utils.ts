import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// This helper merges Tailwind classes perfectly
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Financial Data Formatter
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

// Professional Date Formatter
export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}