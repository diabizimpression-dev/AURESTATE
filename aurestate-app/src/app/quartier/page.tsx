"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  TrendingUp, TrendingDown, Minus, MapPin, BarChart3,
  Building2, Zap, ChevronDown, ChevronUp, Search,
} from "lucide-react"

// ─── Data ─────────────────────────────────────────────────────────────────────

interface Arrondissement {
  code: string
  nom: string
  prix_m2: number
  tendance: number   // % sur 12 mois
  score_marche: number
  nb_transactions: number
  dpe_dominant: string
  delai_vente: number // jours
  type_dominant: string
}

const ARRONDISSEMENTS: Arrondissement[] = [
  { code: "75001", nom: "1er — Louvre", prix_m2: 13500, tendance: 1.2, score_marche: 72, nb_transactions: 312, dpe_dominant: "D", delai_vente: 52, type_dominant: "Appartement" },
  { code: "75002", nom: "2ème — Bourse", prix_m2: 12800, tendance: 2.1, score_marche: 75, nb_transactions: 287, dpe_dominant: "D", delai_vente: 48, type_dominant: "Appartement" },
  { code: "75003", nom: "3ème — Temple", prix_m2: 13200, tendance: 1.8, score_marche: 78, nb_transactions: 398, dpe_dominant: "E", delai_vente: 45, type_dominant: "Appartement" },
  { code: "75004", nom: "4ème — Hôtel-de-Ville", prix_m2: 14500, tendance: 0.8, score_marche: 70, nb_transactions: 421, dpe_dominant: "E", delai_vente: 58, type_dominant: "Appartement" },
  { code: "75005", nom: "5ème — Panthéon", prix_m2: 14800, tendance: 1.5, score_marche: 74, nb_transactions: 356, dpe_dominant: "E", delai_vente: 51, type_dominant: "Appartement" },
  { code: "75006", nom: "6ème — Luxembourg", prix_m2: 16200, tendance: -0.5, score_marche: 65, nb_transactions: 289, dpe_dominant: "E", delai_vente: 72, type_dominant: "Appartement" },
  { code: "75007", nom: "7ème — Palais-Bourbon", prix_m2: 17500, tendance: -1.2, score_marche: 61, nb_transactions: 245, dpe_dominant: "F", delai_vente: 85, type_dominant: "Appartement" },
  { code: "75008", nom: "8ème — Élysée", prix_m2: 15200, tendance: -0.8, score_marche: 63, nb_transactions: 278, dpe_dominant: "E", delai_vente: 78, type_dominant: "Appartement" },
  { code: "75009", nom: "9ème — Opéra", prix_m2: 12500, tendance: 3.2, score_marche: 85, nb_transactions: 512, dpe_dominant: "D", delai_vente: 38, type_dominant: "Appartement" },
  { code: "75010", nom: "10ème — Entrepôt", prix_m2: 11200, tendance: 4.1, score_marche: 88, nb_transactions: 634, dpe_dominant: "E", delai_vente: 32, type_dominant: "Appartement" },
  { code: "75011", nom: "11ème — Popincourt", prix_m2: 11800, tendance: 3.8, score_marche: 90, nb_transactions: 721, dpe_dominant: "E", delai_vente: 29, type_dominant: "Appartement" },
  { code: "75012", nom: "12ème — Reuilly", prix_m2: 10800, tendance: 3.5, score_marche: 87, nb_transactions: 589, dpe_dominant: "D", delai_vente: 35, type_dominant: "Appartement" },
  { code: "75013", nom: "13ème — Gobelins", prix_m2: 10500, tendance: 2.9, score_marche: 84, nb_transactions: 678, dpe_dominant: "C", delai_vente: 38, type_dominant: "Appartement" },
  { code: "75014", nom: "14ème — Observatoire", prix_m2: 11500, tendance: 2.4, score_marche: 82, nb_transactions: 545, dpe_dominant: "D", delai_vente: 41, type_dominant: "Appartement" },
  { code: "75015", nom: "15ème — Vaugirard", prix_m2: 11800, tendance: 2.7, score_marche: 83, nb_transactions: 892, dpe_dominant: "D", delai_vente: 39, type_dominant: "Appartement" },
  { code: "75016", nom: "16ème — Passy", prix_m2: 13800, tendance: -0.3, score_marche: 66, nb_transactions: 634, dpe_dominant: "C", delai_vente: 68, type_dominant: "Appartement" },
  { code: "75017", nom: "17ème — Batignolles", prix_m2: 12200, tendance: 2.2, score_marche: 80, nb_transactions: 598, dpe_dominant: "D", delai_vente: 43, type_dominant: "Appartement" },
  { code: "75018", nom: "18ème — Buttes-Montmartre", prix_m2: 10200, tendance: 3.1, score_marche: 86, nb_transactions: 712, dpe_dominant: "E", delai_vente: 36, type_dominant: "Appartement" },
  { code: "75019", nom: "19ème — Buttes-Chaumont", prix_m2: 9500, tendance: 4.8, score_marche: 92, nb_transactions: 756, dpe_dominant: "D", delai_vente: 28, type_dominant: "Appartement" },
  { code: "75020", nom: "20ème — Ménilmontant", prix_m2: 9800, tendance: 4.2, score_marche: 91, nb_transactions: 689, dpe_dominant: "E", delai_vente: 30, type_dominant: "Appartement" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const prix_min = Math.min(...ARRONDISSEMENTS.map(a => a.prix_m2))
const prix_max = Math.max(...ARRONDISSEMENTS.map(a => a.prix_m2))

function prixColor(p: number): string {
  const pct = (p - prix_min) / (prix_max - prix_min)
  if (pct < 0.3) return "text-emerald-400"
  if (pct < 0.6) return "text-amber-400"
  return "text-red-400"
}

function dpeBg(d: string): string {
  if (d === "A" || d === "B") return "bg-green-600"
  if (d === "C") return "bg-lime-600"
  if (d === "D") return "bg-yellow-500"
  if (d === "E") return "bg-orange-500"
  return "bg-red-600"
}

function scoreColor(v: number) {
  if (v >= 85) return "text-emerald-400"
  if (v >= 70) return "text-amber-400"
  return "text-red-400"
}

function scoreBg(v: number) {
  if (v >= 85) return "bg-emerald-500"
  if (v >= 70) return "bg-amber-500"
  return "bg-red-500"
}

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n)
}

