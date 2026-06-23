// ------------------------------------------------------------------
// AnalysisForm
//
// Purpose:
//   URL input form on the landing page. Manages client-side
//   validation and submission.
//
// Responsibility:
//   - Controlled input for URL
//   - Client-side validation using the same validateUrl() logic
//   - Submit calls onAnalyze(url) callback
//   - Shows loading spinner while request is in flight
//   - Displays inline error messages
//
// Dependencies:
//   - components/ui/input.tsx
//   - components/ui/button.tsx
// ------------------------------------------------------------------

'use client'

import { useState, type FormEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const CLIENT_ERRORS: Record<string, string> = {
  'URL is required': 'Please enter a URL',
  'Invalid URL format': 'Enter a valid URL (e.g., https://example.com)',
  'URL must use http or https protocol': 'URL must start with http:// or https://',
  'URL must have a valid hostname': 'Enter a full domain name (e.g., example.com)',
}

interface AnalysisFormProps {
  onAnalyze: (url: string) => void
  loading: boolean
}

export function AnalysisForm({ onAnalyze, loading }: AnalysisFormProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmed = url.trim()
    if (!trimmed) {
      setError('Please enter a URL')
      return
    }

    // Normalize: add https:// if missing for display/validation
    const normalized = trimmed.match(/^https?:\/\//i) ? trimmed : `https://${trimmed}`

    try {
      new URL(normalized)
    } catch {
      setError('Enter a valid URL (e.g., https://example.com)')
      return
    }

    onAnalyze(normalized)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Website URL"
        type="text"
        placeholder="https://example.com"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value)
          if (error) setError(null)
        }}
        error={error ?? undefined}
        disabled={loading}
      />
      <Button type="submit" loading={loading} disabled={loading}>
        Analyze
      </Button>
    </form>
  )
}
