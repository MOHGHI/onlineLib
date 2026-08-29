import { Link } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { BookOpen, ArrowRight } from 'lucide-react'

export default function Footer() {
  const { locale, t } = useI18n()
  const base = `/${locale}`

  return (
    <footer className="bg-grain-overlay bg-espresso-950 text-espresso-200 mt-20">
      {/* CTA strip */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-serif text-xl sm:text-2xl text-white text-center sm:text-left">{t('home.hero.title')}</p>
          <Link
            to={`${base}/catalog`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-espresso-900 text-sm font-medium hover:bg-espresso-100 transition-colors shrink-0"
          >
            {t('home.hero.cta')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center rotate-[-4deg]">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-serif text-xl font-semibold text-white">{t('app.name')}</span>
            </div>
            <p className="text-sm text-espresso-300 max-w-xs leading-relaxed">{t('footer.about')}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">{t('footer.links')}</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to={`${base}/catalog`} className="hover:text-white transition-colors">{t('nav.catalog')}</Link></li>
              <li><Link to={`${base}/categories`} className="hover:text-white transition-colors">{t('nav.categories')}</Link></li>
              <li><Link to={`${base}/library`} className="hover:text-white transition-colors">{t('nav.library')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">{t('nav.account')}</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to={`${base}/login`} className="hover:text-white transition-colors">{t('nav.login')}</Link></li>
              <li><Link to={`${base}/signup`} className="hover:text-white transition-colors">{t('nav.signup')}</Link></li>
              <li><Link to={`${base}/orders`} className="hover:text-white transition-colors">{t('nav.orders')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-white/10 text-center text-sm text-espresso-400">
          © {new Date().getFullYear()} {t('app.name')}. {t('footer.rights')}
        </div>
      </div>
    </footer>
  )
}
