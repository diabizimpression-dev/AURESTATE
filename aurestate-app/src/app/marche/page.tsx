"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  TrendingUp, TrendingDown, BarChart3, Activity,
  ArrowRight, Database, Calendar, Timer,
} from "lucide-react"
import Link from "next/link"

// ─── Static Data ──────────────────────────────────────────────────────────────

const SUMMARY_STATS = [
  {
    label: "Prix médian Paris",
    value: "10 850 €/m²",
    tendency: "-1.2% vs 2023",
    trendUp: false,
    icon: BarChart3,
  },
  {
    label: "Volume transactions",
    value: "14 247 ventes",
    tendency: "24 derniers mois",
    trendUp: null,
    icon: Activity,
  },
  {
    label: "Délai moyen vente",
    value: "47 jours",
    tendency: "Paris intramuros",
    trendUp: null,
    icon: Timer,
  },
]

// 12-month price data: Sept 2024 → Aug 2025 (approx, high → low with variation)
const CHART_POINTS = [
  11480, 11320, 11550, 11200, 11400, 11180,
  11050, 10980, 11100, 10820, 10900, 10850,
]

const TOP_5 = [
  { arr: "11e — Popincourt", prix: "11 800 €/m²", tendance: "+3.8%", score: 90, up: true },
  { arr: "19e — Buttes-Chaumont", prix: "9 500 €/m²", tendance: "+4.8%", score: 92, up: true },
  { arr: "10e — Entrepôt", prix: "11 200 €/m²", tendance: "+4.1%", score: 88, up: true },
  { arr: "20e — Ménilmontant", prix: "9 800 €/m²", tendance: "+4.2%", score: 91, up: true },
  { arr: "12e — Reuilly", prix: "10 800 €/m²", tendance: "+3.5%", score: 87, up: true },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreBg(v: number): string {
  if (v >= 90) return "bg-emerald-500"
  if (v >= 85) return "bg-emerald-400"
  if (v >= 70) return "bg-amber-500"
  return "bg-red-500"
}

function scoreText(v: number): string {
  if (v >= 85) return "text-emerald-400"
  if (v >= 70) return "text-amber-400"
  return "text-red-400"
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────

function TrendChart() {
  const W = 800
  const H = 160
  const PAD = { top: 16, right: 20, bottom: 32, left: 52 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const min = Math.min(...CHART_POINTS) - 100
  const max = Math.max(...CHART_POINTS) + 100
  const range = max - min

  const pts = CHART_POINTS.map((v, i) => ({
    x: PAD.left + (i / (CHART_POINTS.length - 1)) * innerW,
    y: PAD.top + innerH - ((v - min) / range) * innerH,
  }))

  const linePath = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ")

  const areaPath =
    linePath +
    ` L ${pts[pts.length - 1].x.toFixed(1)} ${(PAD.top + innerH).toFixed(1)}` +
    ` L ${pts[0].x.toFixed(1)} ${(PAD.top + innerH).toFixed(1)} Z`

  const months = ["Sep", "Oct", "Nov", "Déc", "Jan", "Fév", "Mar", "Avr", "Mai", "Jui", "Juil", "Aoû"]

  // Y-axis labels (3 ticks)
  const yTicks = [min + range * 0.1, min + range * 0.5, min + range * 0.9].map((v) => ({
    v: Math.round(v / 50) * 50,
    y: PAD.top + innerH - ((v - min) / range) * innerH,
  }))

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      aria-label="Évolution du prix médian au m² sur 12 mois"
      role="img"
    >
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Grid lines */}
      {yTicks.map((t) => (
        <line
          key={t.v}
          x1={PAD.left}
          y1={t.y}
          x2={PAD.left + innerW}
          y2={t.y}
          stroke="#1e293b"
          strokeWidth="1"
        />
      ))}

      {/* Y-axis labels */}
      {yTicks.map((t) => (
        <text
          key={`yl-${t.v}`}
          x={PAD.left - 6}
          y={t.y + 4}
          textAnchor="end"
          fontSize="10"
          fill="#64748b"
        >
          {(t.v / 1000).toFixed(1)}k
        </text>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#areaGrad)" />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke="#2563eb"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
      />

      {/* Data points */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#2563eb" />
      ))}

      {/* First and last value labels */}
      <text x={pts[0].x} y={pts[0].y - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">
        11 480
      </text>
      <text
        x={pts[pts.length - 1].x}
        y={pts[pts.length - 1].y - 8}
        textAnchor="middle"
        fontSize="10"
        fill="#60a5fa"
        fontWeight="600"
      >
        10 850
      </text>

      {/* X-axis labels */}
      {pts.map((p, i) => (
        <text
          key={`xl-${i}`}
          x={p.x}
          y={PAD.top + innerH + 18}
          textAnchor="middle"
          fontSize="10"
          fill="#475569"
        >
          {months[i]}
        </text>
      ))}
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MarchePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="border-b border-slate-800">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-medium tracking-widest uppercase text-blue-400">
                Temps réel
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
              Baromètre Paris
            </h1>
            <p className="text-slate-400 text-base sm:text-lg">
              Données DVF temps réel — 20 arrondissements
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Market Summary ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          <AnimatePresence>
            {SUMMARY_STATS.map((stat, i) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.08 }}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="rounded-lg bg-blue-600/15 border border-blue-600/20 p-2">
                      <Icon className="h-4 w-4 text-blue-400" />
                    </div>
                    {stat.trendUp !== null && (
                      <div
                        className={[
                          "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                          stat.trendUp
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                            : "bg-red-500/10 border border-red-500/20 text-red-400",
                        ].join(" ")}
                      >
                        {stat.trendUp ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {stat.tendency}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white leading-tight">{stat.value}</p>
                    <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
                    {stat.trendUp === null && (
                      <p className="text-xs text-slate-500 mt-0.5">{stat.tendency}</p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </section>

      {/* ── Trend Chart ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-10 sm:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.28 }}
          className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6"
        >
          {/* Chart header */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Évolution prix médian — Paris
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Sept 2024 – Aoû 2025 · €/m²</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Calendar className="h-3.5 w-3.5 text-blue-400" />
              <span>12 mois glissants</span>
            </div>
          </div>

          {/* SVG chart */}
          <div className="overflow-x-auto">
            <div className="min-w-[400px]">
              <TrendChart />
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800">
            <div className="h-0.5 w-6 rounded-full bg-blue-600" />
            <span className="text-xs text-slate-500">Prix médian DVF (€/m²)</span>
          </div>
        </motion.div>
      </section>

      {/* ── Top 5 Arrondissements Table ─────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-10 sm:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.38 }}
          className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden"
        >
          {/* Table header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">
              Top 5 arrondissements — Score de tension
            </h2>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-4 gap-3 px-5 py-2.5 border-b border-slate-800/60 bg-slate-900/80">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Arrondissement
            </span>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide text-right">
              Prix/m²
            </span>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide text-right">
              Tendance
            </span>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide text-right">
              Score
            </span>
          </div>

          {/* Rows */}
          <AnimatePresence>
            {TOP_5.map((row, i) => (
              <motion.div
                key={row.arr}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.42 + i * 0.06 }}
                className="grid grid-cols-4 gap-3 items-center px-5 py-4 border-b border-slate-800/40 last:border-0 hover:bg-slate-800/20 transition-colors"
              >
                {/* Arrondissement */}
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-300">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-white leading-tight">{row.arr}</span>
                </div>

                {/* Prix */}
                <span className="text-sm font-semibold text-slate-200 text-right">
                  {row.prix}
                </span>

                {/* Tendance */}
                <div className="flex items-center justify-end gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-400">{row.tendance}</span>
                </div>

                {/* Score */}
                <div className="flex items-center justify-end gap-2">
                  <div className="flex-1 max-w-[48px] h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${scoreBg(row.score)}`}
                      style={{ width: `${row.score}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${scoreText(row.score)}`}>
                    {row.score}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* ── Bottom CTA ──────────────────────────────────────────────────────── */}
      <section className="border-t border-slate-800 bg-slate-900/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 sm:py-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.55 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
          >
            <div>
              <h2 className="text-xl font-bold text-white mb-1.5">
                Explorer les quartiers en détail
              </h2>
              <p className="text-sm text-slate-400 max-w-md">
                Comparez les 20 arrondissements de Paris — prix, tendances, DPE, délai de vente — et trouvez les opportunités de marché.
              </p>
            </div>
            <Link
              href="/quartier"
              className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors px-6 py-3 text-sm font-semibold text-white whitespace-nowrap"
            >
              Explorer les quartiers
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* Data badge */}
          <div className="mt-8 flex items-center gap-2 text-xs text-slate-600">
            <Database className="h-3.5 w-3.5 text-blue-900" />
            <span>Données DVF · Direction Générale des Finances Publiques · Open Data</span>
          </div>
        </div>
      </section>
    </main>
  )
}