type SortKey = "prix_m2" | "tendance" | "score_marche" | "nb_transactions" | "delai_vente"

// ─── Card ─────────────────────────────────────────────────────────────────────

function ArrondissementCard({ a, rank, delay }: { a: Arrondissement; rank: number; delay: number }) {
  const [expanded, setExpanded] = useState(false)
  const TrendIcon = a.tendance > 0.5 ? TrendingUp : a.tendance < -0.5 ? TrendingDown : Minus
  const trendColor = a.tendance > 0.5 ? "text-emerald-400" : a.tendance < -0.5 ? "text-red-400" : "text-slate-400"

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden"
    >
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left p-4 hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          {/* Left */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="shrink-0 w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
              {rank}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-100 truncate">{a.nom}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <TrendIcon className={`h-3 w-3 shrink-0 ${trendColor}`} />
                <span className={`text-xs font-medium ${trendColor}`}>
                  {a.tendance > 0 ? "+" : ""}{a.tendance.toFixed(1)}% / an
                </span>
                <span className="text-xs text-slate-600">·</span>
                <span className="text-xs text-slate-500">{fmt(a.nb_transactions)} ventes</span>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right hidden sm:block">
              <div className={`text-lg font-semibold tabular-nums ${prixColor(a.prix_m2)}`}>
                {fmt(a.prix_m2)} €/m²
              </div>
              <div className="text-xs text-slate-500">médiane DVF</div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className={`text-sm font-bold ${scoreColor(a.score_marche)}`}>{a.score_marche}</div>
              <div className="text-xs text-slate-600">score</div>
            </div>
            <span className={`shrink-0 inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs font-bold text-white ${dpeBg(a.dpe_dominant)}`}>
              {a.dpe_dominant}
            </span>
            {expanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
          </div>
        </div>

        {/* Mobile price */}
        <div className={`sm:hidden mt-2 text-base font-semibold tabular-nums ${prixColor(a.prix_m2)}`}>
          {fmt(a.prix_m2)} €/m²
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-slate-800/60">
              {/* Score bar */}
              <div className="space-y-3 mt-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Score tension marché</span>
                    <span className={`font-semibold ${scoreColor(a.score_marche)}`}>{a.score_marche}/100</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${a.score_marche}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className={`h-full rounded-full ${scoreBg(a.score_marche)}`}
                    />
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {[
                  { label: "Prix médian/m²", value: `${fmt(a.prix_m2)} €`, color: prixColor(a.prix_m2) },
                  { label: "Délai de vente", value: `~${a.delai_vente} jours`, color: a.delai_vente < 40 ? "text-emerald-400" : a.delai_vente < 60 ? "text-amber-400" : "text-red-400" },
                  { label: "Transactions / 24 mois", value: fmt(a.nb_transactions), color: "text-slate-200" },
                  { label: "DPE dominant", value: `Classe ${a.dpe_dominant}`, color: "text-slate-200" },
                ].map(s => (
                  <div key={s.label} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 space-y-1">
                    <div className="text-xs text-slate-500">{s.label}</div>
                    <div className={`text-sm font-semibold ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <a
                href={`/?adresse=${encodeURIComponent(a.code + " Paris")}`}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-400 hover:bg-blue-500/20 transition-colors"
              >
                <MapPin className="h-3 w-3" />
                Estimer un bien dans ce quartier
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QuartierPage() {
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortKey>("score_marche")
  const [sortAsc, setSortAsc] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  const filtered = ARRONDISSEMENTS
    .filter(a => {
      if (search) return a.nom.toLowerCase().includes(search.toLowerCase()) || a.code.includes(search)
      if (activeFilter === "moins-cher") return a.prix_m2 < 11000
      if (activeFilter === "dynamique") return a.tendance >= 3
      if (activeFilter === "meilleur-dpe") return ["A", "B", "C"].includes(a.dpe_dominant)
      return true
    })
    .sort((a, b) => {
      const v = a[sortBy] < b[sortBy] ? -1 : 1
      return sortAsc ? v : -v
    })

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "score_marche", label: "Score marché" },
    { key: "tendance", label: "Tendance" },
    { key: "prix_m2", label: "Prix/m²" },
    { key: "nb_transactions", label: "Volume" },
    { key: "delai_vente", label: "Délai vente" },
  ]

  const FILTERS = [
    { id: "moins-cher", label: "< 11 000 €/m²" },
    { id: "dynamique", label: "Forte hausse (+3%/an)" },
    { id: "meilleur-dpe", label: "DPE A→C" },
  ]

  // Summary stats
  const prix_median = ARRONDISSEMENTS.map(a => a.prix_m2).sort((a,b) => a-b)[10]
  const best = [...ARRONDISSEMENTS].sort((a,b) => b.score_marche - a.score_marche)[0]
  const most_dynamic = [...ARRONDISSEMENTS].sort((a,b) => b.tendance - a.tendance)[0]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Hero */}
      <section className="relative border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 px-4 py-12">
        <div className="mx-auto max-w-3xl space-y-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">
              <MapPin className="h-3.5 w-3.5" />
              Profils de quartier
            </div>
            <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight">
              Paris — 20 arrondissements
            </h1>
            <p className="mt-2 text-slate-400 text-sm sm:text-base">
              Scores de tension, prix médians DVF, délais de vente — données publiques, sans annonces ni placement payant.
            </p>
          </motion.div>

          {/* Summary cards */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-3 gap-3 pt-2"
          >
            {[
              { label: "Prix médian Paris", value: `${fmt(prix_median)} €/m²`, icon: <BarChart3 className="h-4 w-4 text-blue-400" /> },
              { label: "Quartier le + dynamique", value: most_dynamic.nom.split("—")[0].trim(), icon: <TrendingUp className="h-4 w-4 text-emerald-400" /> },
              { label: "Meilleur score marché", value: best.nom.split("—")[0].trim(), icon: <Zap className="h-4 w-4 text-amber-400" /> },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 space-y-1">
                <div className="flex items-center gap-1.5">{s.icon}<span className="text-xs text-slate-500">{s.label}</span></div>
                <div className="text-sm font-semibold text-slate-100">{s.value}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Controls */}
      <div className="sticky top-14 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 py-3">
        <div className="mx-auto max-w-3xl flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setActiveFilter(null) }}
              placeholder="Rechercher un arrondissement…"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 sm:pb-0">
            {SORT_OPTIONS.map(o => (
              <button
                key={o.key}
                onClick={() => { if (sortBy === o.key) setSortAsc(v => !v); else { setSortBy(o.key); setSortAsc(o.key === "prix_m2" || o.key === "delai_vente") } }}
                className={`shrink-0 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  sortBy === o.key
                    ? "border border-blue-500/40 bg-blue-500/15 text-blue-400"
                    : "border border-slate-700 bg-slate-800/40 text-slate-400 hover:text-slate-200"
                }`}
              >
                {o.label}
                {sortBy === o.key && (sortAsc ? " ↑" : " ↓")}
              </button>
            ))}
          </div>
        </div>

        {/* Filter chips */}
        <div className="mx-auto max-w-3xl flex gap-2 mt-2 overflow-x-auto pb-0.5">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => { setActiveFilter(activeFilter === f.id ? null : f.id); setSearch("") }}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                activeFilter === f.id
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                  : "border-slate-700 bg-slate-800/40 text-slate-500 hover:text-slate-300"
              }`}
            >
              {f.label}
            </button>
          ))}
          {(activeFilter || search) && (
            <button onClick={() => { setActiveFilter(null); setSearch("") }} className="shrink-0 rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-500 hover:text-slate-300">
              Tout afficher
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>{filtered.length} arrondissement{filtered.length > 1 ? "s" : ""}</span>
          <span className="flex items-center gap-1.5">
            <Building2 className="h-3 w-3" />
            Source : DVF · data.gouv.fr
          </span>
        </div>

        {filtered.length === 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-500 text-sm">
            Aucun résultat pour "{search}"
          </div>
        )}

        {filtered.map((a, i) => (
          <ArrondissementCard key={a.code} a={a} rank={i + 1} delay={i * 0.03} />
        ))}
      </div>

      {/* Footer note */}
      <div className="mx-auto max-w-3xl px-4 pb-12">
        <p className="text-xs text-slate-600 border-t border-slate-800 pt-4">
          Données DVF 24 mois glissants · Transactions réelles sans placement payant · Scores calculés par l&apos;algorithme AURESTATE
        </p>
      </div>
    </div>
  )
}
