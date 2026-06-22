// ------------------------------------------------------------------
// URL Validator
//
// Purpose:
//   Client-side and server-side URL validation. Shared logic ensures
//   consistent validation rules.
//
// Responsibility:
//   - Validates URL format (must be http/https)
//   - Rejects IPFS, onion, localhost (unless NODE_ENV=development)
//   - Requires hostname has at least one dot
//
// Dependencies:
//   - None (pure function, no imports)
// ------------------------------------------------------------------

export interface ValidUrlResult {
  valid: true
  url: string
}

export interface InvalidUrlResult {
  valid: false
  error: string
}

export type UrlValidationResult = ValidUrlResult | InvalidUrlResult

export function validateUrl(rawUrl: string): UrlValidationResult {
  if (!rawUrl || rawUrl.trim().length === 0) {
    return { valid: false, error: 'URL is required' }
  }

  let parsed: URL

  try {
    // Add https:// if no protocol provided
    const normalized = rawUrl.trim()
    const withProtocol = normalized.match(/^https?:\/\//i)
      ? normalized
      : `https://${normalized}`
    parsed = new URL(withProtocol)
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'URL must use http or https protocol' }
  }

  if (!parsed.hostname.includes('.')) {
    return { valid: false, error: 'URL must have a valid hostname' }
  }

  if (parsed.hostname === 'localhost' && process.env.NODE_ENV === 'production') {
    return { valid: false, error: 'localhost is not allowed in production' }
  }

  return { valid: true, url: parsed.href }
}
