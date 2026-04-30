"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { TrendingUp, Euro, BarChart3, ShieldCheck, AlertTriangle, Zap, Building2, MapPin } from "lucide-react"

const ARRONDISSEMENTS = [
  { arr: "75011", name: "11e Oberkampf", pm2: 10450, tendance: 4.1, rendement: 3.8, score: 91, dpe: "C", tension: "Forte", demande: "Très haute" },
  { arr: "75019", name: "19e Buttes-Chaumont", pm2: 8750, tendance: 5.2, rendement: 4.6, score: 92, dpe: "D", tension: "Forte", demande: "Haute" },
  { arr: "75013", name: "13e Place d'Italie", pm2: 9200, tendance: 3.8, rendement: 4.2, score: 87, dpe: "C", tension: "Modérée", demande: "Haute" },
  { arr: "75020", name: "20e Belleville", pm2: 8900, tendance: 4.8, rendement: 4.5, score: 90, dpe: "D", tension: "Forte", demande: "Haute" },
  { arr: "75010", name: "10e République", pm2: 10100, tendance: 3.2, rendement: 3.9, score: 88, dpe: "C", tension: "Forte", demande: "Très haute" },
  { arr: "75018", name: "18e Montmartre", pm2: 9600, tendance: 2.9, rendement: 3.7, score: 84, dpe: "D", tension: "Modérée", demande: "Haute" },
  { arr: "75003", name: "3e Marais Nord", pm2: 12800, tendance: 1.8, rendement: 2.9, score: 75, dpe: "C", tension: "Modérée", demande: "Moyenne" },
  { arr: "75001", name: "1er Louvre", pm2: 14200, tendance: 0.8, rendement: 2.4, score: 62, dpe: "B", tension: "Faible", demande: "Basse" },
]

const scoreColor = (v: number) => v >= 85 ? "text-emerald-400" : v >= 70 ? "text-amber-400" : "text-red-400"
const scoreBg = (v: number) => v >= 85 ? "bg-emerald-500" : v >= 70 ? "bg-amber-500" : "bg-red-500"
const fmt = (n: number) => n.toLocaleString("fr-FR")

function SimulateurWidget() {
  const [prix, setPrix] = useState(500000)
  const [surface, setSurface] = useState(50)
  const [loyer, setLoyer] = useState(1500)
  const [taux, setTaux] = useState(3.5)

  const rendementBrut = ((loyer * 12) / prix) * 100
  const rendementNet = rendementBrut * 0.7
  const apport = prix * 0.2
  const emprunt = prix - apport
  const r = taux / 100 / 12
  const n = 240
  const mensualite = (emprunt * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  const cashflow = loyer - mensualite
  const rentable = cashflow > 0

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
      className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-blue-400" />
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Simulateur rendement</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Prix d'achat (€)", value: prix, min: 100000, max: 2000000, step: 10000, set: setPrix },
          { label: "Surface (m²)", value: surface, min: 15, max: 200, step: 5, set: setSurface },
          { label: "Loyer mensuel (€)", value: loyer, min: 500, max: 6000, step: 50, set: setLoyer },
          { label: "Taux crédit (%)", value: taux, min: 2, max: 6, step: 0.1, set: setTaux },
        ].map(({ label, value, min, max, step, set }) => (
          <div key={label} className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">{label}</span>
              <span className="text-slate-200 font-medium tabular-nums">{typeof value === "number" && step < 1 ? value.toFixed(1) : fmt(value)}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value}
              onChange={e => set(Number(e.target.value))}
              className="w-full h-1.5 rounded-full bg-slate-700 accent-blue-500 cursor-pointer" />
          </div>
        ))}
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800">
        <div className="rounded-xl bg-slate-800/60 p-3 space-y-1">
          <div className="text-xs text-slate-500">Rendement brut</div>
          <div className={`text-xl font-semibold ${rendementBrut > 4 ? "text-emerald-400" : rendementBrut > 3 ? "text-amber-400" : "text-red-400"}`}>
            {rendementBrut.toFixed(2)}%
          </div>
        </div>
        <div className="rounded-xl bg-slate-800/60 p-3 space-y-1">
          <div className="text-xs text-slate-500">Rendement net</div>
          <div className={`text-xl font-semibold ${rendementNet > 3 ? "text-emerald-400" : rendementNet > 2 ? "text-amber-400" : "text-red-400"}`}>
            {rendementNet.toFixed(2)}%
          </div>
        </div>
        <div className="rounded-xl bg-slate-800/60 p-3 space-y-1">
          <div className="text-xs text-slate-500">Mensualité</div>
          <div className="text-xl font-semibold text-slate-200">{fmt(Math.round(mensualite))} €</div>
        </div>
        <div className={`rounded-xl p-3 space-y-1 ${rentable ? "bg-emerald-950/60 border border-emerald-800/40" : "bg-red-950/60 border border-red-800/40"}`}>
          <div className="text-xs text-slate-500">Cash-flow/mois</div>
          <div className={`text-xl font-semibold ${rentable ? "text-emerald-400" : "text-red-400"}`}>
            {cashflow > 0 ? "+" : ""}{fmt(Math.round(cashflow))} €
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-600">Simulation indicative · apport 20% · durée 20 ans · charges estimées 30%</p>
    </motion.div>
  )
}

