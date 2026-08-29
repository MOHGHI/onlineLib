import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { BookOpen, Loader2 } from 'lucide-react'

export default function SignupPage() {
  const { locale, t } = useI18n()
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const base = `/${locale}`

  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.fullName || !form.email || !form.password) {
      setError(t('auth.error.required'))
      return
    }
    if (form.password.length < 6) {
      setError(t('auth.error.generic'))
      return
    }
    setLoading(true)
    const { error: err } = await signUp(form.email, form.password, form.fullName, form.phone)
    setLoading(false)
    if (err) {
      setError(t(err))
    } else {
      navigate(`${base}/`)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/25 rotate-[-4deg]">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-stone-900">{t('auth.signUp')}</h1>
          <p className="text-sm text-stone-500 mt-1">{t('auth.signUpSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4 shadow-book-sm">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">{t('auth.fullName')}</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">{t('auth.email')}</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">{t('auth.phone')}</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">{t('auth.password')}</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>

          {error && <p className="text-sm text-error-600 bg-error-50 px-3 py-2 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-full hover:bg-primary-700 transition-colors disabled:bg-stone-300 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('auth.signUp')}
          </button>
        </form>

        <p className="text-center text-sm text-stone-500 mt-6">
          {t('auth.haveAccount')}{' '}
          <Link to={`${base}/login`} className="text-primary-600 hover:text-primary-700 font-medium">
            {t('auth.signIn')}
          </Link>
        </p>
      </div>
    </div>
  )
}
