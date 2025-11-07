/**
 * Combines class names
 */
export function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(" ")
}

/**
 * Formats a date into a readable string
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "N/A"
  
  const d = new Date(date)
  
  // Check if the date is valid
  if (isNaN(d.getTime())) return "Invalid Date"
  
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/**
 * Formats a date on the client side
 */
export function formatDateClient(date: string | Date | null | undefined): string {
  if (!date) return "N/A"
  
  try {
    const d = new Date(date)
    
    // Check if the date is valid
    if (isNaN(d.getTime())) return "Invalid Date"
    
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Error"
  }
}

/**
 * Formats a number as currency
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return "N/A"
  
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount
  
  // Check if the amount is a valid number
  if (isNaN(numAmount)) return "Invalid Amount"
  
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount)
}

/**
 * Gets an image URL, handling both relative and absolute paths
 */
export function getImageUrl(path: string | null | undefined): string {
  if (!path) return "/placeholder-image.jpg"
  
  // If the path is already an absolute URL, return it as is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }
  
  // If the path is relative but starts with a slash, assume it's from the root
  if (path.startsWith("/")) {
    return path
  }
  
  // Otherwise, assume it's a relative path from the backend
  // Use the API base URL and remove /api suffix if present
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') || "http://localhost:8000"
  return `${baseUrl}/storage/${path}`
}

/**
 * Gets a user-friendly error message from an error object
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === "string") return error
  
  if (error && typeof error === "object") {
    // Check for specific error types
    if ("message" in error && typeof error.message === "string") {
      return error.message
    }
    
    if ("error" in error && typeof error.error === "string") {
      return error.error
    }
  }
  
  return "An unknown error occurred"
}
