import { Globe, Download, Library, CreditCard } from 'lucide-react'
import { useI18n } from '../lib/i18n'

// Ported from online_library_2's AboutSection.tsx (a "why choose us" trust
// section), re-themed with this project's palette — warm espresso instead
// of a second cool-toned dark, so it reads as one system with the footer.
export default function AboutSection() {
  const { t } = useI18n()

  const features = [
    { icon: Globe, title: t('home.about.feature1.title'), desc: t('home.about.feature1.desc') },
    { icon: Download, title: t('home.about.feature2.title'), desc: t('home.about.feature2.desc') },
    { icon: Library, title: t('home.about.feature3.title'), desc: t('home.about.feature3.desc') },
    { icon: CreditCard, title: t('home.about.feature4.title'), desc: t('home.about.feature4.desc') },
  ]

  return (
    <section className="relative overflow-hidden bg-grain-overlay bg-espresso-950 py-16 lg:py-20">
      <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-accent-500/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-espresso-300">
              {t('home.about.eyebrow')}
            </div>
            <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl">
              {t('home.about.title')}
            </h2>
            <p className="mt-3 text-espresso-200">{t('home.about.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:-translate-y-0.5"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/20 text-accent-300">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1 font-serif text-base font-semibold text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-espresso-200">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
