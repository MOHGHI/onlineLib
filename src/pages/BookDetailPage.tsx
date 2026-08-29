import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useI18n, localized } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { useCart } from '../lib/cart'
import type { Book } from '../lib/types'
import BookCard from '../components/BookCard'
import StarRating from '../components/StarRating'
import QuickBuyModal from '../components/QuickBuyModal'
import { ShoppingCart, Check, Download, BookOpen, ArrowLeft, Zap } from 'lucide-react'
import clsx from 'clsx'

export default function BookDetailPage() {
  const { bookId, locale } = useParams<{ bookId: string; locale: string }>()
  const { t } = useI18n()
  const navigate = useNavigate()
  const { items, addItem } = useCart()
  const base = `/${locale}`
  const [book, setBook] = useState<Book | null>(null)
  const [related, setRelated] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [showSample, setShowSample] = useState(false)
  const [showQuickBuy, setShowQuickBuy] = useState(false)

  useEffect(() => {
    if (!bookId) return
    setLoading(true)
    ;(async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*, category:categories(*), author:authors(*)')
        .eq('id', bookId)
        .maybeSingle()
      if (error || !data) {
        setBook(null)
        setLoading(false)
        return
      }
      setBook(data as Book)

      // Related books — same category, excluding current
      if (data.category_id) {
        const { data: relData } = await supabase
          .from('books')
          .select('*, category:categories(*), author:authors(*)')
          .eq('category_id', data.category_id)
          .neq('id', bookId)
          .eq('is_active', true)
          .limit(4)
        setRelated(relData || [])
      }
      setLoading(false)
    })()
  }, [bookId])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-[3/4] bg-stone-100 rounded-xl" />
          <div className="space-y-4">
            <div className="h-8 bg-stone-100 rounded w-3/4" />
            <div className="h-4 bg-stone-100 rounded w-1/2" />
            <div className="h-32 bg-stone-100 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-stone-500">{t('error.notFound.body')}</p>
        <Link to={`${base}/catalog`} className="inline-flex items-center gap-2 mt-4 text-primary-600">
          <ArrowLeft className="w-4 h-4" /> {t('error.notFound.cta')}
        </Link>
      </div>
    )
  }

  const displayPrice = book.sale_price ?? book.price
  const hasSale = book.sale_price !== null && book.sale_price < book.price
  const inCart = items.some((i) => i.book_id === book.id)
  const outOfStock = book.stock_quantity === 0 && (book.type === 'physical' || book.type === 'both')
  const hasDigital = book.type === 'digital' || book.type === 'both'

  const handleAdd = () => {
    addItem({
      book_id: book.id,
      title: book.title,
      price: displayPrice,
      cover_image: book.cover_image,
      type: book.type,
    })
  }

  const handleBuyNow = () => {
    handleAdd()
    navigate(`${base}/checkout`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to={`${base}/catalog`} className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-primary-600 mb-6 group">
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" /> {t('common.back')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* Cover */}
        <div className="relative lg:mx-8">
          <div className="aspect-[3/4] bg-stone-100 rounded-2xl overflow-hidden shadow-book">
            {book.cover_image ? (
              <img src={book.cover_image} alt={localized(book.title, locale as any)} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-300 bg-gradient-to-br from-stone-100 to-stone-50">
                <BookOpen className="w-20 h-20" />
              </div>
            )}
          </div>
          {hasSale && (
            <span className="absolute top-4 left-4 px-3 py-1 bg-accent-500 text-white text-sm font-semibold rounded-full shadow-md">
              {t('book.sale')}
            </span>
          )}
        </div>

        {/* Info */}
        <div>
          {book.category && (
            <Link to={`${base}/catalog?category=${book.category.slug}`} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              {localized(book.category.name, locale as any)}
            </Link>
          )}
          <h1 className="font-serif text-3xl lg:text-4xl font-semibold text-stone-900 mt-2 mb-3 leading-tight">
            {localized(book.title, locale as any)}
          </h1>
          {book.author && (
            <Link to={`${base}/catalog?author=${book.author.id}`} className="text-lg text-stone-600 hover:text-primary-600">
              {book.author.name}
            </Link>
          )}

          {/* Rating */}
          <div className="mt-3">
            <StarRating rating={book.rating} size={16} showValue />
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mt-6">
            {hasSale && <span className="text-lg text-stone-400 line-through">${book.price.toFixed(2)}</span>}
            <span className="font-serif text-3xl font-semibold text-stone-900">${displayPrice.toFixed(2)}</span>
            <span className="text-sm text-stone-500">{t('common.currency')}</span>
          </div>

          {/* Type badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="px-3 py-1 bg-primary-50 text-primary-700 text-sm font-medium rounded-full">
              {t(`book.${book.type}`)}
            </span>
            <span className="px-3 py-1 bg-stone-100 text-stone-700 text-sm font-medium rounded-full uppercase">
              {book.format}
            </span>
            {book.type !== 'digital' && (
              <span className={clsx('px-3 py-1 text-sm font-medium rounded-full',
                outOfStock ? 'bg-error-50 text-error-700' : 'bg-success-50 text-success-700')}>
                {outOfStock ? t('book.outOfStock') : `${t('filter.inStock')}: ${book.stock_quantity}`}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={handleAdd}
              disabled={outOfStock}
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium transition-all active:scale-[0.98]',
                outOfStock
                  ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                  : inCart
                  ? 'bg-success-100 text-success-700'
                  : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-600/20'
              )}
            >
              {inCart ? <><Check className="w-5 h-5" /> {t('book.inCart')}</> : <><ShoppingCart className="w-5 h-5" /> {t('book.addToCart')}</>}
            </button>
            {!outOfStock && (
              <button
                onClick={handleBuyNow}
                className="flex-1 px-6 py-3 rounded-full border border-primary-600 text-primary-600 font-medium hover:bg-primary-50 transition-colors active:scale-[0.98]"
              >
                {t('book.buyNow')}
              </button>
            )}
          </div>

          {/* Quick buy: skip cart/checkout, pay and download this digital copy right away */}
          {hasDigital && !outOfStock && (
            <button
              onClick={() => setShowQuickBuy(true)}
              className="flex items-center gap-2 mt-3 text-sm font-medium text-accent-600 hover:text-accent-700"
            >
              <Zap className="w-4 h-4" /> {t('quickbuy.cta')}
            </button>
          )}

          {/* Sample preview */}
          {hasDigital && book.sample_file_path && (
            <button
              onClick={() => setShowSample(true)}
              className="flex items-center gap-2 mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              <Download className="w-4 h-4" /> {t('book.readSample')}
            </button>
          )}

          {/* Description */}
          <div className="mt-8">
            <h3 className="font-serif text-lg font-semibold text-stone-900 mb-2">{t('book.description')}</h3>
            <p className="text-stone-600 leading-relaxed">{localized(book.description, locale as any)}</p>
          </div>

          {/* Details */}
          <div className="mt-8 border-t border-stone-200 pt-6">
            <h3 className="font-serif text-lg font-semibold text-stone-900 mb-4">{t('book.details')}</h3>
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              {book.isbn && (<><dt className="text-stone-500">{t('book.isbn')}</dt><dd className="text-stone-900">{book.isbn}</dd></>)}
              {book.author && (<><dt className="text-stone-500">{t('book.author')}</dt><dd className="text-stone-900">{book.author.name}</dd></>)}
              {book.page_count && (<><dt className="text-stone-500">{t('book.pages')}</dt><dd className="text-stone-900">{book.page_count}</dd></>)}
              <><dt className="text-stone-500">{t('book.language')}</dt><dd className="text-stone-900 uppercase">{book.book_language}</dd></>
              <><dt className="text-stone-500">{t('book.format')}</dt><dd className="text-stone-900 uppercase">{book.format}</dd></>
              <><dt className="text-stone-500">{t('book.type')}</dt><dd className="text-stone-900">{t(`book.${book.type}`)}</dd></>
            </dl>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-20 pt-10 border-t border-stone-200">
          <h2 className="section-title text-2xl sm:text-3xl mb-8">{t('book.related')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
            {related.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </section>
      )}

      {/* Sample modal */}
      {showSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm" onClick={() => setShowSample(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-book animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-stone-200">
              <h3 className="font-serif text-lg font-semibold">{t('book.preview')}</h3>
              <button onClick={() => setShowSample(false)} className="text-stone-400 hover:text-stone-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="prose max-w-none">
                <p className="text-stone-600 leading-relaxed mb-4">
                  {localized(book.description, locale as any).slice(0, 500)}...
                </p>
                <p className="text-stone-400 text-sm italic">
                  This is a preview of the first 10 pages. Purchase the book to read the full content.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showQuickBuy && <QuickBuyModal book={book} onClose={() => setShowQuickBuy(false)} />}
    </div>
  )
}
