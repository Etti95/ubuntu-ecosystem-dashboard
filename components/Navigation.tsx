'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Overview' },
  { href: '/github', label: 'GitHub' },
  { href: '/community', label: 'Community' },
  { href: '/methodology', label: 'Methodology' },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-ubuntu-orange text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="font-bold text-xl">
            Ubuntu Health Dashboard
          </Link>
          <div className="flex space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-ubuntu-orange-dark'
                    : 'hover:bg-ubuntu-orange-dark/50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
