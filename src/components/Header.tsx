import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useI18n, LOCALES, localized } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { useCart } from '../lib/cart'
import { BookOpen, ShoppingCart, User, Menu, X, Globe, ChevronDown, LogOut, Library, Package, LayoutDashboard } from 'lucide-react'
import clsx from 'clsx'

export default function Header() {
  const { locale, setLocale, t } = useI18n()
  const { user, isAdmin, signOut } = useAuth()
  const { count } = useCart()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [search, setSearch] = useState('')
  const langRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  const base = `/${locale}`

  useEffect(() => {
    setMobileOpen(false)
    setLangOpen(false)
    setUserOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`${base}/catalog?q=${encodeURIComponent(search.trim())}`)
    }
  }

  const navLink = (path: string, label: string) => {
    const to = `${base}${path}`
    const active = location.pathname === to || (path === '/catalog' && location.pathname.startsWith(to))
    return (
      <Link to={to} className="relative py-1 text-sm font-medium text-stone-600 transition-colors hover:text-primary-700 group">
        <span className={active ? 'text-primary-700' : ''}>{label}</span>
        <span className={clsx(
          'absolute -bottom-0.5 left-0 h-[1.5px] bg-primary-600 transition-all',
          active ? 'w-full' : 'w-0 group-hover:w-full'
        )} />
      </Link>
    )
  }

  return (
    <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur-md border-b border-stone-200/80">
      <div className="h-[3px] bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to={base} className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-md shadow-primary-600/25 rotate-[-4deg]">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block leading-tight">
              <span className="font-serif text-xl font-semibold text-stone-900 block">{t('app.name')}</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400">{t('app.tagline')}</span>
            </div>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('nav.search')}
                className="w-full pl-4 pr-10 py-2 text-sm bg-stone-100/80 border border-transparent rounded-full focus:outline-none focus:border-primary-300 focus:bg-white focus:shadow-sm transition-all"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-primary-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
            </div>
          </form>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLink('/catalog', t('nav.catalog'))}
            {navLink('/categories', t('nav.categories'))}
            {user && navLink('/library', t('nav.library'))}
            {user && navLink('/orders', t('nav.orders'))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language switcher */}
            <div ref={langRef} className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 px-2 py-2 text-sm text-stone-600 hover:text-primary-600 rounded-lg transition-colors"
              >
                <Globe className="w-5 h-5" />
                <span className="uppercase font-medium hidden sm:block">{locale}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-stone-200 rounded-xl shadow-book-sm py-1 animate-scale-in">
                  {LOCALES.map((l) => (
                    <button
                      key={l}
                      onClick={() => setLocale(l)}
                      className={clsx(
                        'w-full text-left px-4 py-2 text-sm hover:bg-stone-50 transition-colors',
                        locale === l ? 'text-primary-700 font-medium' : 'text-stone-700'
                      )}
                    >
                      {t(`lang.${l}`)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart */}
            <Link to={`${base}/cart`} className="relative p-2 text-stone-600 hover:text-primary-600 transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-accent-500 text-white text-xs font-semibold rounded-full flex items-center justify-center shadow-sm animate-scale-in">
                  {count}
                </span>
              )}
            </Link>

            {/* User menu */}
            {user ? (
              <div ref={userRef} className="relative">
                <button
                  onClick={() => setUserOpen(!userOpen)}
                  className="flex items-center gap-1 p-1.5 rounded-full hover:bg-stone-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
                    {(user.full_name || user.email).charAt(0).toUpperCase()}
                  </div>
                </button>
                {userOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-stone-200 rounded-xl shadow-book-sm py-1 animate-scale-in">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="text-sm font-medium text-stone-900 truncate">{user.full_name || user.email}</p>
                      <p className="text-xs text-stone-500 truncate">{user.email}</p>
                    </div>
                    <Link to={`${base}/library`} className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                      <Library className="w-4 h-4" /> {t('nav.library')}
                    </Link>
                    <Link to={`${base}/orders`} className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                      <Package className="w-4 h-4" /> {t('nav.orders')}
                    </Link>
                    {isAdmin && (
                      <Link to={`${base}/admin`} className="flex items-center gap-2 px-4 py-2 text-sm text-primary-700 hover:bg-primary-50 font-medium">
                        <LayoutDashboard className="w-4 h-4" /> {t('nav.admin')}
                      </Link>
                    )}
                    <button
                      onClick={() => signOut()}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 border-t border-stone-100"
                    >
                      <LogOut className="w-4 h-4" /> {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to={`${base}/login`} className="text-sm font-medium text-stone-600 hover:text-primary-600 px-3 py-2">
                  {t('nav.login')}
                </Link>
                <Link to={`${base}/signup`} className="text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-full transition-colors shadow-sm shadow-primary-600/20">
                  {t('nav.signup')}
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-stone-600 hover:text-primary-600"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-stone-200 py-4 animate-fade-in">
            <form onSubmit={handleSearch} className="mb-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('nav.search')}
                className="w-full px-4 py-2 text-sm bg-stone-100 border border-transparent rounded-lg focus:outline-none focus:border-primary-400"
              />
            </form>
            <div className="flex flex-col gap-3">
              {navLink('/catalog', t('nav.catalog'))}
              {navLink('/categories', t('nav.categories'))}
              {user && navLink('/library', t('nav.library'))}
              {user && navLink('/orders', t('nav.orders'))}
              {isAdmin && navLink('/admin', t('nav.admin'))}
              {!user && (
                <div className="flex gap-3 pt-2">
                  <Link to={`${base}/login`} className="flex-1 text-center text-sm font-medium text-stone-600 border border-stone-300 px-4 py-2 rounded-lg">
                    {t('nav.login')}
                  </Link>
                  <Link to={`${base}/signup`} className="flex-1 text-center text-sm font-medium text-white bg-primary-600 px-4 py-2 rounded-lg">
                    {t('nav.signup')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
