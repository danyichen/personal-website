import type { Metadata, Viewport } from 'next'
import { Spectral } from 'next/font/google'
import { Nav, NotHome, OnlyHome } from './client'
import './globals.css'
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from '@vercel/speed-insights/next';

// Font optimization - subset loading, display swap
const spectral = Spectral({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-spectral',
  weight: ['400', '500', '600', '700'], // Add 500 and 600 for medium and semibold
})

export const metadata: Metadata = {
  title: 'Will Chen',
  description: 'Danyi (Will) Chen | 陈丹颐, PhD student in Mechanical Engineering at Duke University. Researching robotics, focused ultrasound therapy, and surgical training simulators.',
  metadataBase: new URL('https://danyichen.com'),
  keywords: ['陈丹颐', 'Danyi Chen', 'Will Chen', 'Duke University', 'PhD', 'Mechanical Engineering', 'robotics', 'focused ultrasound', 'surgical simulators'],
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/flavicon.ico', sizes: '32x32' },
      { url: '/flavicon.svg', type: 'image/svg+xml' }
    ],
  },
  openGraph: {
    title: 'Danyi (Will) Chen | 陈丹颐 | Robotics Engineer & PhD Student',
    description: 'Danyi (Will) Chen | 陈丹颐, PhD student in Mechanical Engineering at Duke University. Researching robotics, focused ultrasound therapy, and surgical training simulators.',
    url: 'https://danyichen.com',
    siteName: 'Danyi (Will) Chen',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Danyi (Will) Chen | Robotics Engineer & PhD Student',
    description: 'Danyi (Will) Chen, PhD student in Mechanical Engineering at Duke University. Researching robotics, focused ultrasound therapy, and surgical training simulators.',
  },
  other: {
    'google-site-verification': 'fRbsFX_Ph9VuTjxZAl1ypKesArkiADGmWUi34N2SOSs',
  },
}

export const viewport: Viewport = {
  themeColor: '#423C30',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${spectral.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              "name": "Danyi (Will) Chen",
              "alternateName": ["陈丹颐", "Will Chen"],
              "jobTitle": "PhD Student",
              "worksFor": {
                "@type": "Organization",
                "name": "Duke University"
              },
              "alumniOf": [
                {
                  "@type": "CollegeOrUniversity",
                  "name": "Duke University",
                  "department": "Mechanical Engineering"
                },
                {
                  "@type": "CollegeOrUniversity",
                  "name": "Wake Forest University"
                }
              ],
              "url": "https://danyichen.com",
              "sameAs": [
                "https://github.com/danyichen",
                "https://www.linkedin.com/in/danyi-chen-878b1b174/",
                "https://scholar.google.com/citations?user=_y5PQDYAAAAJ&hl=en&oi=sra"
              ]
            })
          }}
        />
      </head>
      <body className="antialiased bg-custom-brown text-white">
        <NotHome><Nav /></NotHome>
        <main className="relative z-[1]">{children}</main>
        <NotHome><Footer /></NotHome>
        <OnlyHome><SlimFooter /></OnlyHome>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}

// The home page's footer: one quiet line, so the stage keeps the screen.
function SlimFooter() {
  return (
    <footer className="bg-custom-brown">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5 text-xs text-amber-200/50 sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} Will Chen</p>
        <div className="flex gap-5">
          <a href="https://github.com/danyichen" target="_blank" rel="noreferrer" className="transition-colors hover:text-amber-200">GitHub</a>
          <a href="https://www.linkedin.com/in/danyi-chen-878b1b174/" target="_blank" rel="noreferrer" className="transition-colors hover:text-amber-200">LinkedIn</a>
          <a href="https://scholar.google.com/citations?user=_y5PQDYAAAAJ&hl=en&oi=sra" target="_blank" rel="noreferrer" className="transition-colors hover:text-amber-200">Scholar</a>
        </div>
      </div>
    </footer>
  )
}

// Footer Component
function Footer() {
  return (
    <footer className="bg-custom-brown border-t border-white/10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-amber-200/70">
            © {new Date().getFullYear()} Will Chen
          </p>
          <p className="text-sm text-amber-200/80">
            Built with Next.js • React • TypeScript • Tailwind CSS • Three.js
          </p>
          <div className="flex space-x-6">
            <a href="https://github.com/danyichen" target="_blank" rel="noreferrer" className="text-amber-200/70">GitHub</a>
            <a href="https://www.linkedin.com/in/danyi-chen-878b1b174/" target="_blank" rel="noreferrer" className="text-amber-200/70">LinkedIn</a>
            <a href="https://scholar.google.com/citations?user=_y5PQDYAAAAJ&hl=en&oi=sra" target="_blank" rel="noreferrer" className="text-amber-200/70">Scholar</a>
          </div>
        </div>
      </div>
    </footer>
  )
}