"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MapPin, Home, Ruler, Loader2, TrendingUp, TrendingDown,
  BarChart3, Building2, Calculator, Minus, ArrowUp, ArrowDown,
} from "lucide-react"
import {
  fetchEstimation,
  type EstimationRequest,
  type EstimationResponse,
  type Comparable,
} from "@/lib/api"

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatCurrency(n: number, compact = false): string {
  if (compact && n >= 1000000)
    return (n / 1000000).toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + " M€"
  if (compact && n >= 1000)
    return (n / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " k€"
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n)
}

function formatDateFr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "…" : str
}

function confidenceColor(c: number): string {
  if (c > 0.7) return "text-emerald-400 bg-emerald-400/10 border-emerald-500/30"
  if (c > 0.4) return "text-amber-400 bg-amber-400/10 border-amber-500/30"
  return "text-red-400 bg-red-400/10 border-red-500/30"
}

function dpeBadgeColor(cl: string): string {
  if (cl === "A" || cl === "B") return "bg-green-600"
  if (cl === "C" || cl === "D") return "bg-yellow-500"
  if (cl === "E") return "bg-orange-500"
  return "bg-red-600"
}

function scoreColor(v: number): string {
  if (v > 70) return "bg-emerald-500"
  if (v > 50) return "bg-amber-500"
  return "bg-red-500"
}

function monthlyPayment(principal: number, annualRate: number, years: number): number {
  const r = annualRate / 12
  const n = years * 12
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PriceCard({
  label, total, perM2, accent, delay,
}: { label: string; total: number; perM2: number; accent?: boolean; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`flex flex-col gap-2 rounded-xl border p-5 ${accent
        ? "border-blue-500/50 bg-blue-500/10 ring-1 ring-blue-500/20"
        : "border-slate-800 bg-slate-900/60"}`}
    >
      <span className={`text-xs font-semibold tracking-widest uppercase ${accent ? "text-blue-400" : "text-slate-500"}`}>
        {label}
      </span>
      <span className={`font-light leading-none ${accent ? "text-3xl text-white" : "text-2xl text-slate-200"}`}>
        {formatCurrency(total)}
      </span>
      <span className="text-sm text-slate-500">{formatCurrency(perM2)}&nbsp;/&nbsp;m²</span>
    </motion.div>
  )
}

function PriceRangeBar({
  min, median, max, delay,
}: { min: number; median: number; max: number; delay: number }) {
  const pct = ((median - min) / (max - min)) * 100

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      className="space-y-2"
    >
      <div className="relative h-2 rounded-full bg-slate-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 0.6, delay: delay + 0.1 }}
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-slate-600 via-blue-500 to-slate-600"
        />
        <motion.div
          initial={{ left: `${pct}%`, opacity: 0 }}
          animate={{ left: `${pct}%`, opacity: 1 }}
          transition={{ delay: delay + 0.4 }}
          className="absolute -top-1 h-4 w-1 -translate-x-1/2 rounded-full bg-white shadow-lg"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>{formatCurrency(min, true)}</span>
        <span className="text-blue-400 font-medium">↑ {formatCurrency(median, true)} médiane</span>
        <span>{formatCurrency(max, true)}</span>
      </div>
    </motion.div>
  )
}

function ScoreBar({
  label, value, weight, delay,
}: { label: string; value: number; weight: number; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex flex-col gap-1.5"
    >
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="tabular-nums text-slate-400">
          {value.toFixed(1)}&nbsp;<span className="text-slate-600">/ 100</span>
          <span className="ml-2 text-xs text-slate-600">(poids&nbsp;{(weight * 100).toFixed(0)}%)</span>
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, delay: delay + 0.1, ease: "easeOut" }}
          className={`h-full rounded-full ${scoreColor(value)}`}
        />
      </div>
    </motion.div>
  )
}

function GlobalScoreRing({ value, delay }: { value: number; delay: number }) {
  const r = 36, circ = 2 * Math.PI * r, dash = (value / 100) * circ
  const color = value > 70 ? "#10b981" : value > 50 ? "#f59e0b" : "#ef4444"

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center gap-2"
    >
      <div className="relative flex items-center justify-center">
        <svg width={88} height={88} viewBox="0 0 88 88" className="-rotate-90">
          <circle cx={44} cy={44} r={r} fill="none" stroke="#1e293b" strokeWidth={8} />
          <motion.circle
            cx={44} cy={44} r={r} fill="none" stroke={color} strokeWidth={8}
            strokeLinecap="round" strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 0.9, delay: delay + 0.1, ease: "easeOut" }}
          />
        </svg>
        <span className="absolute text-xl font-semibold text-white">{value.toFixed(0)}</span>
      </div>
      <span className="text-sm text-slate-400">Score global</span>
    </motion.div>
  )
}