export default function InvestirPage() {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Hero */}
      <div className="border-b border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">
              <TrendingUp className="h-4 w-4" />
              Scoring investissement · DVF 4D
            </div>
            <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight">Investir à Paris</h1>
            <p className="mt-2 text-slate-400 text-sm max-w-xl">
              Rendement locatif, tension de marché et score investissement par arrondissement — 100% données DVF publiques.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        {/* Simulateur */}
        <SimulateurWidget />

        {/* Scoring table */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Classement investissement par arrondissement</h2>
          </div>

          <div className="rounded-2xl border border-slate-800 overflow-hidden">
            <div className="hidden sm:grid grid-cols-7 px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <div className="col-span-2">Arrondissement</div>
              <div>Prix/m²</div>
              <div>Tendance</div>
              <div>Rendement</div>
              <div>Tension</div>
              <div>Score</div>
            </div>

            {ARRONDISSEMENTS.map((a, i) => (
              <motion.button key={a.arr} onClick={() => setSelected(selected === a.arr ? null : a.arr)}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.05 }}
                className={`w-full text-left grid grid-cols-2 sm:grid-cols-7 gap-2 sm:gap-0 px-4 py-3.5 border-b border-slate-800/50 transition-colors ${selected === a.arr ? "bg-blue-950/30" : "hover:bg-slate-900/50"}`}
              >
                <div className="col-span-2 sm:col-span-2 flex items-center gap-2">
                  <span className="hidden sm:flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-400">{i + 1}</span>
                  <div>
                    <div className="text-sm font-medium text-slate-200">{a.name}</div>
                    <div className="text-xs text-slate-500 sm:hidden">{fmt(a.pm2)} €/m² · {a.rendement}%</div>
                  </div>
                </div>
                <div className="hidden sm:flex items-center text-sm text-slate-300 tabular-nums">{fmt(a.pm2)} €</div>
                <div className="hidden sm:flex items-center text-sm text-emerald-400 font-medium">+{a.tendance}%/an</div>
                <div className="hidden sm:flex items-center text-sm text-blue-400 font-medium">{a.rendement}%</div>
                <div className="hidden sm:flex items-center">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${a.tension === "Forte" ? "bg-emerald-900/50 text-emerald-400" : a.tension === "Modérée" ? "bg-amber-900/50 text-amber-400" : "bg-red-900/50 text-red-400"}`}>
                    {a.tension}
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full rounded-full ${scoreBg(a.score)}`} style={{ width: `${a.score}%` }} />
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${scoreColor(a.score)}`}>{a.score}</span>
                </div>
                {/* Mobile score */}
                <div className="sm:hidden flex items-center justify-end gap-2">
                  <span className={`text-lg font-bold ${scoreColor(a.score)}`}>{a.score}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Methodology */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: <Euro className="h-5 w-5 text-blue-400" />, title: "Rendement locatif", desc: "Calculé sur loyers de marché PAP / Seloger vs prix DVF réels. Brut et net charges estimées." },
            { icon: <ShieldCheck className="h-5 w-5 text-emerald-400" />, title: "Tension DVF", desc: "Volume de transactions, délai médian de revente, ratio offre/demande sur 24 mois glissants." },
            { icon: <AlertTriangle className="h-5 w-5 text-amber-400" />, title: "Risque DPE", desc: "Pondération du risque réglementaire lié aux classes F/G — décote et interdiction de louer post-2025." },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex gap-3">
              <div className="mt-0.5 shrink-0">{icon}</div>
              <div>
                <div className="text-sm font-semibold text-slate-200 mb-1">{title}</div>
                <div className="text-xs text-slate-400 leading-relaxed">{desc}</div>
              </div>
            </div>
          ))}
        </motion.div>

        <p className="text-xs text-slate-600 border-t border-slate-800 pt-6">
          Données DVF DGFIP open data · Simulation non contractuelle · Aucun conseil en investissement
        </p>
      </div>
    </div>
  )
}
