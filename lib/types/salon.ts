export type SalonCard = {
  id: string
  name: string
  slug: string
  description: string | null
  address: string | null
  city: string | null
  photo_url: string | null
  cover_url: string | null
  categories: string[] | null
  min_price: number | null
  max_price: number | null
}