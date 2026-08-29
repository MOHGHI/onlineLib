import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useI18n, localized } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { useCart } from '../lib/cart'
import { supabase } from '../lib/supabase'
import { Check, CreditCard, Wallet, Loader2 } from 'lucide-react'
import clsx from 'clsx'

const PAYMENT_METHODS = [
  { id: 'stripe', labelKey: 'pay.stripe', icon: CreditCard },
  { id: 'payme', labelKey: 'pay.payme', icon: Wallet },
  { id: 'click', labelKey: 'pay.click', icon: Wallet },
  { id: 'paypal', labelKey: 'pay.paypal', icon: Wallet },
]

export default function CheckoutPage() {
  const { locale, t } = useI18n()
  const { user, loading: authLoading } = useAuth()
  const { items, total, clearCart } = useCart()
  const navigate = useNavigate()
  const base = `/${locale}`

  const [form, setForm] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Uzbekistan',
  })
  const [paymentMethod, setPaymentMethod] = useState('stripe')
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (authLoading) return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-stone-500">{t('common.loading')}</div>
  if (!user) return <Navigate to={`${base}/login?redirect=${encodeURIComponent(`${base}/checkout`)}`} replace />
  if (items.length === 0 && !success) return <Navigate to={`${base}/cart`} replace />

  const hasPhysical = items.some((i) => i.type === 'physical' || i.type === 'both')
  const digitalOnly = !hasPhysical

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.fullName || !form.email) {
      setError(t('auth.error.required'))
      return
    }
    if (hasPhysical && (!form.address || !form.city)) {
      setError(t('auth.error.required'))
      return
    }

    setProcessing(true)

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: total,
          currency: 'USD',
          payment_status: 'paid',
          order_status: digitalOnly ? 'completed' : 'processing',
          payment_method: paymentMethod,
          shipping_address: hasPhysical ? {
            fullName: form.fullName,
            address: form.address,
            city: form.city,
            postalCode: form.postalCode,
            country: form.country,
            phone: form.phone,
          } : null,
        })
        .select('*')
        .maybeSingle()

      if (orderError || !order) {
        setError(t('error.generic'))
        setProcessing(false)
        return
      }

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        book_id: item.book_id,
        price: item.price,
        quantity: item.quantity,
        book_type: item.type,
      }))
      const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
      if (itemsError) {
        setError(t('error.generic'))
        setProcessing(false)
        return
      }

      // Create digital download tokens for digital books
      const digitalItems = items.filter((i) => i.type === 'digital' || i.type === 'both')
      if (digitalItems.length > 0) {
        const downloads = digitalItems.map((item) => ({
          user_id: user.id,
          book_id: item.book_id,
          max_downloads: 5,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }))
        await supabase.from('digital_downloads').insert(downloads)
      }

      // Decrement stock for physical books
      for (const item of items) {
        if (item.type === 'physical' || item.type === 'both') {
          const { data: book } = await supabase
            .from('books')
            .select('stock_quantity')
            .eq('id', item.book_id)
            .maybeSingle()
          if (book && book.stock_quantity > 0) {
            await supabase
              .from('books')
              .update({ stock_quantity: Math.max(0, book.stock_quantity - item.quantity) })
              .eq('id', item.book_id)
          }
        }
      }

      clearCart()
      setSuccess(order.id)
      setProcessing(false)
    } catch (err) {
      setError(t('error.generic'))
      setProcessing(false)
    }
  }

  // Success screen
  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success-100 flex items-center justify-center animate-scale-in">
          <Check className="w-10 h-10 text-success-600" />
        </div>
        <h1 className="font-serif text-3xl font-semibold text-stone-900 mb-3">{t('checkout.success.title')}</h1>
        <p className="text-stone-600 mb-8">{t('checkout.success.body')}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={`${base}/orders`} className="px-6 py-3 bg-primary-600 text-white font-medium rounded-full hover:bg-primary-700 transition-colors">
            {t('checkout.success.viewOrders')}
          </Link>
          <Link to={`${base}/library`} className="px-6 py-3 border border-primary-600 text-primary-600 font-medium rounded-full hover:bg-primary-50 transition-colors">
            {t('checkout.success.viewLibrary')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="section-title mb-8">{t('checkout.title')}</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Contact */}
          <section className="p-6 card">
            <h2 className="font-serif text-lg font-semibold text-stone-900 mb-4">{t('checkout.contact')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-stone-600 mb-1">{t('checkout.fullName')} *</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-primary-400"
                />
              </div>
              <div>
                <label className="block text-sm text-stone-600 mb-1">{t('checkout.email')} *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-primary-400"
                />
              </div>
              <div>
                <label className="block text-sm text-stone-600 mb-1">{t('checkout.phone')} ({t('common.optional')})</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-primary-400"
                />
              </div>
            </div>
          </section>

          {/* Shipping (only if physical) */}
          {hasPhysical ? (
            <section className="p-6 card">
              <h2 className="font-serif text-lg font-semibold text-stone-900 mb-4">{t('checkout.shipping')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm text-stone-600 mb-1">{t('checkout.address')} *</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-primary-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-stone-600 mb-1">{t('checkout.city')} *</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-primary-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-stone-600 mb-1">{t('checkout.postalCode')}</label>
                  <input
                    type="text"
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-primary-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-stone-600 mb-1">{t('checkout.country')}</label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-primary-400"
                  />
                </div>
              </div>
            </section>
          ) : (
            <div className="p-4 bg-primary-50 border border-primary-100 rounded-xl text-sm text-primary-700">
              {t('checkout.digitalOnly')}
            </div>
          )}

          {/* Payment */}
          <section className="p-6 card">
            <h2 className="font-serif text-lg font-semibold text-stone-900 mb-4">{t('checkout.payment')}</h2>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={clsx(
                      'flex items-center gap-3 p-4 border-2 rounded-xl transition-all text-left',
                      paymentMethod === method.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-stone-200 hover:border-stone-300'
                    )}
                  >
                    <Icon className={clsx('w-5 h-5', paymentMethod === method.id ? 'text-primary-600' : 'text-stone-400')} />
                    <span className={clsx('text-sm font-medium', paymentMethod === method.id ? 'text-primary-700' : 'text-stone-700')}>
                      {t(method.labelKey)}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 p-6 card shadow-book-sm">
            <h2 className="font-serif text-lg font-semibold text-stone-900 mb-4">{t('cart.total')}</h2>
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.book_id} className="flex gap-3">
                  <div className="w-12 h-16 bg-stone-100 rounded shrink-0 overflow-hidden">
                    {item.cover_image && <img src={item.cover_image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 line-clamp-2">{localized(item.title, locale)}</p>
                    <p className="text-xs text-stone-500">{t('cart.qty')}: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-medium text-stone-900">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-stone-200 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">{t('cart.subtotal')}</span>
                <span className="text-stone-900 font-medium">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">{t('cart.shipping')}</span>
                <span className="text-stone-900 font-medium">—</span>
              </div>
              <div className="border-t border-stone-200 pt-2 flex justify-between">
                <span className="font-semibold text-stone-900">{t('cart.total')}</span>
                <span className="font-semibold text-stone-900 text-lg">${total.toFixed(2)}</span>
              </div>
            </div>

            {error && <p className="mt-4 text-sm text-error-600">{error}</p>}

            <button
              type="submit"
              disabled={processing}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 mt-4 bg-primary-600 text-white font-medium rounded-full hover:bg-primary-700 transition-colors disabled:bg-stone-300"
            >
              {processing ? <><Loader2 className="w-5 h-5 animate-spin" /> {t('checkout.processing')}</> : <>{t('checkout.placeOrder')}</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
