import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns"
import { id as localeId } from "date-fns/locale"
import type { OrderStatus } from "@/lib/api/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "d MMMM yyyy", { locale: localeId })
}

export function formatDateTime(dateStr: string): string {
  return format(parseISO(dateStr), "d MMM yyyy, HH:mm", { locale: localeId })
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Menunggu Konfirmasi",
  confirmed: "Dijadwalkan",
  in_progress: "Sedang Dikerjakan",
  completed: "Selesai",
  cancelled: "Dibatalkan",
}

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}
