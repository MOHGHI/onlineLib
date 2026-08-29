import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useI18n, localized } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import type { Order } from '../lib/types'
import { Package, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

const statusColors: Record<string, string> = {
  pending: 'bg-warning-100 text-warning-700',
  paid: 'bg-success-100 text-success-700',
  failed: 'bg-error-100 text-error-700',
  processing: 'bg-primary-100 text-primary-700',
  shipped: 'bg-accent-100 text-accent-700',
  completed: 'bg-success-100 text-success-700',
  cancelled: 'bg-stone-200 text-stone-600',
}

export default function OrdersPage() {
  const { locale, t } = useI18n()
  const { user, loading: authLoading } = useAuth()
  const base = `/${locale}`
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, book:books(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (!error) setOrders(data || [])
      setLoading(false)
    })()
  }, [user])

  if (authLoading) return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-stone-500">{t('common.loading')}</div>
  if (!user) return <Navigate to={`${base}/login?redirect=${encodeURIComponent(`${base}/orders`)}`} replace />

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-stone-500">{t('common.loading')}</div>
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-stone-100 flex items-center justify-center">
          <Package className="w-10 h-10 text-stone-300" />
        </div>
        <h1 className="font-serif text-2xl font-semibold text-stone-900 mb-2">{t('orders.title')}</h1>
        <p className="text-stone-500 mb-6">{t('orders.empty')}</p>
        <Link to={`${base}/catalog`} className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
          {t('cart.empty.cta')}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="section-title mb-8">{t('orders.title')}</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="card overflow-hidden hover:shadow-book-sm transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-stone-100">
              <div>
                <p className="text-sm text-stone-500">{t('orders.orderNumber')}</p>
                <p className="font-mono text-sm font-medium text-stone-900">{order.order_number}</p>
              </div>
              <div>
                <p className="text-sm text-stone-500">{t('orders.date')}</p>
                <p className="text-sm text-stone-900">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-stone-500">{t('orders.total')}</p>
                <p className="text-sm font-semibold text-stone-900">${order.total_amount.toFixed(2)}</p>
              </div>
              <div className="flex gap-2">
                <span className={clsx('px-2.5 py-1 text-xs font-medium rounded-full', statusColors[order.payment_status] || 'bg-stone-100')}>
                  {t(`status.${order.payment_status}`)}
                </span>
                <span className={clsx('px-2.5 py-1 text-xs font-medium rounded-full', statusColors[order.order_status] || 'bg-stone-100')}>
                  {t(`status.${order.order_status}`)}
                </span>
              </div>
            </div>

            <div className="p-5">
              <div className="space-y-3">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-16 bg-stone-100 rounded shrink-0 overflow-hidden">
                      {item.book?.cover_image && <img src={item.book.cover_image} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`${base}/book/${item.book_id}`} className="text-sm font-medium text-stone-900 hover:text-primary-600 line-clamp-1">
                        {localized(item.book?.title, locale)}
                      </Link>
                      <p className="text-xs text-stone-500">{t('cart.qty')}: {item.quantity} · ${item.price.toFixed(2)}</p>
                    </div>
                    <span className="text-sm font-medium text-stone-900">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
