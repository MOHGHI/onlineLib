import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useI18n, localized } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import type { DigitalDownload } from '../lib/types'
import { Download, BookOpen, Clock, Loader2, Library } from 'lucide-react'

export default function LibraryPage() {
  const { locale, t } = useI18n()
  const { user, loading: authLoading } = useAuth()
  const base = `/${locale}`
  const [downloads, setDownloads] = useState<DigitalDownload[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data, error } = await supabase
        .from('digital_downloads')
        .select('*, book:books(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (!error) setDownloads(data || [])
      setLoading(false)
    })()
  }, [user])

  if (authLoading) return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-stone-500">{t('common.loading')}</div>
  if (!user) return <Navigate to={`${base}/login?redirect=${encodeURIComponent(`${base}/library`)}`} replace />

  const handleDownload = async (download: DigitalDownload) => {
    if (!download.book) return
    setDownloadingId(download.id)

    try {
      // Call the edge function to get a secure signed URL
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/secure-download`
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ downloadToken: download.download_token }),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        alert(errBody.error || t('toast.downloadExpired'))
        setDownloadingId(null)
        return
      }

      const { url } = await res.json()

      // Increment download count locally
      const newCount = download.download_count + 1
      await supabase
        .from('digital_downloads')
        .update({ download_count: newCount })
        .eq('id', download.id)

      setDownloads((prev) =>
        prev.map((d) => d.id === download.id ? { ...d, download_count: newCount } : d)
      )

      // Open the file
      window.open(url, '_blank')
      setDownloadingId(null)
    } catch (err) {
      alert(t('error.generic'))
      setDownloadingId(null)
    }
  }

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-stone-300 mx-auto" /></div>
  }

  if (downloads.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-stone-100 flex items-center justify-center">
          <Library className="w-10 h-10 text-stone-300" />
        </div>
        <h1 className="font-serif text-2xl font-semibold text-stone-900 mb-2">{t('library.title')}</h1>
        <p className="text-stone-500 mb-6">{t('library.empty')}</p>
        <Link to={`${base}/catalog`} className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
          {t('cart.empty.cta')}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-serif text-3xl font-semibold text-stone-900 mb-8">{t('library.title')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {downloads.map((dl) => {
          const expired = new Date(dl.expires_at) < new Date()
          const remaining = dl.max_downloads - dl.download_count
          const expiredOrUsed = expired || remaining <= 0
          return (
            <div key={dl.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="aspect-[3/4] bg-stone-100 overflow-hidden">
                {dl.book?.cover_image ? (
                  <img src={dl.book.cover_image} alt={localized(dl.book.title, locale)} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300">
                    <BookOpen className="w-12 h-12" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-serif font-semibold text-stone-900 line-clamp-2 mb-2">{localized(dl.book?.title, locale)}</h3>
                <div className="flex items-center gap-3 text-xs text-stone-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {expired ? <span className="text-error-600">{t('toast.downloadExpired')}</span> : `${t('library.expires')}: ${new Date(dl.expires_at).toLocaleDateString()}`}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mb-4">
                  {t('library.downloadLimit')}: {Math.max(0, remaining)}/{dl.max_downloads}
                </p>
                <button
                  onClick={() => handleDownload(dl)}
                  disabled={expiredOrUsed || downloadingId === dl.id}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:bg-stone-200 disabled:text-stone-400"
                >
                  {downloadingId === dl.id ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {t('common.loading')}</>
                  ) : (
                    <><Download className="w-4 h-4" /> {t('library.download')}</>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
