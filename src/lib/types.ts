export interface CategoryWithProducts {
  id: string
  name: string
  slug: string
  emoji: string | null
  sortOrder: number
  products: ProductItem[]
}

export interface ProductItem {
  id: string
  name: string
  description: string | null
  price: number | string // Decimal serialized as number/string
  imageUrl: string | null
  isAvailable: boolean
  categoryId: string
  category?: {
    id: string
    name: string
    slug: string
    emoji: string | null
  }
}
