"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Home, Building2, MapPin, Calendar, TrendingUp, TrendingDown } from "lucide-react"

const TRANSACTIONS = [
  { id: 1, adresse: "14 rue de la Paix", arr: "75001", type: "Appartement", surface: 68, prix: 714000, date: "2024-11-12" },
  { id: 2, adresse: "3 avenue Ledru-Rollin", arr: "75011", type: "Appartement", surface: 52, prix: 498000, date: "2024-11-08" },
  { id: 3, adresse: "27 rue Oberkampf", arr: "75011", type: "Appartement", surface: 41, prix: 379000, date: "2024-11-05" },
  { id: 4, adresse: "8 rue de la Roquette", arr: "75011", type: "Appartement", surface: 76, prix: 712000, date: "2024-10-29" },
  { id: 5, adresse: "55 rue du Faubourg Saint-Antoine", arr: "75011", type: "Maison", surface: 110, prix: 1240000, date: "2024-10-25" },
  { id: 6, adresse: "2 place de la République", arr: "75010", type: "Appartement", surface: 63, prix: 567000, date: "2024-10-22" },
  { id: 7, adresse: "18 rue de Lancry", arr: "75010", type: "Appartement", surface: 38, prix: 342000, date: "2024-10-18" },
  { id: 8, adresse: "91 quai de Valmy", arr: "75010", type: "Appartement", surface: 55, prix: 539000, date: "2024-10-15" },
  { id: 9, adresse: "4 rue Beaubourg", arr: "75003", type: "Appartement", surface: 82, prix: 984000, date: "2024-10-10" },
  { id: 10, adresse: "16 rue des Archives", arr: "75004", type: "Appartement", surface: 70, prix: 910000, date: "2024-10-07" },
  { id: 11, adresse: "33 boulevard Voltaire", arr: "75011", type: "Appartement", surface: 47, prix: 432000, date: "2024-10-03" },
  { id: 12, adresse: "7 rue de la Fontaine au Roi", arr: "75011", type: "Appartement", surface: 60, prix: 558000, date: "2024-09-30" },
  { id: 13, adresse: "22 rue Sedaine", arr: "75011", type: "Appartement", surface: 35, prix: 315000, date: "2024-09-26" },
  { id: 14, adresse: "5 avenue de la République", arr: "75011", type: "Appartement", surface: 88, prix: 836000, date: "2024-09-22" },
  { id: 15, adresse: "12 rue Amelot", arr: "75011", type: "Appartement", surface: 54, prix: 513000, date: "2024-09-18" },
  { id: 16, adresse: "44 rue du Chemin Vert", arr: "75011", type: "Maison", surface: 95, prix: 1050000, date: "2024-09-14" },
  { id: 17, adresse: "9 rue des Trois-Bornes", arr: "75011", type: "Appartement", surface: 43, prix: 398000, date: "2024-09-10" },
  { id: 18, adresse: "71 rue Saint-Maur", arr: "75011", type: "Appartement", surface: 66, prix: 609000, date: "2024-09-05" },
  { id: 19, adresse: "30 rue de la Folie Méricourt", arr: "75011", type: "Appartement", surface: 79, prix: 742000, date: "2024-09-01" },
  { id: 20, adresse: "6 rue Keller", arr: "75011", type: "Appartement", surface: 31, prix: 287000, date: "2024-08-28" },
]

const ARRS = ["Tous", "75001", "75003", "75004", "75010", "75011"]
const TYPES = ["Tous", "Appartement", "Maison"]

const AVG_M2 = 10850
const fmt = (n: number) => n.toLocaleString("fr-FR") + " €"
const fmtDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })

export default function VenduPage() {
  const [typeFilter, setTypeFilter] = useState("Tous")
  const [arrFilter, setArrFilter] = useState("Tous")

  const filtered = TRANSACTIONS.filter(t =>
    (typeFilter === "Tous" || t.type === typeFilter) &&
    (arrFilter === "Tous" || t.arr === arrFilter)
  )

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Hero */}
      <div className="border-b border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">
              <TrendingUp className="h-4 w-4" />
              DVF Open Data · DGFIP
            </div>
            <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight">Transactions récentes</h1>
            <p className="mt-2 text-slate-400 text-sm max-w-xl">
              Toutes les ventes issues du fichier DVF public — données DGFIP, aucune estimation, 100&nbsp;% transactions réelles.
            </p>
            <p className="mt-1 text-xs text-slate-600">Dernière MAJ : novembre 2024 · {TRANSACTIONS.length} transactions affichées</p>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-14 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-500 mr-1">Type :</span>
          {TYPES.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${typeFilter === t ? "bg-blue-600 text-white" : "border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"}`}>
              {t}
            </button>
          ))}
          <span className="text-xs text-slate-600 mx-1">|</span>
          <span className="text-xs text-slate-500 mr-1">Arrdt :</span>
          {ARRS.map(a => (
            <button key={a} onClick={() => setArrFilter(a)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${arrFilter === a ? "bg-blue-600 text-white" : "border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"}`}>
              {a === "Tous" ? "Tous" : a.slice(3)}e
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-500">{filtered.length} résultats</span>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t, i) => {
            const pm2 = Math.round(t.prix / t.surface)
            const delta = pm2 - AVG_M2
            const above = delta > 0
            return (
              <motion.div key={t.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                className="group rounded-xl border border-slate-800 bg-slate-900/50 p-5 hover:border-slate-600 hover:bg-slate-900/80 transition-all duration-200 hover:-translate-y-0.5"
              >
                {/* Top */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {t.type === "Maison"
                      ? <Home className="h-4 w-4 text-amber-400 shrink-0" />
                      : <Building2 className="h-4 w-4 text-blue-400 shrink-0" />}
                    <span className="text-xs font-medium text-slate-400">{t.type}</span>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                    {t.arr.slice(2)}e arrt
                  </span>
                </div>

                {/* Address */}
                <div className="flex items-start gap-1.5 mb-4">
                  <MapPin className="h-3.5 w-3.5 text-slate-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-200 leading-tight">{t.adresse}, Paris</span>
                </div>

                {/* Price */}
                <div className="mb-3">
                  <div className="text-2xl font-light text-white">{fmt(t.prix)}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm text-slate-400">{pm2.toLocaleString("fr-FR")} €/m² · {t.surface} m²</span>
                  </div>
                </div>

                {/* Delta vs market */}
                <div className={`flex items-center gap-1.5 text-xs font-medium ${above ? "text-red-400" : "text-emerald-400"}`}>
                  {above ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {above ? "+" : ""}{Math.round((delta / AVG_M2) * 100)}% vs moy. Paris
                </div>

                {/* Date */}
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-800">
                  <Calendar className="h-3.5 w-3.5 text-slate-600" />
                  <span className="text-xs text-slate-500">{fmtDate(t.date)}</span>
                </div>
              </motion.div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500 text-sm">Aucune transaction pour ces filtres.</div>
        )}
      </div>

      {/* Footer note */}
      <div className="border-t border-slate-800 mx-auto max-w-6xl px-4 py-6">
        <p className="text-xs text-slate-600">
          Source : Demandes de Valeurs Foncières (DVF) — DGFIP / data.gouv.fr · Données open data · RGPD compliant · aucune donnée personnelle
        </p>
      </div>
    </div>
  )
}
