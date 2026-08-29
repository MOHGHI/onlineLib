import { Link, useParams } from 'react-router-dom'
import { useI18n } from '../lib/i18n'

export default function NotFoundPage() {
  const { locale, t } = useI18n()
  const base = `/${locale}`

  return (
    <div className="max-w-3xl mx-auto px-4 py-24 text-center">
      <p className="font-serif text-8xl font-semibold text-primary-100 mb-4 select-none">404</p>
      <h1 className="font-serif text-2xl font-semibold text-stone-900 mb-2 -mt-8">{t('error.notFound.title')}</h1>
      <p className="text-stone-500 mb-8">{t('error.notFound.body')}</p>
      <Link to={`${base}/`} className="btn-primary">
        {t('error.notFound.cta')}
      </Link>
    </div>
  )
}
