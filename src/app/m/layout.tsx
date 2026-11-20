import type { Metadata } from 'next'
import Link from 'next/link'

// The classic multi-page site, served to phones; the home page's stage is for larger screens.
export const metadata: Metadata = { alternates: { canonical: '/' }, robots: { index: false, follow: true } }

export default function ClassicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}

// Header Component
function Header() {
  return (
    <header className="sticky top-0 z-10 backdrop-blur-sm bg-custom-brown/80 border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center min-h-20 py-2">
          <nav className="flex flex-wrap justify-center gap-x-4 sm:gap-x-8 md:gap-x-16 gap-y-2 items-center">
            <Link href="/m" className="inline-flex items-center px-1 pt-1 text-base sm:text-lg font-medium hover:text-amber-200">Home</Link>
            <Link href="/m/about" className="inline-flex items-center px-1 pt-1 text-base sm:text-lg font-medium hover:text-amber-200">About</Link>
            <Link href="/m/projects" className="inline-flex items-center px-1 pt-1 text-base sm:text-lg font-medium hover:text-amber-200">Projects</Link>
            <Link href="/m/personal" className="inline-flex items-center px-1 pt-1 text-base sm:text-lg font-medium hover:text-amber-200">Personal</Link>
            <Link href="/m/contact" className="inline-flex items-center px-1 pt-1 text-base sm:text-lg font-medium hover:text-amber-200">Contact</Link>
          </nav>
        </div>
      </div>
    </header>
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