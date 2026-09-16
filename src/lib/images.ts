/**
 * High-resolution authentic food imagery configuration and fallbacks.
 * Ensures items always display realistic food photography instead of emoji placeholders.
 */

export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  burgers: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
  pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
  drinks: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=80',
  juice: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&auto=format&fit=crop&q=80',
  coffee: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=800&auto=format&fit=crop&q=80',
  breakfast: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800&auto=format&fit=crop&q=80',
  desserts: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80',
}

/**
 * Returns the product image URL or a category-specific real food photo fallback.
 */
export function getProductImage(imageUrl?: string | null, categorySlug?: string | null): string {
  if (imageUrl && imageUrl.trim().length > 0) {
    return imageUrl.trim()
  }
  if (categorySlug && CATEGORY_FALLBACK_IMAGES[categorySlug.toLowerCase()]) {
    return CATEGORY_FALLBACK_IMAGES[categorySlug.toLowerCase()]
  }
  return CATEGORY_FALLBACK_IMAGES.default
}
