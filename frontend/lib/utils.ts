/**
 * Get the full URL for an image stored in the backend
 */
export function getImageUrl(imagePath: string | null): string {
  if (!imagePath) {
    return '/placeholder-image.jpg' // Fallback image
  }

  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath
  }

  // Backend storage URL - remove /api suffix if present
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
  const baseUrl = apiUrl.replace('/api', '')
  return `${baseUrl}/storage/${imagePath}`
}

/**
 * Format date for display (hydration-safe)
 * Uses a simple, deterministic format to avoid server/client mismatch
 */
export function formatDate(dateString: string | Date | undefined, includeTime: boolean = false): string {
  if (!dateString) return '';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Extract components using UTC to avoid timezone issues
    const year = date.getUTCFullYear();
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const month = monthNames[date.getUTCMonth()];
    const day = date.getUTCDate();
    
    if (includeTime) {
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      return `${month} ${day}, ${year} at ${hours}:${minutes}`;
    }
    
    return `${month} ${day}, ${year}`;
  } catch (error) {
    // Fallback for invalid dates
    if (typeof dateString === 'string') return dateString;
    return '';
  }
}

/**
 * Handle API errors and return user-friendly messages
 */
export function getErrorMessage(error: any): string {
  if (error.message) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return 'An unexpected error occurred. Please try again.'
}

/**
 * Format a number as currency with comma separators
 * @param amount The amount to format
 * @returns Formatted string with comma separators
 */
export function formatCurrency(amount: number | undefined): string {
  if (amount === undefined) return '0.00';
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Truncate a string to a specified length and add ellipsis if needed
 * @param str The string to truncate
 * @param length Maximum length before truncation
 * @returns Truncated string with ellipsis if needed
 */
export function truncate(str: string, length: number): string {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
}