function VerdictIA({
  fourchette, scores, dpe_classe, confidence,
}: {
  fourchette: EstimationResponse["fourchette"]
  scores: EstimationResponse["scores"]
  dpe_classe?: string | null
  confidence: number
}) {
  const tension = scores.marche.value
  const valeur = scores.localisation.value

  // Verdict: compare valeur score to neutral 75 baseline
  const delta = Math.round((75 - valeur) * 0.5)
  const isUnder = valeur >= 75
  const isOver = valeur < 55
  const verdictLabel = isUnder ? "Sous-évalué" : isOver ? "Surévalué" : "Correctement valorisé"
  const verdictColor = isUnder ? "text-emerald-400" : isOver ? "text-red-400" : "text-blue-400"
  const verdictBorder = isUnder ? "border-emerald-500/30 bg-emerald-500/5" : isOver ? "border-red-500/30 bg-red-500/5" : "border-blue-500/30 bg-blue-500/5"
  const deltaLabel = isUnder
    ? `~${Math.abs(delta)}% sous le marché local`
    : isOver
    ? `~${Math.abs(delta)}% au-dessus du marché`
    : "En ligne avec le marché local"

  // Resale time from tension
  const resale = tension > 80 ? "~30 jours" : tension > 65 ? "~45 jours" : tension > 50 ? "~60 jours" : "> 90 jours"
  const resaleColor = tension > 80 ? "text-emerald-400" : tension > 60 ? "text-amber-400" : "text-red-400"

  // DPE risk
  const dpeRisk = !dpe_classe ? "Inconnu" : ["A","B"].includes(dpe_classe) ? "Faible" : ["C","D"].includes(dpe_classe) ? "Modéré" : "Fort"
  const dpeRiskColor = !dpe_classe ? "text-slate-400" : ["A","B"].includes(dpe_classe) ? "text-emerald-400" : ["C","D"].includes(dpe_classe) ? "text-amber-400" : "text-red-400"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-xl border p-6 space-y-4 ${verdictBorder}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Verdict IA</div>
          <div className={`text-2xl font-semibold ${verdictColor}`}>{verdictLabel}</div>
          <div className="text-sm text-slate-400 mt-1">{deltaLabel}</div>
        </div>
        <span className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${confidenceColor(confidence)}`}>
          Confiance {(confidence * 100).toFixed(0)}%
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-1 border-t border-slate-800">
        <div className="space-y-1">
          <div className="text-xs text-slate-500">Temps de revente estimé</div>
          <div className={`text-sm font-semibold ${resaleColor}`}>{resale}</div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-slate-500">Risque DPE</div>
          <div className={`text-sm font-semibold ${dpeRiskColor}`}>{dpeRisk}</div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-slate-500">Fourchette indicative</div>
          <div className="text-sm font-semibold text-slate-300">
            {formatCurrency(fourchette.prix_m2_min, true)} – {formatCurrency(fourchette.prix_m2_max, true)}/m²
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function MarketPulse({
  scores, nbComparables, delay,
}: { scores: EstimationResponse["scores"]; nbComparables: number; delay: number }) {
  const tension = scores.marche.value
  const tendance = tension > 75 ? "hausse" : tension > 50 ? "stable" : "baisse"
  const delaiVente = tension > 80 ? "~30 j" : tension > 65 ? "~45 j" : tension > 50 ? "~60 j" : "> 90 j"
  const activite = nbComparables >= 15 ? "Élevée" : nbComparables >= 7 ? "Modérée" : "Faible"
  const activiteColor = nbComparables >= 15 ? "text-emerald-400" : nbComparables >= 7 ? "text-amber-400" : "text-red-400"

  const TrendIcon = tendance === "hausse" ? ArrowUp : tendance === "baisse" ? ArrowDown : Minus
  const trendColor = tendance === "hausse" ? "text-emerald-400" : tendance === "baisse" ? "text-red-400" : "text-slate-400"

  const stats = [
    { label: "Tendance marché", value: tendance.charAt(0).toUpperCase() + tendance.slice(1), icon: <TrendIcon className={`h-3.5 w-3.5 ${trendColor}`} />, color: trendColor },
    { label: "Activité du secteur", value: activite, icon: <BarChart3 className={`h-3.5 w-3.5 ${activiteColor}`} />, color: activiteColor },
    { label: "Délai de vente estimé", value: delaiVente, icon: <TrendingUp className="h-3.5 w-3.5 text-blue-400" />, color: "text-blue-400" },
    { label: "Transactions analysées", value: `${nbComparables} ventes`, icon: <Building2 className="h-3.5 w-3.5 text-slate-400" />, color: "text-slate-300" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4"
    >
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-blue-400" />
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          Pouls du marché local
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">{s.icon}{s.label}</div>
            <div className={`text-sm font-semibold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function MortgageCalc({
  medianPrice, delay,
}: { medianPrice: number; delay: number }) {
  const [apport, setApport] = useState(20)
  const [duree, setDuree] = useState(20)
  const TAUX = 0.038

  const principal = medianPrice * (1 - apport / 100)
  const mensualite = monthlyPayment(principal, TAUX, duree)
  const coutTotal = mensualite * duree * 12
  const coutCredit = coutTotal - principal

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-5"
    >
      <div className="flex items-center gap-2">
        <Calculator className="h-4 w-4 text-blue-400" />
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          Simulation financement
        </h2>
        <span className="ml-auto text-xs text-slate-500">Taux indicatif : {(TAUX * 100).toFixed(1)}%</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Apport personnel</span>
            <span className="font-medium text-white">{apport}% — {formatCurrency(medianPrice * apport / 100, true)}</span>
          </div>
          <input
            type="range" min={5} max={50} step={5} value={apport}
            onChange={(e) => setApport(+e.target.value)}
            className="w-full accent-blue-500 h-1.5"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Durée du prêt</span>
            <span className="font-medium text-white">{duree} ans</span>
          </div>
          <input
            type="range" min={10} max={30} step={5} value={duree}
            onChange={(e) => setDuree(+e.target.value)}
            className="w-full accent-blue-500 h-1.5"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-1">
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3.5 text-center space-y-1">
          <div className="text-xs text-slate-500">Mensualité</div>
          <div className="text-lg font-semibold text-blue-400">{formatCurrency(mensualite, true)}/mois</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3.5 text-center space-y-1">
          <div className="text-xs text-slate-500">Montant emprunté</div>
          <div className="text-lg font-semibold text-slate-200">{formatCurrency(principal, true)}</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3.5 text-center space-y-1">
          <div className="text-xs text-slate-500">Coût du crédit</div>
          <div className="text-lg font-semibold text-slate-400">{formatCurrency(coutCredit, true)}</div>
        </div>
      </div>

      <p className="text-xs text-slate-600">
        Simulation indicative. Taux fixe 3,8% hors assurance. Consultez un courtier pour une offre personnalisée.
      </p>
    </motion.div>
  )
}

