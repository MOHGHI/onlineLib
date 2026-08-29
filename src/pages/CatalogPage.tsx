import { useEffect, useState, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useI18n, localized } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import type { Book, Category, Author } from '../lib/types'
import BookCard from '../components/BookCard'
import { SlidersHorizontal, X } from 'lucide-react'
import clsx from 'clsx'

type SortKey = 'newest' | 'priceLow' | 'priceHigh' | 'title'

export default function CatalogPage() {
  const { locale, t } = useI18n()
  const base = `/${locale}`
  const [searchParams, setSearchParams] = useSearchParams()
  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const q = searchParams.get('q') || ''
  const categorySlug = searchParams.get('category') || ''
  const format = searchParams.get('format') || ''
  const authorId = searchParams.get('author') || ''
  const availability = searchParams.get('availability') || ''
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const sort = (searchParams.get('sort') as SortKey) || 'newest'

  useEffect(() => {
    (async () => {
      const [{ data: catData }, { data: authorData }] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('authors').select('*').order('name'),
      ])
      setCategories(catData || [])
      setAuthors(authorData || [])
    })()
  }, [])

  useEffect(() => {
    setLoading(true)
    let query = supabase
      .from('books')
      .select('*, category:categories(*), author:authors(*)')
      .eq('is_active', true)

    if (categorySlug) {
      const cat = categories.find((c) => c.slug === categorySlug)
      if (cat) query = query.eq('category_id', cat.id)
    }
    if (authorId) query = query.eq('author_id', authorId)
    if (format === 'digital') query = query.in('type', ['digital', 'both'])
    if (format === 'physical') query = query.in('type', ['physical', 'both'])
    if (availability === 'instock') query = query.gt('stock_quantity', 0)
    if (minPrice) query = query.gte('price', parseFloat(minPrice))
    if (maxPrice) query = query.lte('price', parseFloat(maxPrice))

    switch (sort) {
      case 'priceLow': query = query.order('price', { ascending: true }); break
      case 'priceHigh': query = query.order('price', { ascending: false }); break
      case 'title': query = query.order('title', { ascending: true }); break
      default: query = query.order('created_at', { ascending: false })
    }

    query.then(({ data, error }) => {
      if (error) {
        console.error(error)
        setBooks([])
      } else {
        // Client-side text search across JSONB fields
        let filtered = data || []
        if (q) {
          const lower = q.toLowerCase()
          filtered = filtered.filter((b) => {
            const titleMatch = Object.values(b.title || {}).some((v: any) => String(v).toLowerCase().includes(lower))
            const descMatch = Object.values(b.description || {}).some((v: any) => String(v).toLowerCase().includes(lower))
            const authorMatch = b.author?.name?.toLowerCase().includes(lower)
            const isbnMatch = b.isbn?.toLowerCase().includes(lower)
            return titleMatch || descMatch || authorMatch || isbnMatch
          })
        }
        setBooks(filtered)
      }
      setLoading(false)
    })
  }, [q, categorySlug, format, authorId, availability, minPrice, maxPrice, sort, categories])

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value)
    else params.delete(key)
    setSearchParams(params)
  }

  const clearFilters = () => {
    setSearchParams({})
  }

  const hasActiveFilters = useMemo(() => {
    return !!(q || categorySlug || format || authorId || availability || minPrice || maxPrice)
  }, [q, categorySlug, format, authorId, availability, minPrice, maxPrice])

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <h4 className="text-sm font-semibold text-stone-900 mb-3">{t('filter.category')}</h4>
        <div className="space-y-1.5">
          <button
            onClick={() => updateParam('category', '')}
            className={clsx('block text-sm w-full text-left px-2 py-1 rounded transition-colors',
              !categorySlug ? 'text-primary-700 font-medium bg-primary-50' : 'text-stone-600 hover:bg-stone-50')}
          >
            {t('filter.all')}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => updateParam('category', c.slug)}
              className={clsx('block text-sm w-full text-left px-2 py-1 rounded transition-colors',
                categorySlug === c.slug ? 'text-primary-700 font-medium bg-primary-50' : 'text-stone-600 hover:bg-stone-50')}
            >
              {localized(c.name, locale)}
            </button>
          ))}
        </div>
      </div>

      {/* Format */}
      <div>
        <h4 className="text-sm font-semibold text-stone-900 mb-3">{t('filter.format')}</h4>
        <div className="space-y-1.5">
          {[
            { val: '', label: t('filter.all') },
            { val: 'digital', label: t('filter.digital') },
            { val: 'physical', label: t('filter.physical') },
          ].map((f) => (
            <button
              key={f.val}
              onClick={() => updateParam('format', f.val)}
              className={clsx('block text-sm w-full text-left px-2 py-1 rounded transition-colors',
                format === f.val ? 'text-primary-700 font-medium bg-primary-50' : 'text-stone-600 hover:bg-stone-50')}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <h4 className="text-sm font-semibold text-stone-900 mb-3">{t('filter.availability')}</h4>
        <div className="space-y-1.5">
          {[
            { val: '', label: t('filter.all') },
            { val: 'instock', label: t('filter.inStock') },
          ].map((a) => (
            <button
              key={a.val}
              onClick={() => updateParam('availability', a.val)}
              className={clsx('block text-sm w-full text-left px-2 py-1 rounded transition-colors',
                availability === a.val ? 'text-primary-700 font-medium bg-primary-50' : 'text-stone-600 hover:bg-stone-50')}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h4 className="text-sm font-semibold text-stone-900 mb-3">{t('filter.price')}</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => updateParam('minPrice', e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:border-primary-400"
          />
          <span className="text-stone-400">—</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => updateParam('maxPrice', e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:border-primary-400"
          />
        </div>
      </div>

      {/* Author */}
      <div>
        <h4 className="text-sm font-semibold text-stone-900 mb-3">{t('filter.author')}</h4>
        <select
          value={authorId}
          onChange={(e) => updateParam('author', e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:border-primary-400 bg-white"
        >
          <option value="">{t('filter.all')}</option>
          {authors.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium py-2 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
        >
          {t('filter.clearAll')}
        </button>
      )}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="section-title mb-2">{t('catalog.title')}</h1>
        <p className="text-sm text-stone-500">
          {loading ? t('common.loading') : `${books.length} ${t('catalog.results')}`}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24">
            <FilterPanel />
          </div>
        </aside>

        {/* Mobile filter toggle */}
        <div className="lg:hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-lg text-sm font-medium text-stone-700 bg-white"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {t('filter.sort')}
          </button>
          {showFilters && (
            <div className="mt-4 p-4 card">
              <FilterPanel />
            </div>
          )}
        </div>

        {/* Books grid */}
        <div className="flex-1">
          {/* Sort bar */}
          <div className="flex items-center justify-between mb-6">
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-primary-400"
            >
              <option value="newest">{t('sort.newest')}</option>
              <option value="priceLow">{t('sort.priceLow')}</option>
              <option value="priceHigh">{t('sort.priceHigh')}</option>
              <option value="title">{t('sort.title')}</option>
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-stone-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-stone-500 mb-4">{t('catalog.empty')}</p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50"
              >
                {t('catalog.empty.cta')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
