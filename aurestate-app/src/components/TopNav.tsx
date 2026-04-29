"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Database, Menu, X } from "lucide-react"

const NAV_LINKS = [
  { label: "Estimer", href: "/" },
  { label: "Méthode", href: "/methode" },
  { label: "API", href: "/docs" },
]

export default function TopNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname === ""
    return pathname?.startsWith(href) ?? false
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="text-sm font-semibold tracking-widest text-white hover:text-blue-400 transition-colors uppercase"
          onClick={() => setOpen(false)}
        >
          AURESTATE
        </Link>

        {/* Desktop nav */}
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

        {/* Right: badge (desktop) + hamburger (mobile) */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-400">
            <Database className="h-3 w-3 text-blue-400" />
            Données DVF&nbsp;·&nbsp;Open Data
          </span>

          <button
            className="sm:hidden rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="sm:hidden border-t border-slate-800 bg-slate-950 px-4 py-3 space-y-1" aria-label="Navigation mobile">
          {NAV_LINKS.map(({ label, href }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={[
                  "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
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
          <div className="pt-2 border-t border-slate-800 flex items-center gap-1.5 px-3 py-2 text-xs text-slate-500">
            <Database className="h-3 w-3 text-blue-400" />
            Données DVF · Open Data
          </div>
        </nav>
      )}
    </header>
  )
}
