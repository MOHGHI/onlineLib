import { Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { LOCALES, DEFAULT_LOCALE, useI18n } from './lib/i18n'
import type { Locale } from './lib/types'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import CatalogPage from './pages/CatalogPage'
import BookDetailPage from './pages/BookDetailPage'
import CategoriesPage from './pages/CategoriesPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import LibraryPage from './pages/LibraryPage'
import OrdersPage from './pages/OrdersPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import AdminPage from './pages/AdminPage'
import NotFoundPage from './pages/NotFoundPage'

function LocaleLayout() {
  const { locale } = useParams<{ locale: string }>()
  const { setLocale } = useI18n()
  const location = useLocation()

  // Validate locale param; redirect if invalid
  if (!locale || !LOCALES.includes(locale as Locale)) {
    const path = location.pathname
    return <Navigate to={`/${DEFAULT_LOCALE}${path}`} replace />
  }

  useEffect(() => {
    setLocale(locale as Locale)
  }, [locale, setLocale])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="book/:bookId" element={<BookDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="admin/*" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/:locale/*" element={<LocaleLayout />} />
      <Route path="*" element={<Navigate to={`/${DEFAULT_LOCALE}`} replace />} />
    </Routes>
  )
}
