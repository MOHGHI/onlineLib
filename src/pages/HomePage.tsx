import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n, localized } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import type { Book, Category } from '../lib/types'
import BookCard from '../components/BookCard'
import AboutSection from '../components/AboutSection'
import { ArrowRight, BookOpen, Globe, Download, Truck, Sparkles } from 'lucide-react'

export default function HomePage() {
  const { locale, t } = useI18n()
  const base = `/${locale}`
  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [totalBooks, setTotalBooks] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const [{ data: bookData }, { data: catData }, { count }] = await Promise.all([
        supabase
          .from('books')
          .select('*, category:categories(*), author:authors(*)')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(8),
        supabase.from('categories').select('*').order('name'),
        supabase.from('books').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ])
      setBooks(bookData || [])
      setCategories(catData || [])
      setTotalBooks(count ?? null)
      setLoading(false)
    })()
  }, [])

  const heroCovers = books.filter((b) => b.cover_image).slice(0, 3)

  const stats = [
    { value: totalBooks !== null ? `${totalBooks}+` : '—', label: t('home.featured') },
    { value: '3', label: t('app.tagline') },
    { value: categories.length ? String(categories.length) : '—', label: t('home.categories.title') },
    { value: 'PDF', label: t('book.digital') },
  ]

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-grain-overlay bg-gradient-to-br from-primary-50 via-paper to-accent-50">
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 bg-primary-200 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent-200 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Copy */}
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/70 backdrop-blur rounded-full text-sm text-primary-700 mb-6 border border-primary-100">
                <Globe className="w-4 h-4" />
                <span>{t('app.tagline')}</span>
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-stone-900 leading-[1.08] mb-6">
                {t('home.hero.title').split(' ').map((word, i, arr) =>
                  i === arr.length - 1 ? (
                    <span key={i} className="relative inline-block text-primary-700">
                      {word}
                      <svg className="absolute -bottom-1 left-0 w-full" height="10" viewBox="0 0 100 10" preserveAspectRatio="none">
                        <path d="M0,7 Q50,-2 100,7" fill="none" stroke="currentColor" className="text-accent-400" strokeWidth="4" strokeLinecap="round" />
                      </svg>
                    </span>
                  ) : (
                    <span key={i}>{word}{' '}</span>
                  )
                )}
              </h1>
              <p className="text-lg text-stone-600 mb-8 leading-relaxed max-w-xl">
                {t('home.hero.subtitle')}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to={`${base}/catalog`} className="btn-primary">
                  {t('home.hero.cta')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to={`${base}/categories`} className="btn-ghost">
                  <Sparkles className="w-4 h-4 text-accent-500" />
                  {t('home.categories.title')}
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-12 grid grid-cols-4 gap-3 sm:gap-4 max-w-lg">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-2xl bg-white/60 backdrop-blur-sm ring-1 ring-stone-200/60 p-3 sm:p-4">
                    <div className="font-serif text-xl sm:text-2xl font-semibold text-stone-900">{s.value}</div>
                    <div className="text-[11px] leading-tight text-stone-500">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cover collage */}
            <div className="relative hidden lg:block h-[420px] animate-fade-up [animation-delay:150ms]">
              {heroCovers[0] && (
                <div className="absolute left-8 top-0 w-44 rotate-[-6deg] rounded-2xl overflow-hidden shadow-book ring-1 ring-black/5">
                  <img src={heroCovers[0].cover_image!} alt="" className="aspect-[3/4] w-full object-cover" />
                </div>
              )}
              {heroCovers[1] && (
                <div className="absolute right-4 top-16 w-48 rotate-[4deg] rounded-2xl overflow-hidden shadow-book ring-1 ring-black/5 z-10">
                  <img src={heroCovers[1].cover_image!} alt="" className="aspect-[3/4] w-full object-cover" />
                </div>
              )}
              {heroCovers[2] && (
                <div className="absolute left-24 bottom-0 w-40 rotate-[3deg] rounded-2xl overflow-hidden shadow-book ring-1 ring-black/5">
                  <img src={heroCovers[2].cover_image!} alt="" className="aspect-[3/4] w-full object-cover" />
                </div>
              )}
              <div className="absolute -top-3 right-16 flex items-center gap-1.5 rounded-full bg-accent-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg">
                <Sparkles className="h-3.5 w-3.5" />
                {t('book.sale')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section className="border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="font-serif font-semibold text-stone-900">{t('book.digital')}</p>
                <p className="text-sm text-stone-500">PDF, ePub, Audio</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent-50 flex items-center justify-center shrink-0">
                <Truck className="w-6 h-6 text-accent-600" />
              </div>
              <div>
                <p className="font-serif font-semibold text-stone-900">{t('book.physical')}</p>
                <p className="text-sm text-stone-500">{t('cart.shipping')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center shrink-0">
                <Download className="w-6 h-6 text-success-600" />
              </div>
              <div>
                <p className="font-serif font-semibold text-stone-900">{t('library.download')}</p>
                <p className="text-sm text-stone-500">7-day secure access</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About / why choose us */}
      <AboutSection />

      {/* Featured books */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="eyebrow mb-2">{t('nav.catalog')}</p>
            <h2 className="section-title">{t('home.featured')}</h2>
          </div>
          <Link to={`${base}/catalog`} className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 shrink-0">
            {t('home.featured.seeAll')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-stone-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
        <Link to={`${base}/catalog`} className="mt-8 flex sm:hidden items-center justify-center gap-1 text-sm font-medium text-primary-600">
          {t('home.featured.seeAll')}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <p className="eyebrow mb-2">{t('home.categories.subtitle')}</p>
          <h2 className="section-title">{t('home.categories.title')}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              to={`${base}/catalog?category=${cat.slug}`}
              className="group p-6 card text-center hover:border-primary-300 hover:shadow-book-sm hover:-translate-y-0.5 transition-all"
            >
              <div
                className={clsxHue(i)}
              >
                <BookOpen className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-stone-900">{localized(cat.name, locale)}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

// Small deterministic color rotation so the category grid isn't a wall of
// identical blue circles — cycles through the palette already in use
// elsewhere on the site (no new colors introduced).
function clsxHue(index: number): string {
  const hues = [
    'bg-primary-50 text-primary-600 group-hover:bg-primary-100',
    'bg-accent-50 text-accent-600 group-hover:bg-accent-100',
    'bg-success-50 text-success-600 group-hover:bg-success-100',
    'bg-warning-50 text-warning-600 group-hover:bg-warning-100',
  ]
  return `w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center transition-colors ${hues[index % hues.length]}`
}
