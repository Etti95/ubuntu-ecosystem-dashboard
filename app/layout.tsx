import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ubuntu Ecosystem Health Dashboard',
  description: 'Aggregated public ecosystem signals for Ubuntu/Canonical',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1 container mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="bg-ubuntu-cool-grey text-white py-4 text-center text-sm">
            <p>Ubuntu Ecosystem Health Dashboard • Data refreshed daily</p>
          </footer>
        </div>
      </body>
    </html>
  )
}
