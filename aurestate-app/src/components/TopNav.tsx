"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Database } from "lucide-react"

const NAV_LINKS = [
  { label: "Estimer", href: "/" },
  { label: "Méthode", href: "/methode" },
  { label: "API", href: "/docs" },
]

export default function TopNav() {
  const pathname = usePathname()

  // Strip basePath (/AURESTATE) for active matching — usePathname returns the
  // path as seen by the router (without basePath in Next.js 15+/16).
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname === ""
    return pathname?.startsWith(href) ?? false
  }

  return (
    <header
      className="sticky top-0 z-50 h-14 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md"
      style={{ height: "56px" }}
    >
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="text-sm font-semibold tracking-widest text-white hover:text-blue-400 transition-colors uppercase"
        >
          AURESTATE
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden sm:flex items-center gap-1" aria-label="Navigation principale">
          {NAV_LINKS.map(({ label, href }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "text-white bg-slate-800"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60",
                ].join(" ")}
                aria-current={active ? "page" : undefined}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right badge */}
        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-400">
          <Database className="h-3 w-3 text-blue-400" />
          Données DVF&nbsp;·&nbsp;Open Data
        </span>

        {/* Mobile: just show badge compressed */}
        <span className="sm:hidden inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-400">
          <Database className="h-3 w-3 text-blue-400" />
          DVF
        </span>
      </div>
    </header>
  )
}
