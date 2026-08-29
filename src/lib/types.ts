export type Locale = 'en' | 'uz' | 'ru'

export type BookType = 'digital' | 'physical' | 'both'
export type BookFormat = 'hardcover' | 'paperback' | 'pdf' | 'audio'
export type PaymentStatus = 'pending' | 'paid' | 'failed'
export type OrderStatus = 'processing' | 'shipped' | 'completed' | 'cancelled'
export type UserRole = 'customer' | 'admin'

export interface JsonText {
  en: string
  uz: string
  ru: string
}

export interface Category {
  id: string
  name: JsonText
  slug: string
  parent_id: string | null
  created_at: string
}

export interface Author {
  id: string
  name: string
  bio: JsonText
  photo: string | null
  created_at: string
}

export interface Book {
  id: string
  isbn: string | null
  title: JsonText
  description: JsonText
  category_id: string | null
  author_id: string | null
  price: number
  sale_price: number | null
  stock_quantity: number
  type: BookType
  format: BookFormat
  rating: number
  page_count: number | null
  book_language: string
  cover_image: string | null
  digital_file_path: string | null
  sample_file_path: string | null
  is_active: boolean
  created_at: string
  category?: Category
  author?: Author
}

export interface Order {
  id: string
  order_number: string
  user_id: string
  total_amount: number
  currency: string
  payment_status: PaymentStatus
  order_status: OrderStatus
  payment_method: string
  shipping_address: JsonText | null
  created_at: string
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  book_id: string
  price: number
  quantity: number
  book_type: BookType
  book?: Book
}

export interface DigitalDownload {
  id: string
  user_id: string
  book_id: string
  download_token: string
  download_count: number
  max_downloads: number
  expires_at: string
  book?: Book
}

export interface CartItem {
  book_id: string
  title: JsonText
  price: number
  cover_image: string | null
  type: BookType
  quantity: number
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  locale: Locale
  role: UserRole
  created_at: string
}
