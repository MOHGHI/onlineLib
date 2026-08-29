import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n, localized } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import type { Category } from '../lib/types'
import { BookOpen, ArrowRight } from 'lucide-react'

export default function CategoriesPage() {
  const { locale, t } = useI18n()
  const base = `/${locale}`
  const [categories, setCategories] = useState<Category[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const { data: catData } = await supabase.from('categories').select('*').order('name')
      setCategories(catData || [])

      // Count books per category
      const { data: bookData } = await supabase.from('books').select('category_id').eq('is_active', true)
      const countMap: Record<string, number> = {}
      ;(bookData || []).forEach((b: any) => {
        if (b.category_id) countMap[b.category_id] = (countMap[b.category_id] || 0) + 1
      })
      setCounts(countMap)
      setLoading(false)
    })()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <p className="eyebrow mb-2">{t('home.categories.subtitle')}</p>
      <h1 className="section-title mb-8">{t('nav.categories')}</h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-stone-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`${base}/catalog?category=${cat.slug}`}
              className="group flex items-center justify-between p-6 card hover:border-primary-300 hover:shadow-book-sm hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors shrink-0">
                  <BookOpen className="w-7 h-7 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-stone-900">{localized(cat.name, locale)}</h3>
                  <p className="text-sm text-stone-500">{counts[cat.id] || 0} {t('catalog.results')}</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-stone-300 group-hover:text-primary-600 transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
