import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { BookOpen, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const { locale, t } = useI18n()
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const base = `/${locale}`
  const redirect = searchParams.get('redirect') || `${base}/`

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError(t('auth.error.required'))
      return
    }
    setLoading(true)
    const { error: err } = await signIn(email, password)
    setLoading(false)
    if (err) {
      setError(t(err))
    } else {
      navigate(redirect)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/25 rotate-[-4deg]">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-stone-900">{t('nav.login')}</h1>
          <p className="text-sm text-stone-500 mt-1">{t('auth.signInSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4 shadow-book-sm">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">{t('auth.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">{t('auth.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-sm text-error-600 bg-error-50 px-3 py-2 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-full hover:bg-primary-700 transition-colors disabled:bg-stone-300 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('auth.signIn')}
          </button>
        </form>

        <p className="text-center text-sm text-stone-500 mt-6">
          {t('auth.noAccount')}{' '}
          <Link to={`${base}/signup`} className="text-primary-600 hover:text-primary-700 font-medium">
            {t('auth.signUp')}
          </Link>
        </p>
      </div>
    </div>
  )
}
