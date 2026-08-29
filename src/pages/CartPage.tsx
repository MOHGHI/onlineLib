import { Link } from 'react-router-dom'
import { useI18n, localized } from '../lib/i18n'
import { useCart } from '../lib/cart'
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react'

export default function CartPage() {
  const { locale, t } = useI18n()
  const { items, removeItem, updateQuantity, total, count } = useCart()
  const base = `/${locale}`

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-stone-100 flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 text-stone-300" />
        </div>
        <h1 className="font-serif text-2xl font-semibold text-stone-900 mb-2">{t('cart.title')}</h1>
        <p className="text-stone-500 mb-6">{t('cart.empty')}</p>
        <Link to={`${base}/catalog`} className="btn-primary">
          {t('cart.empty.cta')} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="section-title mb-6">{t('cart.title')}</h1>
      <p className="text-sm text-stone-500 mb-6">{count} {count === 1 ? t('cart.item') : t('cart.items')}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.book_id} className="flex gap-4 p-4 card">
              <Link to={`${base}/book/${item.book_id}`} className="shrink-0">
                <div className="w-20 h-28 bg-stone-100 rounded-lg overflow-hidden">
                  {item.cover_image ? (
                    <img src={item.cover_image} alt={localized(item.title, locale)} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </div>
                  )}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`${base}/book/${item.book_id}`} className="font-serif font-semibold text-stone-900 hover:text-primary-600 line-clamp-2">
                  {localized(item.title, locale)}
                </Link>
                <p className="text-sm text-stone-500 mt-1 capitalize">{t(`book.${item.type}`)}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.book_id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center border border-stone-200 rounded-lg hover:bg-stone-50"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.book_id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center border border-stone-200 rounded-lg hover:bg-stone-50"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-stone-900">${(item.price * item.quantity).toFixed(2)}</span>
                    <button
                      onClick={() => removeItem(item.book_id)}
                      className="text-stone-400 hover:text-error-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 p-6 card shadow-book-sm">
            <h2 className="font-serif text-lg font-semibold text-stone-900 mb-4">{t('cart.total')}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">{t('cart.subtotal')}</span>
                <span className="text-stone-900 font-medium">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">{t('cart.shipping')}</span>
                <span className="text-stone-900 font-medium">—</span>
              </div>
              <div className="border-t border-stone-200 pt-2 mt-2 flex justify-between">
                <span className="font-semibold text-stone-900">{t('cart.total')}</span>
                <span className="font-semibold text-stone-900 text-lg">${total.toFixed(2)}</span>
              </div>
            </div>
            <Link to={`${base}/checkout`} className="block w-full text-center px-6 py-3 mt-4 bg-primary-600 text-white font-medium rounded-full hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20">
              {t('cart.checkout')}
            </Link>
            <Link to={`${base}/catalog`} className="block w-full text-center px-6 py-3 mt-2 text-sm text-stone-600 hover:text-primary-600">
              {t('cart.continue')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
