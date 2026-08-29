import { supabase } from './supabase'

interface SecureDownloadResponse {
  url: string
  bookTitle?: unknown
}

// Calls the secure-download edge function with a digital_downloads token and
// returns a (possibly time-limited) URL to the file.
export async function requestSecureDownloadUrl(downloadToken: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke<SecureDownloadResponse>('secure-download', {
    body: { downloadToken },
  })
  if (error || !data?.url) {
    throw new Error(error?.message || 'Could not generate a download link.')
  }
  return data.url
}

// Triggers a browser download/open for a URL (works for both real signed
// URLs and the edge function's data: URL fallback).
export function triggerUrlDownload(url: string, filename: string): void {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.target = '_blank'
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function sanitizeFilename(title: string): string {
  return (
    title
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase()
      .slice(0, 60) || 'book'
  )
}
