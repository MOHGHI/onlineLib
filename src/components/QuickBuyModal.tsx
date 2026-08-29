import { useState } from 'react'
import { Link } from 'react-router-dom'
import { X, Zap, Loader2, Check, Download, AlertCircle, ShieldCheck } from 'lucide-react'
import { useI18n, localized } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { requestSecureDownloadUrl, triggerUrlDownload, sanitizeFilename } from '../lib/download'
import type { Book } from '../lib/types'

interface QuickBuyModalProps {
  book: Book
  onClose: () => void
}

type Stage = 'confirm' | 'processing' | 'success' | 'error'

// One-step "pay & download" flow for digital books: skips cart/checkout and
// goes straight from a single order to a working download link, using the
// same orders / digital_downloads / secure-download pipeline as the full
// checkout flow. Ported from online_library_2's PdfPurchaseModal UX, rebuilt
// against this project's real order + secure-download infrastructure instead
// of a separate purchases table.
export default function QuickBuyModal({ book, onClose }: QuickBuyModalProps) {
  const { locale, t } = useI18n()
  const { user } = useAuth()
  const [stage, setStage] = useState<Stage>('confirm')
  const [error, setError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [downloadToken, setDownloadToken] = useState<string | null>(null)
  const [downloadCount, setDownloadCount] = useState(0)
  const [maxDownloads, setMaxDownloads] = useState(5)
  const [downloading, setDownloading] = useState(false)

  const price = book.sale_price ?? book.price
  const filename = `${sanitizeFilename(localized(book.title, locale))}.pdf`

  const handleConfirm = async () => {
    if (!user) return
    setStage('processing')
    setError(null)

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: price,
          currency: 'USD',
          payment_status: 'paid',
          order_status: 'completed',
          payment_method: 'card',
          shipping_address: null,
        })
        .select('*')
        .maybeSingle()

      if (orderError || !order) throw new Error(orderError?.message || t('error.generic'))

      const { error: itemError } = await supabase.from('order_items').insert({
        order_id: order.id,
        book_id: book.id,
        price,
        quantity: 1,
        book_type: book.type,
      })
      if (itemError) throw new Error(itemError.message)

      const { data: download, error: downloadError } = await supabase
        .from('digital_downloads')
        .insert({
          user_id: user.id,
          book_id: book.id,
          max_downloads: 5,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select('*')
        .maybeSingle()
      if (downloadError || !download) throw new Error(downloadError?.message || t('error.generic'))

      const url = await requestSecureDownloadUrl(download.download_token)

      setDownloadToken(download.download_token)
      setDownloadUrl(url)
      setDownloadCount(download.download_count)
      setMaxDownloads(download.max_downloads)
      setStage('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('quickbuy.error'))
      setStage('error')
    }
  }

  const handleDownload = async () => {
    if (!downloadUrl || !downloadToken) return
    setDownloading(true)
    try {
      triggerUrlDownload(downloadUrl, filename)
      const nextCount = downloadCount + 1
      setDownloadCount(nextCount)
      await supabase.from('digital_downloads').update({ download_count: nextCount }).eq('download_token', downloadToken)
    } finally {
      setDownloading(false)
    }
  }

  const downloadsLeft = Math.max(0, maxDownloads - downloadCount)

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
        onClick={stage === 'processing' ? undefined : onClose}
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white shadow-book animate-scale-in sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500 text-white">
              <Zap className="h-5 w-5" />
            </div>
            <h2 className="font-serif text-lg font-semibold text-stone-900">{t('quickbuy.title')}</h2>
          </div>
          {stage !== 'processing' && (
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="p-6">
          {/* Book summary */}
          <div className="mb-5 flex gap-3 rounded-xl bg-stone-50 p-4">
            <div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-stone-200">
              {book.cover_image && (
                <img src={book.cover_image} alt={localized(book.title, locale)} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 font-serif text-base font-semibold text-stone-900">{localized(book.title, locale)}</h3>
              {book.author && <p className="line-clamp-1 text-xs text-stone-500">{book.author.name}</p>}
              <span className="mt-2 inline-block font-serif text-lg font-semibold text-primary-700">
                ${price.toFixed(2)}
              </span>
            </div>
          </div>

          {!user && (
            <div className="space-y-3">
              <p className="text-sm text-stone-500">{t('quickbuy.desc')}</p>
              <Link
                to={`/${locale}/login?redirect=${encodeURIComponent(`/${locale}/book/${book.id}`)}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-sm font-medium text-white hover:bg-primary-700"
              >
                {t('nav.login')}
              </Link>
            </div>
          )}

          {user && stage === 'confirm' && (
            <div className="space-y-4">
              <p className="text-sm text-stone-500">{t('quickbuy.desc')}</p>
              <div className="flex items-center gap-2 rounded-lg bg-success-50 px-4 py-3 text-xs text-success-700">
                <Download className="h-4 w-4 shrink-0" />
                {t('quickbuy.instant')}
              </div>
              <button
                onClick={handleConfirm}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-sm font-medium text-white hover:bg-primary-700"
              >
                <Zap className="h-4 w-4" /> {t('quickbuy.confirm')}
              </button>
            </div>
          )}

          {stage === 'processing' && (
            <div className="flex flex-col items-center py-10 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
              <p className="mt-4 text-sm font-medium text-stone-600">{t('quickbuy.processing')}</p>
            </div>
          )}

          {stage === 'success' && (
            <div>
              <div className="mb-5 flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-100">
                  <Check className="h-8 w-8 text-success-600" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-stone-900">{t('quickbuy.success.title')}</h3>
                <p className="mt-2 max-w-sm text-sm text-stone-500">{t('quickbuy.success.desc')}</p>
              </div>

              <button
                onClick={handleDownload}
                disabled={downloading || downloadsLeft <= 0}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/20 hover:bg-primary-700 disabled:opacity-50"
              >
                {downloading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> {t('quickbuy.processing')}</>
                ) : (
                  <><Download className="h-5 w-5" /> {t('quickbuy.download')}</>
                )}
              </button>

              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-stone-500">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t('quickbuy.downloadsLeft')}: <span className="font-semibold text-stone-700">{downloadsLeft}</span> / {maxDownloads}
              </div>

              <Link
                to={`/${locale}/orders`}
                className="mt-4 flex w-full items-center justify-center text-sm font-medium text-stone-500 hover:text-stone-700"
              >
                {t('checkout.success.viewOrders')}
              </Link>
            </div>
          )}

          {stage === 'error' && (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error-50">
                <AlertCircle className="h-8 w-8 text-error-600" />
              </div>
              <p className="max-w-sm text-sm text-stone-500">{error || t('quickbuy.error')}</p>
              <button
                onClick={handleConfirm}
                className="mt-6 flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
              >
                {t('quickbuy.confirm')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
