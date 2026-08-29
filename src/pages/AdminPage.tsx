import { useEffect, useState } from 'react'
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { useI18n, localized } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import type { Book, Order, Author, Category, OrderItem, BookType, BookFormat } from '../lib/types'
import { LayoutDashboard, BookOpen, Package, Users, TrendingUp, AlertTriangle, Plus, Pencil, Trash2, X, Loader2, DollarSign, ShoppingCart, BookMarked } from 'lucide-react'
import clsx from 'clsx'

export default function AdminPage() {
  const { locale, t } = useI18n()
  const { user, isAdmin, loading: authLoading } = useAuth()
  const base = `/${locale}`

  if (authLoading) return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-stone-500">{t('common.loading')}</div>
  if (!user) return <Navigate to={`${base}/login?redirect=${encodeURIComponent(`${base}/admin`)}`} replace />
  if (!isAdmin) return <Navigate to={base} replace />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-1">
            <h2 className="font-serif text-lg font-semibold text-stone-900 mb-3 px-3">{t('admin.title')}</h2>
            <AdminNav to={`${base}/admin`} icon={LayoutDashboard} label={t('admin.dashboard')} exact />
            <AdminNav to={`${base}/admin/books`} icon={BookOpen} label={t('admin.books')} />
            <AdminNav to={`${base}/admin/orders`} icon={Package} label={t('admin.orders')} />
            <AdminNav to={`${base}/admin/customers`} icon={Users} label={t('admin.customers')} />
          </div>
        </aside>

        {/* Content */}
        <div className="lg:col-span-4">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="books" element={<AdminBooks />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="*" element={<Navigate to={`${base}/admin`} replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

function AdminNav({ to, icon: Icon, label, exact }: { to: string; icon: any; label: string; exact?: boolean }) {
  const location = useLocation()
  const active = exact ? location.pathname === to : location.pathname.startsWith(to)
  return (
    <Link
      to={to}
      className={clsx(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        active ? 'bg-primary-50 text-primary-700' : 'text-stone-600 hover:bg-primary-50 hover:text-primary-700'
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  )
}

// ===== Dashboard =====
function AdminDashboard() {
  const { locale, t } = useI18n()
  const [stats, setStats] = useState({ revenue: 0, orders: 0, booksSold: 0, lowStock: [] as Book[] })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [topBooks, setTopBooks] = useState<{ title: any; count: number; revenue: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const [{ data: orders }, { data: items }, { data: books }] = await Promise.all([
        supabase.from('orders').select('*').eq('payment_status', 'paid').order('created_at', { ascending: false }),
        supabase.from('order_items').select('*, book:books(title), order:orders(payment_status)'),
        supabase.from('books').select('*').lt('stock_quantity', 10).in('type', ['physical', 'both']),
      ])

      const paidOrders = orders || []
      const revenue = paidOrders.reduce((sum: number, o: any) => sum + Number(o.total_amount), 0)
      const paidItems = (items || []).filter((i: any) => i.order?.payment_status === 'paid')
      const booksSold = paidItems.reduce((sum: number, i: any) => sum + i.quantity, 0)

      // Top books
      const bookMap: Record<string, { title: any; count: number; revenue: number }> = {}
      paidItems.forEach((i: any) => {
        const key = i.book_id
        if (!bookMap[key]) bookMap[key] = { title: i.book?.title || { en: 'Unknown' }, count: 0, revenue: 0 }
        bookMap[key].count += i.quantity
        bookMap[key].revenue += Number(i.price) * i.quantity
      })
      const top = Object.values(bookMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

      setStats({ revenue, orders: paidOrders.length, booksSold, lowStock: (books || []) as Book[] })
      setRecentOrders(paidOrders.slice(0, 5) as Order[])
      setTopBooks(top)
      setLoading(false)
    })()
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-stone-300" /></div>

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-stone-900 mb-6">{t('admin.dashboard')}</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={DollarSign} label={t('admin.analytics.revenue')} value={`$${stats.revenue.toFixed(2)}`} color="primary" />
        <StatCard icon={ShoppingCart} label={t('admin.analytics.orders')} value={String(stats.orders)} color="accent" />
        <StatCard icon={BookMarked} label={t('admin.analytics.books')} value={String(stats.booksSold)} color="success" />
      </div>

      {/* Low stock alerts */}
      <div className="mb-8">
        <h2 className="font-serif text-lg font-semibold text-stone-900 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning-500" />
          {t('admin.analytics.lowStock')}
        </h2>
        {stats.lowStock.length === 0 ? (
          <p className="text-sm text-stone-500 p-4 bg-success-50 border border-success-100 rounded-lg">{t('admin.analytics.noLowStock')}</p>
        ) : (
          <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100">
            {stats.lowStock.map((book) => (
              <div key={book.id} className="flex items-center justify-between p-3">
                <span className="text-sm font-medium text-stone-900">{localized(book.title, locale)}</span>
                <span className={clsx('text-sm font-semibold px-2 py-0.5 rounded-full',
                  book.stock_quantity === 0 ? 'bg-error-100 text-error-700' : 'bg-warning-100 text-warning-700')}>
                  {book.stock_quantity} left
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top books */}
      <div className="mb-8">
        <h2 className="font-serif text-lg font-semibold text-stone-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          {t('admin.analytics.topBooks')}
        </h2>
        {topBooks.length === 0 ? (
          <p className="text-sm text-stone-500">No sales yet.</p>
        ) : (
          <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100">
            {topBooks.map((b, i) => (
              <div key={i} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="text-sm font-medium text-stone-900">{localized(b.title, locale)}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-stone-900">${b.revenue.toFixed(2)}</span>
                  <span className="text-xs text-stone-500 ml-2">{b.count} sold</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent orders */}
      <div>
        <h2 className="font-serif text-lg font-semibold text-stone-900 mb-3">{t('admin.analytics.recentOrders')}</h2>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-stone-500">No orders yet.</p>
        ) : (
          <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100">
            {recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-mono font-medium text-stone-900">{o.order_number}</p>
                  <p className="text-xs text-stone-500">{new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <span className="text-sm font-semibold text-stone-900">${o.total_amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-600',
    accent: 'bg-accent-50 text-accent-600',
    success: 'bg-success-50 text-success-600',
  }
  return (
    <div className="p-5 bg-white border border-stone-200 rounded-xl">
      <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center mb-3', colorMap[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-semibold text-stone-900">{value}</p>
      <p className="text-sm text-stone-500">{label}</p>
    </div>
  )
}

// ===== Books Management =====
function AdminBooks() {
  const { locale, t } = useI18n()
  const base = `/${locale}`
  const [books, setBooks] = useState<Book[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Book | null>(null)
  const [showForm, setShowForm] = useState(false)

  const load = async () => {
    const { data } = await supabase
      .from('books')
      .select('*, category:categories(*), author:authors(*)')
      .order('created_at', { ascending: false })
    setBooks(data || [])
    setLoading(false)
  }

  useEffect(() => {
    ;(async () => {
      await load()
      const [{ data: a }, { data: c }] = await Promise.all([
        supabase.from('authors').select('*').order('name'),
        supabase.from('categories').select('*').order('name'),
      ])
      setAuthors(a || [])
      setCategories(c || [])
    })()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.book.confirmDelete'))) return
    await supabase.from('books').delete().eq('id', id)
    await load()
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-stone-300" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-semibold text-stone-900">{t('admin.books')}</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" /> {t('admin.book.add')}
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-stone-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">{t('book.details')}</th>
                <th className="px-4 py-3 font-medium">{t('admin.book.price')}</th>
                <th className="px-4 py-3 font-medium">{t('admin.book.stock')}</th>
                <th className="px-4 py-3 font-medium">{t('admin.book.type')}</th>
                <th className="px-4 py-3 font-medium text-right">{t('common.edit')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {books.map((book) => (
                <tr key={book.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-14 bg-stone-100 rounded shrink-0 overflow-hidden">
                        {book.cover_image && <img src={book.cover_image} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <p className="font-medium text-stone-900 line-clamp-1">{localized(book.title, locale)}</p>
                        <p className="text-xs text-stone-500">{book.isbn || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {book.sale_price ? (
                      <div>
                        <span className="text-stone-400 line-through text-xs">${book.price.toFixed(2)}</span>
                        <span className="text-stone-900 font-medium ml-1">${book.sale_price.toFixed(2)}</span>
                      </div>
                    ) : (
                      <span className="text-stone-900">${book.price.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium',
                      book.stock_quantity === 0 ? 'bg-error-100 text-error-700' :
                      book.stock_quantity < 10 ? 'bg-warning-100 text-warning-700' :
                      'bg-success-100 text-success-700')}>
                      {book.stock_quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-stone-600 capitalize">{t(`book.${book.type}`)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setEditing(book); setShowForm(true) }} className="p-1.5 text-stone-500 hover:text-primary-600 hover:bg-primary-50 rounded">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(book.id)} className="p-1.5 text-stone-500 hover:text-error-600 hover:bg-error-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <BookForm
          book={editing}
          authors={authors}
          categories={categories}
          onClose={() => setShowForm(false)}
          onSaved={async () => { setShowForm(false); await load() }}
        />
      )}
    </div>
  )
}

function BookForm({ book, authors, categories, onClose, onSaved }: {
  book: Book | null
  authors: Author[]
  categories: Category[]
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useI18n()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<{
    isbn: string; titleEn: string; titleUz: string; titleRu: string;
    descEn: string; descUz: string; descRu: string;
    price: string; sale_price: string; stock_quantity: string;
    type: BookType; format: BookFormat; page_count: string; rating: string;
    book_language: string; category_id: string; author_id: string;
    cover_image: string; digital_file_path: string; is_active: boolean;
  }>({
    isbn: book?.isbn || '',
    titleEn: book?.title?.en || '',
    titleUz: book?.title?.uz || '',
    titleRu: book?.title?.ru || '',
    descEn: book?.description?.en || '',
    descUz: book?.description?.uz || '',
    descRu: book?.description?.ru || '',
    price: book?.price?.toString() || '',
    sale_price: book?.sale_price?.toString() || '',
    stock_quantity: book?.stock_quantity?.toString() || '0',
    type: book?.type || 'physical',
    format: book?.format || 'paperback',
    page_count: book?.page_count?.toString() || '',
    rating: book?.rating?.toString() || '0',
    book_language: book?.book_language || 'en',
    category_id: book?.category_id || '',
    author_id: book?.author_id || '',
    cover_image: book?.cover_image || '',
    digital_file_path: book?.digital_file_path || '',
    is_active: book?.is_active ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.titleEn.trim() && !form.titleUz.trim() && !form.titleRu.trim()) {
      setError(t('admin.book.error.titleRequired'))
      return
    }
    if (form.price.trim() === '' || isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0) {
      setError(t('admin.book.error.priceRequired'))
      return
    }

    setSaving(true)

    const payload = {
      isbn: form.isbn || null,
      title: { en: form.titleEn, uz: form.titleUz, ru: form.titleRu },
      description: { en: form.descEn, uz: form.descUz, ru: form.descRu },
      price: parseFloat(form.price) || 0,
      sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
      stock_quantity: parseInt(form.stock_quantity) || 0,
      type: form.type as BookType,
      format: form.format as BookFormat,
      page_count: form.page_count ? parseInt(form.page_count) : null,
      rating: form.rating ? Math.max(0, Math.min(5, parseFloat(form.rating))) : 0,
      book_language: form.book_language,
      category_id: form.category_id || null,
      author_id: form.author_id || null,
      cover_image: form.cover_image || null,
      digital_file_path: form.digital_file_path || null,
      is_active: form.is_active,
    }

    let result
    if (book) {
      result = await supabase.from('books').update(payload).eq('id', book.id)
    } else {
      result = await supabase.from('books').insert(payload)
    }

    if (result.error) {
      setError(result.error.message)
      setSaving(false)
    } else {
      onSaved()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-stone-200 sticky top-0 bg-white z-10">
          <h2 className="font-serif text-xl font-semibold">{book ? t('admin.book.edit') : t('admin.book.new')}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">{t('admin.book.titleEn')}</label>
              <input type="text" value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:border-primary-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">{t('admin.book.titleUz')}</label>
              <input type="text" value={form.titleUz} onChange={(e) => setForm({ ...form, titleUz: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:border-primary-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">{t('admin.book.titleRu')}</label>
              <input type="text" value={form.titleRu} onChange={(e) => setForm({ ...form, titleRu: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:border-primary-400" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">{t('admin.book.descEn')}</label>
              <textarea value={form.descEn} onChange={(e) => setForm({ ...form, descEn: e.target.value })} rows={3} className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:border-primary-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">{t('admin.book.descUz')}</label>
              <textarea value={form.descUz} onChange={(e) => setForm({ ...form, descUz: e.target.value })} rows={3} className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:border-primary-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">{t('admin.book.descRu')}</label>
              <textarea value={form.descRu} onChange={(e) => setForm({ ...form, descRu: e.target.value })} rows={3} className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:border-primary-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">{t('admin.book.price')}</label>
              <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:border-primary-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">{t('admin.book.salePrice')}</label>
              <input type="number" step="0.01" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:border-primary-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">{t('admin.book.stock')}</label>
              <input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:border-primary-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">{t('admin.book.pages')}</label>
              <input type="number" value={form.page_count} onChange={(e) => setForm({ ...form, page_count: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:border-primary-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">{t('admin.book.rating')}</label>
              <input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:border-primary-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">{t('admin.book.type')}</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as BookType })} className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:border-primary-400 bg-white">
                <option value="physical">{t('book.physical')}</option>
                <option value="digital">{t('book.digital')}</option>
                <option value="both">{t('book.both')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">{t('admin.book.format')}</label>
              <select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value as BookFormat })} className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:border-primary-400 bg-white">
                <option value="paperback">Paperback</option>
                <option value="hardcover">Hardcover</option>
                <option value="pdf">PDF</option>
                <option value="audio">Audio</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">{t('admin.book.author')}</label>
              <select value={form.author_id} onChange={(e) => setForm({ ...form, author_id: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:border-primary-400 bg-white">
                <option value="">—</option>
                {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">{t('admin.book.category')}</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:border-primary-400 bg-white">
                <option value="">—</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{localized(c.name, 'en')}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">{t('admin.book.isbn')}</label>
              <input type="text" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:border-primary-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">{t('admin.book.language')}</label>
              <input type="text" value={form.book_language} onChange={(e) => setForm({ ...form, book_language: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:border-primary-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">{t('admin.book.cover')}</label>
            <input type="text" value={form.cover_image} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:border-primary-400" />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">{t('admin.book.digitalFile')}</label>
            <input type="text" value={form.digital_file_path} onChange={(e) => setForm({ ...form, digital_file_path: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:border-primary-400" />
          </div>

          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
            {t('admin.book.active')}
          </label>

          {error && <p className="text-sm text-error-600 bg-error-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:bg-stone-300">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('admin.book.save')}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 border border-stone-200 text-stone-700 font-medium rounded-lg hover:bg-stone-50">
              {t('admin.book.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ===== Orders Management =====
function AdminOrders() {
  const { locale, t } = useI18n()
  const [orders, setOrders] = useState<(Order & { order_items?: (OrderItem & { book: Book })[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)

  const load = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*, book:books(*))')
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (id: string, field: 'order_status' | 'payment_status', value: string) => {
    await supabase.from('orders').update({ [field]: value }).eq('id', id)
    await load()
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-stone-300" /></div>

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-stone-900 mb-6">{t('admin.orders')}</h1>

      {orders.length === 0 ? (
        <p className="text-stone-500 text-sm">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-stone-100">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-mono text-sm font-medium text-stone-900">{order.order_number}</p>
                    <p className="text-xs text-stone-500">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-stone-100 text-stone-700 text-xs font-medium rounded-full capitalize">{order.payment_method}</span>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={order.payment_status}
                    onChange={(e) => updateStatus(order.id, 'payment_status', e.target.value)}
                    className="text-xs border border-stone-200 rounded px-2 py-1 bg-white"
                  >
                    <option value="pending">{t('status.pending')}</option>
                    <option value="paid">{t('status.paid')}</option>
                    <option value="failed">{t('status.failed')}</option>
                  </select>
                  <select
                    value={order.order_status}
                    onChange={(e) => updateStatus(order.id, 'order_status', e.target.value)}
                    className="text-xs border border-stone-200 rounded px-2 py-1 bg-white"
                  >
                    <option value="processing">{t('status.processing')}</option>
                    <option value="shipped">{t('status.shipped')}</option>
                    <option value="completed">{t('status.completed')}</option>
                    <option value="cancelled">{t('status.cancelled')}</option>
                  </select>
                  <span className="text-sm font-semibold text-stone-900">${order.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {selectedOrder === order.id && order.order_items && (
                <div className="p-4 bg-stone-50 space-y-2">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-12 bg-stone-200 rounded shrink-0 overflow-hidden">
                        {item.book?.cover_image && <img src={item.book.cover_image} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <span className="flex-1 text-stone-900">{localized(item.book?.title, locale)}</span>
                      <span className="text-stone-500">{item.quantity}×</span>
                      <span className="text-stone-900 font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                className="w-full text-center text-xs text-primary-600 hover:text-primary-700 font-medium py-2"
              >
                {selectedOrder === order.id ? t('common.close') : t('orders.view')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ===== Customers =====
function AdminCustomers() {
  const { t } = useI18n()
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      setProfiles(data || [])
      setLoading(false)
    })()
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-stone-300" /></div>

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-stone-900 mb-6">{t('admin.customers')}</h1>
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-stone-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t('checkout.fullName')}</th>
              <th className="px-4 py-3 font-medium">{t('auth.email')}</th>
              <th className="px-4 py-3 font-medium">{t('auth.phone')}</th>
              <th className="px-4 py-3 font-medium">{t('orders.date')}</th>
              <th className="px-4 py-3 font-medium">{t('nav.account')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {profiles.map((p) => (
              <tr key={p.id} className="hover:bg-stone-50">
                <td className="px-4 py-3 font-medium text-stone-900">{p.full_name || '—'}</td>
                <td className="px-4 py-3 text-stone-600">{p.email}</td>
                <td className="px-4 py-3 text-stone-600">{p.phone || '—'}</td>
                <td className="px-4 py-3 text-stone-600">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium',
                    p.role === 'admin' ? 'bg-primary-100 text-primary-700' : 'bg-stone-100 text-stone-600')}>
                    {p.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
