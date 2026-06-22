// ------------------------------------------------------------------
// Custom Error Classes
//
// Purpose:
//   Typed error hierarchy so the pipeline can distinguish between
//   retryable and non-retryable failures, and route handlers can
//   return appropriate HTTP status codes.
//
// Responsibility:
//   AnalysisError (base)
//     statusCode: number
//     userMessage: string  (safe to return to client)
//   ├── UrlValidationError (400)
//   ├── HtmlFetchError (502)
//   │     timeout, DNS failure, non-200, non-HTML
//   ├── ApiRateLimitError (429)
//   │     retryable with backoff
//   ├── ApiTimeoutError (504)
//   │     retryable
//   ├── GeminiParseError (502)
//   │     LLM output didn't match expected schema
//   └── PartialAnalysisError (200)
//         Some analyzers failed, partial results available
//
// Dependencies:
//   - None
// -----------------------------------------------------------------/

export class AnalysisError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public userMessage: string
  ) {
    super(message)
    this.name = 'AnalysisError'
  }
}

export class UrlValidationError extends AnalysisError {
  constructor(message: string, userMessage: string) {
    super(message, 400, userMessage)
    this.name = 'UrlValidationError'
  }
}

export class HtmlFetchError extends AnalysisError {
  constructor(message: string, userMessage: string) {
    super(message, 502, userMessage)
    this.name = 'HtmlFetchError'
  }
}

export class ApiRateLimitError extends AnalysisError {
  constructor(message: string, userMessage?: string) {
    super(message, 429, userMessage ?? 'Service temporarily unavailable. Please try again.')
    this.name = 'ApiRateLimitError'
  }
}

export class ApiTimeoutError extends AnalysisError {
  constructor(message: string, userMessage?: string) {
    super(message, 504, userMessage ?? 'Request timed out. Please try again.')
    this.name = 'ApiTimeoutError'
  }
}

export class GeminiParseError extends AnalysisError {
  constructor(message: string) {
    super(message, 502, 'AI analysis failed to produce valid results.')
    this.name = 'GeminiParseError'
  }
}

export class PartialAnalysisError extends AnalysisError {
  constructor(message: string, public partialData: Record<string, unknown>) {
    super(message, 200, 'Analysis completed with partial data.')
    this.name = 'PartialAnalysisError'
  }
}
