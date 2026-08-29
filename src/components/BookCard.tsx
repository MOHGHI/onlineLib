import { Link } from 'react-router-dom'
import { useI18n, localized } from '../lib/i18n'
import { useCart } from '../lib/cart'
import type { Book } from '../lib/types'
import StarRating from './StarRating'
import { ShoppingCart, Check, BookOpen } from 'lucide-react'
import clsx from 'clsx'

export default function BookCard({ book }: { book: Book }) {
  const { locale, t } = useI18n()
  const { items, addItem } = useCart()
  const base = `/${locale}`
  const inCart = items.some((i) => i.book_id === book.id)

  const displayPrice = book.sale_price ?? book.price
  const hasSale = book.sale_price !== null && book.sale_price < book.price
  const outOfStock = book.stock_quantity === 0 && (book.type === 'physical' || book.type === 'both')

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem({
      book_id: book.id,
      title: book.title,
      price: displayPrice,
      cover_image: book.cover_image,
      type: book.type,
    })
  }

  return (
    <Link to={`${base}/book/${book.id}`} className="group block">
      <div className="rounded-2xl overflow-hidden transition-all duration-300 group-hover:-translate-y-1">
        {/* Cover */}
        <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden rounded-2xl shadow-book-sm transition-shadow duration-300 group-hover:shadow-book">
          {book.cover_image ? (
            <img
              src={book.cover_image}
              alt={localized(book.title, locale)}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-300 bg-gradient-to-br from-stone-100 to-stone-50">
              <BookOpen className="w-10 h-10" />
            </div>
          )}
          {/* Bottom gradient for badge/title legibility */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-stone-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {hasSale && (
              <span className="px-2 py-0.5 bg-accent-500 text-white text-[11px] font-semibold rounded-full shadow-sm">
                {t('book.sale')}
              </span>
            )}
            {(book.type === 'digital' || book.type === 'both') && (
              <span className="px-2 py-0.5 bg-primary-600 text-white text-[11px] font-medium rounded-full shadow-sm">
                {t('book.digital')}
              </span>
            )}
          </div>

          {/* Quick add */}
          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className={clsx(
              'absolute bottom-2.5 right-2.5 w-9 h-9 flex items-center justify-center rounded-full shadow-md transition-all',
              'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0',
              outOfStock
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : inCart
                ? 'bg-success-500 text-white opacity-100 translate-y-0'
                : 'bg-white text-primary-600 hover:bg-primary-600 hover:text-white'
            )}
          >
            {inCart ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
          </button>

          {outOfStock && (
            <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center">
              <span className="px-3 py-1 bg-white text-stone-900 text-xs font-medium rounded-full">
                {t('book.outOfStock')}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="pt-3">
          <h3 className="font-serif text-sm font-semibold text-stone-900 line-clamp-2 leading-snug mb-1 group-hover:text-primary-700 transition-colors">
            {localized(book.title, locale)}
          </h3>
          {book.author && (
            <p className="text-xs text-stone-500 mb-1 truncate">{book.author.name}</p>
          )}
          {book.rating > 0 && <StarRating rating={book.rating} size={12} className="mb-1.5" />}
          <div className="flex items-baseline gap-1.5">
            {hasSale && (
              <span className="text-xs text-stone-400 line-through">${book.price.toFixed(2)}</span>
            )}
            <span className="font-serif text-base font-semibold text-stone-900">${displayPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