function ComparablesTable({
  comparables, delay,
}: { comparables: Comparable[]; delay: number }) {
  const sorted = [...comparables].sort((a, b) => a.distance_metres - b.distance_metres).slice(0, 5)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="overflow-x-auto"
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800">
            {["Adresse", "Surface", "Prix/m²", "Distance", "Date"].map((h, i) => (
              <th key={h} className={`py-2 ${i === 0 ? "pr-4 text-left" : "px-4 text-right"} text-xs font-medium text-slate-500 uppercase tracking-wider`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((c, i) => (
            <tr key={c.id} className={`border-b border-slate-800/50 ${i % 2 === 0 ? "bg-slate-900/20" : ""}`}>
              <td className="py-2.5 pr-4 text-slate-300">{truncate(c.adresse || c.commune, 32)}</td>
              <td className="py-2.5 px-4 text-right tabular-nums text-slate-400">{c.surface_reelle_bati}&nbsp;m²</td>
              <td className="py-2.5 px-4 text-right tabular-nums text-slate-300">{formatCurrency(c.prix_m2)}</td>
              <td className="py-2.5 px-4 text-right tabular-nums text-slate-400">
                {c.distance_metres < 1000 ? `${c.distance_metres.toFixed(0)} m` : `${(c.distance_metres / 1000).toFixed(1)} km`}
              </td>
              <td className="py-2.5 pl-4 text-right text-slate-500">{formatDateFr(c.date_mutation)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  )
}

function DpeBadge({ classe, conso, delay }: { classe: string; conso?: number | null; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="inline-flex items-center gap-2"
    >
      <span className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-bold text-white ${dpeBadgeColor(classe)}`}>
        {classe}
      </span>
      <span className="text-sm text-slate-300">
        DPE&nbsp;: {classe}
        {conso != null && <span className="text-slate-400">&nbsp;·&nbsp;{Math.round(conso)}&nbsp;kWh/m²/an</span>}
      </span>
    </motion.div>
  )
}

function ResultsSection({ data }: { data: EstimationResponse }) {
  const { fourchette, scores, confidence, nb_comparables, comparables, dpe_classe, dpe_conso } = data

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-3xl mx-auto space-y-6 pb-12"
    >
      {/* 0: Verdict IA */}
      <VerdictIA fourchette={fourchette} scores={scores} dpe_classe={dpe_classe} confidence={confidence} />

      {/* A: Fourchette + barre de prix */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Fourchette de prix</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${confidenceColor(confidence)}`}>
              Confiance&nbsp;: {(confidence * 100).toFixed(0)}%
            </span>
            <span className="text-xs text-slate-500">{nb_comparables} transactions comparables</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <PriceCard label="Min" total={fourchette.min} perM2={fourchette.prix_m2_min} delay={0.05} />
          <PriceCard label="Médiane" total={fourchette.median} perM2={fourchette.prix_m2_median} accent delay={0.1} />
          <PriceCard label="Max" total={fourchette.max} perM2={fourchette.prix_m2_max} delay={0.15} />
        </div>

        <PriceRangeBar min={fourchette.min} median={fourchette.median} max={fourchette.max} delay={0.2} />

        {dpe_classe && (
          <div className="pt-1 border-t border-slate-800">
            <DpeBadge classe={dpe_classe} conso={dpe_conso} delay={0.25} />
          </div>
        )}
      </div>

      {/* B: Pouls du marché */}
      <MarketPulse scores={scores} nbComparables={nb_comparables} delay={0.1} />

      {/* C: Simulateur prêt */}
      <MortgageCalc medianPrice={fourchette.median} delay={0.15} />

      {/* D: Scores 4D */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Scores 4D</h2>
        </div>
        <div className="space-y-4">
          <ScoreBar label={scores.localisation.label} value={scores.localisation.value} weight={scores.localisation.weight} delay={0.1} />
          <ScoreBar label={scores.marche.label} value={scores.marche.value} weight={scores.marche.weight} delay={0.15} />
          <ScoreBar label={scores.bien.label} value={scores.bien.value} weight={scores.bien.weight} delay={0.2} />
          <ScoreBar label={scores.dpe.label} value={scores.dpe.value} weight={scores.dpe.weight} delay={0.25} />
        </div>
        <div className="flex justify-center pt-2">
          <GlobalScoreRing value={scores.global} delay={0.35} />
        </div>
      </div>

      {/* E: Comparables */}
      {comparables && comparables.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Transactions comparables</h2>
          </div>
          <ComparablesTable comparables={comparables} delay={0.1} />
        </div>
      )}
    </motion.section>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [adresse, setAdresse] = useState("")
  const [typeLocal, setTypeLocal] = useState<"Appartement" | "Maison">("Appartement")
  const [surface, setSurface] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<EstimationResponse | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  function handleDemo() {
    setError(null)
    setResult({
      request_id: "demo",
      adresse_geocodee: "10 rue de Rivoli, 75001 Paris",
      latitude: 48.8566, longitude: 2.3522, geocoding_score: 0.98,
      fourchette: { min: 487500, median: 610000, max: 742500, prix_m2_min: 7500, prix_m2_median: 9385, prix_m2_max: 11423 },
      scores: {
        localisation: { label: "Valeur marché", value: 78.5, weight: 0.4 },
        marche: { label: "Tension locale", value: 92.0, weight: 0.3 },
        bien: { label: "Liquidité", value: 80.0, weight: 0.2 },
        dpe: { label: "Risque énergétique", value: 75.0, weight: 0.1 },
        global: 82.6,
      },
      confidence: 0.87, nb_comparables: 17,
      dpe_classe: "C", dpe_conso: 178,
      comparables: [
        { id: "1", adresse: "8 rue de Rivoli", commune: "Paris", date_mutation: "2024-03-15", type_local: "Appartement", surface_reelle_bati: 63, valeur_fonciere: 598000, prix_m2: 9492, distance_metres: 45 },
        { id: "2", adresse: "14 rue de Rivoli", commune: "Paris", date_mutation: "2024-01-22", type_local: "Appartement", surface_reelle_bati: 71, valeur_fonciere: 645000, prix_m2: 9085, distance_metres: 112 },
        { id: "3", adresse: "3 rue du Louvre", commune: "Paris", date_mutation: "2023-11-08", type_local: "Appartement", surface_reelle_bati: 58, valeur_fonciere: 562000, prix_m2: 9690, distance_metres: 198 },
        { id: "4", adresse: "21 rue Saint-Honoré", commune: "Paris", date_mutation: "2024-02-14", type_local: "Appartement", surface_reelle_bati: 69, valeur_fonciere: 598000, prix_m2: 8667, distance_metres: 287 },
        { id: "5", adresse: "5 rue du Pont-Neuf", commune: "Paris", date_mutation: "2023-12-03", type_local: "Appartement", surface_reelle_bati: 55, valeur_fonciere: 534000, prix_m2: 9709, distance_metres: 342 },
      ],
    })
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const surfaceNum = parseFloat(surface)
    if (!adresse.trim()) { setError("Veuillez saisir une adresse."); return }
    if (isNaN(surfaceNum) || surfaceNum <= 0) { setError("Veuillez saisir une surface valide."); return }
    setLoading(true); setResult(null)
    try {
      const data = await fetchEstimation({ adresse: adresse.trim(), type_local: typeLocal, surface_bati: surfaceNum } as EstimationRequest)
      setResult(data)
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.")
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-4 py-20 sm:py-28 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl" />
        </div>

        <div className="relative w-full max-w-2xl flex flex-col items-center gap-6">
          <motion.span
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-400"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 inline-block" />
            Données DVF&nbsp;·&nbsp;France métropolitaine&nbsp;·&nbsp;Open Data
          </motion.span>

          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
            className="text-center"
          >
            <h1 className="text-5xl sm:text-6xl font-light tracking-tight text-white">AURESTATE</h1>
            <p className="mt-3 text-slate-400 text-base sm:text-lg">Votre assistant décisionnel immobilier — données réelles, scores explicables</p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            onSubmit={handleSubmit} className="w-full mt-2 space-y-3"
          >
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text" value={adresse} onChange={(e) => setAdresse(e.target.value)}
                placeholder="10 rue de Rivoli, 75001 Paris"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/60 py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30"
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Home className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <select
                  value={typeLocal} onChange={(e) => setTypeLocal(e.target.value as "Appartement" | "Maison")}
                  className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-800/60 py-3 pl-10 pr-4 text-sm text-slate-100 outline-none transition focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30"
                >
                  <option value="Appartement">Appartement</option>
                  <option value="Maison">Maison</option>
                </select>
              </div>
              <div className="relative flex-1">
                <Ruler className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="number" value={surface} onChange={(e) => setSurface(e.target.value)}
                  placeholder="65" min={1} step={0.5}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/60 py-3 pl-10 pr-12 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30"
                  required
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500">m²</span>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p key="error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400"
                >{error}</motion.p>
              )}
            </AnimatePresence>

            <button type="button" onClick={handleDemo}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/40 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
            >
              Voir la démo — Paris 1er (sans backend)
            </button>

            <button type="submit" disabled={loading}
              className="relative w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} className="inline-flex">
                    <Loader2 className="h-4 w-4" />
                  </motion.span>
                  Estimation en cours…
                </span>
              ) : "Estimer"}
            </button>
          </motion.form>
        </div>
      </section>

      {/* Results */}
      <div ref={resultsRef}>
        <AnimatePresence>
          {result && (
            <section className="px-4 py-6">
              <ResultsSection data={result} />
            </section>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 py-6 px-4">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <span>AURESTATE&nbsp;·&nbsp;Données DVF publiques&nbsp;·&nbsp;RGPD compliant</span>
          <a href="/docs" className="text-slate-500 hover:text-slate-300 transition-colors">API Docs</a>
        </div>
      </footer>
    </div>
  )
}
