export function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(" ")
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "N/A"
  const d = new Date(date)
  if (isNaN(d.getTime())) return "Invalid Date"
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

export function formatDateClient(date: string | Date | null | undefined): string {
  if (!date) return "N/A"
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return "Invalid Date"
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  } catch {
    return "Error"
  }
}

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return "N/A"
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount
  if (isNaN(numAmount)) return "Invalid Amount"
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numAmount)
}

export function getImageUrl(path: string | null | undefined): string {
  if (!path) return "/placeholder-image.jpg"
  if (path.startsWith("http://") || path.startsWith("https://")) return path
  if (path.startsWith("/")) return path
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') || "http://localhost:8000"
  return `${baseUrl}/storage/${path}`
}

export function getErrorMessage(error: unknown): string {
  if (typeof error === "string") return error
  if (error && typeof error === "object") {
    const anyErr = error as any
    if (typeof anyErr.message === "string") return anyErr.message
    if (typeof anyErr.error === "string") return anyErr.error
  }
  return "An unknown error occurred"
}
