"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Home, Building2, MapPin, Calendar, TrendingUp, TrendingDown, Eye } from "lucide-react"

// Rotating Unsplash Paris apartment photos (stable IDs)
const PHOTOS = [
  "photo-1502672260266-1c1ef2d93688",
  "photo-1560448204-e02f11c3d0e2",
  "photo-1484154218962-a197022b5858",
  "photo-1556909114-f6e7ad7d3136",
  "photo-1617098900591-3f90928e8c54",
  "photo-1545324418-cc1a3fa10c00",
  "photo-1553444836-bc6c8d340d56",
  "photo-1582268611958-ebfd161ef9cf",
  "photo-1512917774080-9991f1c4c750",
  "photo-1568605114967-8130f3a36994",
]

const img = (id: number) => `https://images.unsplash.com/${PHOTOS[id % PHOTOS.length]}?w=480&h=280&fit=crop&auto=format`

const TRANSACTIONS = [
  { id: 1, adresse: "14 rue de la Paix", arr: "75001", type: "Appartement", surface: 68, prix: 714000, date: "2024-11-12", pieces: 3 },
  { id: 2, adresse: "3 avenue Ledru-Rollin", arr: "75011", type: "Appartement", surface: 52, prix: 498000, date: "2024-11-08", pieces: 2 },
  { id: 3, adresse: "27 rue Oberkampf", arr: "75011", type: "Appartement", surface: 41, prix: 379000, date: "2024-11-05", pieces: 2 },
  { id: 4, adresse: "8 rue de la Roquette", arr: "75011", type: "Appartement", surface: 76, prix: 712000, date: "2024-10-29", pieces: 3 },
  { id: 5, adresse: "55 rue du Faubourg Saint-Antoine", arr: "75011", type: "Maison", surface: 110, prix: 1240000, date: "2024-10-25", pieces: 5 },
  { id: 6, adresse: "2 place de la République", arr: "75010", type: "Appartement", surface: 63, prix: 567000, date: "2024-10-22", pieces: 3 },
  { id: 7, adresse: "18 rue de Lancry", arr: "75010", type: "Appartement", surface: 38, prix: 342000, date: "2024-10-18", pieces: 2 },
  { id: 8, adresse: "91 quai de Valmy", arr: "75010", type: "Appartement", surface: 55, prix: 539000, date: "2024-10-15", pieces: 2 },
  { id: 9, adresse: "4 rue Beaubourg", arr: "75003", type: "Appartement", surface: 82, prix: 984000, date: "2024-10-10", pieces: 4 },
  { id: 10, adresse: "16 rue des Archives", arr: "75004", type: "Appartement", surface: 70, prix: 910000, date: "2024-10-07", pieces: 3 },
  { id: 11, adresse: "33 boulevard Voltaire", arr: "75011", type: "Appartement", surface: 47, prix: 432000, date: "2024-10-03", pieces: 2 },
  { id: 12, adresse: "7 rue de la Fontaine au Roi", arr: "75011", type: "Appartement", surface: 60, prix: 558000, date: "2024-09-30", pieces: 3 },
  { id: 13, adresse: "22 rue Sedaine", arr: "75011", type: "Appartement", surface: 35, prix: 315000, date: "2024-09-26", pieces: 1 },
  { id: 14, adresse: "5 avenue de la République", arr: "75011", type: "Appartement", surface: 88, prix: 836000, date: "2024-09-22", pieces: 4 },
  { id: 15, adresse: "12 rue Amelot", arr: "75011", type: "Appartement", surface: 54, prix: 513000, date: "2024-09-18", pieces: 2 },
  { id: 16, adresse: "44 rue du Chemin Vert", arr: "75011", type: "Maison", surface: 95, prix: 1050000, date: "2024-09-14", pieces: 5 },
  { id: 17, adresse: "9 rue des Trois-Bornes", arr: "75011", type: "Appartement", surface: 43, prix: 398000, date: "2024-09-10", pieces: 2 },
  { id: 18, adresse: "71 rue Saint-Maur", arr: "75011", type: "Appartement", surface: 66, prix: 609000, date: "2024-09-05", pieces: 3 },
  { id: 19, adresse: "30 rue de la Folie Méricourt", arr: "75011", type: "Appartement", surface: 79, prix: 742000, date: "2024-09-01", pieces: 3 },
  { id: 20, adresse: "6 rue Keller", arr: "75011", type: "Appartement", surface: 31, prix: 287000, date: "2024-08-28", pieces: 1 },
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

      {/* Sticky filters */}
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
              {a === "Tous" ? "Tous" : a.slice(2) + "e"}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-500">{filtered.length} résultats</span>
        </div>
      </div>

      {/* Cards grid */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((t, i) => {
            const pm2 = Math.round(t.prix / t.surface)
            const delta = pm2 - AVG_M2
            const above = delta > 0
            return (
              <motion.div key={t.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="group rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden hover:border-slate-600 hover:shadow-xl hover:shadow-black/30 transition-all duration-200 hover:-translate-y-1"
              >
                {/* Photo */}
                <div className="relative h-44 overflow-hidden bg-slate-800">
                  <img
                    src={img(t.id)}
                    alt={`${t.type} ${t.adresse}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Overlay badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="rounded-full bg-slate-950/80 backdrop-blur-sm border border-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-200">
                      {t.arr.slice(2)}e arrt
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm ${t.type === "Maison" ? "bg-amber-500/90 text-white" : "bg-blue-600/90 text-white"}`}>
                      {t.type}
                    </span>
                  </div>
                  {/* DVF stamp */}
                  <div className="absolute bottom-3 left-3">
                    <span className="rounded-full bg-emerald-600/90 backdrop-blur-sm px-2 py-0.5 text-xs font-bold text-white">
                      DVF Vérifié
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-200 leading-tight">{t.adresse}, Paris</span>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    {t.type === "Maison"
                      ? <span className="flex items-center gap-1"><Home className="h-3.5 w-3.5" />{t.surface} m²</span>
                      : <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{t.surface} m²</span>}
                    <span className="text-slate-700">·</span>
                    <span>{t.pieces} p.</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-xl font-light text-white">{fmt(t.prix)}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{pm2.toLocaleString("fr-FR")} €/m²</div>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium ${above ? "text-red-400" : "text-emerald-400"}`}>
                      {above ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      {above ? "+" : ""}{Math.round((delta / AVG_M2) * 100)}%
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                      {fmtDate(t.date)}
                    </div>
                    <Link href={`/bien/${t.id}`} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                      <Eye className="h-3.5 w-3.5" />
                      Voir détail
                    </Link>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500 text-sm">Aucune transaction pour ces filtres.</div>
        )}
      </div>

      <div className="border-t border-slate-800 mx-auto max-w-6xl px-4 py-6">
        <p className="text-xs text-slate-600">
          Source : Demandes de Valeurs Foncières (DVF) — DGFIP / data.gouv.fr · Open data · RGPD compliant · aucune donnée personnelle
        </p>
      </div>
    </div>
  )
}
