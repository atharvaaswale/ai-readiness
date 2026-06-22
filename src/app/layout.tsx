// ------------------------------------------------------------------
// Root Layout
//
// Purpose:
//   Required App Router layout. Wraps every page with the shared HTML
//   shell, Inter font, and global metadata.
//
// Responsibility:
//   - Sets <html lang="en">
//   - Loads Inter font via next/font
//   - Defines global <head> metadata
//   - Applies Tailwind base styles
//
// Dependencies:
//   - next/font (Inter)
//   - globals.css (Tailwind directives)
// ------------------------------------------------------------------

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeToggle } from '@/components/theme-toggle'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Readiness Analyzer',
  description:
    'Analyze any webpage for AI-readiness, SEO quality, structure, and discoverability.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                var t = localStorage.getItem('theme');
                if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme:dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeToggle />
        {children}
      </body>
    </html>
  )
}

