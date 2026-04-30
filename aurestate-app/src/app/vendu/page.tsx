"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Home, Building2, MapPin, Calendar, TrendingUp, TrendingDown, Eye, SlidersHorizontal, X, ChevronDown } from "lucide-react"

const PHOTOS = [
  "photo-1502672260266-1c1ef2d93688", "photo-1560448204-e02f11c3d0e2",
  "photo-1484154218962-a197022b5858", "photo-1556909114-f6e7ad7d3136",
  "photo-1617098900591-3f90928e8c54", "photo-1545324418-cc1a3fa10c00",
  "photo-1553444836-bc6c8d340d56", "photo-1582268611958-ebfd161ef9cf",
  "photo-1512917774080-9991f1c4c750", "photo-1568605114967-8130f3a36994",
]
const img = (id: number) => `https://images.unsplash.com/${PHOTOS[id % PHOTOS.length]}?w=480&h=280&fit=crop&auto=format`

const TRANSACTIONS = [
  { id: 1, adresse: "14 rue de la Paix", arr: "75001", type: "Appartement", surface: 68, prix: 714000, date: "2024-11-12", pieces: 3, dpe: "C", features: ["Ascenseur", "Gardien"] },
  { id: 2, adresse: "3 avenue Ledru-Rollin", arr: "75011", type: "Appartement", surface: 52, prix: 498000, date: "2024-11-08", pieces: 2, dpe: "D", features: ["Balcon"] },
  { id: 3, adresse: "27 rue Oberkampf", arr: "75011", type: "Appartement", surface: 41, prix: 379000, date: "2024-11-05", pieces: 2, dpe: "E", features: ["Cave"] },
  { id: 4, adresse: "8 rue de la Roquette", arr: "75011", type: "Appartement", surface: 76, prix: 712000, date: "2024-10-29", pieces: 3, dpe: "C", features: ["Balcon", "Cave", "Parking"] },
  { id: 5, adresse: "55 rue du Faubourg Saint-Antoine", arr: "75011", type: "Maison", surface: 110, prix: 1240000, date: "2024-10-25", pieces: 5, dpe: "B", features: ["Jardin", "Parking", "Cave"] },
  { id: 6, adresse: "2 place de la République", arr: "75010", type: "Appartement", surface: 63, prix: 567000, date: "2024-10-22", pieces: 3, dpe: "D", features: ["Ascenseur", "Digicode"] },
  { id: 7, adresse: "18 rue de Lancry", arr: "75010", type: "Appartement", surface: 38, prix: 342000, date: "2024-10-18", pieces: 2, dpe: "E", features: ["Cave"] },
  { id: 8, adresse: "91 quai de Valmy", arr: "75010", type: "Appartement", surface: 55, prix: 539000, date: "2024-10-15", pieces: 2, dpe: "C", features: ["Balcon", "Ascenseur"] },
  { id: 9, adresse: "4 rue Beaubourg", arr: "75003", type: "Appartement", surface: 82, prix: 984000, date: "2024-10-10", pieces: 4, dpe: "B", features: ["Ascenseur", "Gardien", "Cave"] },
  { id: 10, adresse: "16 rue des Archives", arr: "75004", type: "Appartement", surface: 70, prix: 910000, date: "2024-10-07", pieces: 3, dpe: "C", features: ["Ascenseur", "Parking"] },
  { id: 11, adresse: "33 boulevard Voltaire", arr: "75011", type: "Appartement", surface: 47, prix: 432000, date: "2024-10-03", pieces: 2, dpe: "D", features: ["Cave"] },
  { id: 12, adresse: "7 rue de la Fontaine au Roi", arr: "75011", type: "Appartement", surface: 60, prix: 558000, date: "2024-09-30", pieces: 3, dpe: "C", features: ["Balcon", "Cave"] },
  { id: 13, adresse: "22 rue Sedaine", arr: "75011", type: "Appartement", surface: 35, prix: 315000, date: "2024-09-26", pieces: 1, dpe: "F", features: [] },
  { id: 14, adresse: "5 avenue de la République", arr: "75011", type: "Appartement", surface: 88, prix: 836000, date: "2024-09-22", pieces: 4, dpe: "C", features: ["Ascenseur", "Gardien", "Balcon"] },
  { id: 15, adresse: "12 rue Amelot", arr: "75011", type: "Appartement", surface: 54, prix: 513000, date: "2024-09-18", pieces: 2, dpe: "D", features: ["Cave", "Digicode"] },
  { id: 16, adresse: "44 rue du Chemin Vert", arr: "75011", type: "Maison", surface: 95, prix: 1050000, date: "2024-09-14", pieces: 5, dpe: "B", features: ["Jardin", "Parking", "Cave"] },
  { id: 17, adresse: "9 rue des Trois-Bornes", arr: "75011", type: "Appartement", surface: 43, prix: 398000, date: "2024-09-10", pieces: 2, dpe: "E", features: [] },
  { id: 18, adresse: "71 rue Saint-Maur", arr: "75011", type: "Appartement", surface: 66, prix: 609000, date: "2024-09-05", pieces: 3, dpe: "C", features: ["Balcon", "Parking"] },
  { id: 19, adresse: "30 rue de la Folie Méricourt", arr: "75011", type: "Appartement", surface: 79, prix: 742000, date: "2024-09-01", pieces: 3, dpe: "D", features: ["Cave", "Ascenseur"] },
  { id: 20, adresse: "6 rue Keller", arr: "75011", type: "Appartement", surface: 31, prix: 287000, date: "2024-08-28", pieces: 1, dpe: "F", features: [] },
]

const ARRS = ["Tous", "75001", "75003", "75004", "75010", "75011"]
const AVG_M2 = 10850
const FEATURES_EXT = ["Balcon", "Jardin", "Parking", "Cave", "Terrasse"]
const FEATURES_INT = ["Ascenseur", "Gardien", "Digicode", "Interphone", "Parquet"]
const DPE_CLASSES = ["A", "B", "C", "D", "E", "F", "G"]
const PRIX_OPTIONS = [0, 200000, 300000, 400000, 500000, 600000, 700000, 800000, 1000000, 1500000, 2000000]
const PIECES_OPTIONS = [0, 1, 2, 3, 4, 5]

const fmt = (n: number) => n.toLocaleString("fr-FR") + " €"
const fmtDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
const fmtPrix = (n: number) => n === 0 ? "N'importe lequel" : n >= 1000000 ? `${n / 1000000} M€` : `${n / 1000} k€`

type Filters = {
  types: string[]
  prixMin: number; prixMax: number
  piecesMin: number
  dpes: string[]
  features: string[]
}

const DEFAULT_FILTERS: Filters = { types: [], prixMin: 0, prixMax: 0, piecesMin: 0, dpes: [], features: [] }

function FilterModal({ open, onClose, filters, onApply }: {
  open: boolean; onClose: () => void
  filters: Filters; onApply: (f: Filters) => void
}) {
  const [f, setF] = useState<Filters>(filters)

  const toggle = (key: "types" | "dpes" | "features", val: string) => {
    setF(prev => ({
      ...prev,
      [key]: prev[key].includes(val) ? prev[key].filter(x => x !== val) : [...prev[key], val]
    }))
  }

  const activeCount = f.types.length + f.dpes.length + f.features.length +
    (f.prixMin > 0 ? 1 : 0) + (f.prixMax > 0 ? 1 : 0) + (f.piecesMin > 0 ? 1 : 0)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div key="modal"
            initial={{ opacity: 0, y: 40, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
            className="fixed inset-x-4 top-16 bottom-4 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-20 sm:w-[600px] sm:max-h-[80vh] z-50 flex flex-col rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
              <h2 className="text-base font-semibold text-white">Filtres</h2>
              <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">

              {/* Type */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-200">Type de bien</h3>
                <div className="grid grid-cols-2 gap-2">
                  {["Appartement", "Maison"].map(t => (
                    <label key={t} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3 cursor-pointer hover:border-slate-600 transition-colors">
                      <input type="checkbox" checked={f.types.includes(t)} onChange={() => toggle("types", t)}
                        className="w-4 h-4 accent-blue-500 rounded" />
                      <span className="text-sm text-slate-200">{t}</span>
                    </label>
                  ))}
                </div>
              </section>

              <div className="h-px bg-slate-800" />

              {/* Prix */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-200">Prix</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Min", key: "prixMin" as const, val: f.prixMin },
                    { label: "Max", key: "prixMax" as const, val: f.prixMax },
                  ].map(({ label, key, val }) => (
                    <div key={key}>
                      <div className="text-xs text-slate-500 mb-1.5">{label}</div>
                      <div className="relative">
                        <select value={val} onChange={e => setF(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                          className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none pr-8">
                          {PRIX_OPTIONS.map(p => <option key={p} value={p}>{fmtPrix(p)}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="h-px bg-slate-800" />

              {/* Pièces */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-200">Pièces minimum</h3>
                <div className="flex flex-wrap gap-2">
                  {PIECES_OPTIONS.map(p => (
                    <button key={p} onClick={() => setF(prev => ({ ...prev, piecesMin: p }))}
                      className={`rounded-xl px-4 py-2 text-sm font-medium border transition-colors ${f.piecesMin === p ? "bg-blue-600 border-blue-600 text-white" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}>
                      {p === 0 ? "Tous" : `${p}+`}
                    </button>
                  ))}
                </div>
              </section>

              <div className="h-px bg-slate-800" />

              {/* DPE */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-200">Classe DPE</h3>
                <div className="flex flex-wrap gap-2">
                  {DPE_CLASSES.map(d => {
                    const colors: Record<string, string> = { A: "bg-green-600", B: "bg-lime-500", C: "bg-lime-400 text-slate-900", D: "bg-yellow-500 text-slate-900", E: "bg-orange-500", F: "bg-red-500", G: "bg-red-700" }
                    const active = f.dpes.includes(d)
                    return (
                      <button key={d} onClick={() => toggle("dpes", d)}
                        className={`w-10 h-10 rounded-xl text-sm font-bold border-2 transition-all ${active ? `${colors[d]} border-transparent text-white scale-110` : "border-slate-700 text-slate-400 hover:border-slate-500"}`}>
                        {d}
                      </button>
                    )
                  })}
                </div>
              </section>

              <div className="h-px bg-slate-800" />

              {/* Caractéristiques extérieures */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-200">Caractéristiques extérieures</h3>
                <div className="grid grid-cols-2 gap-2">
                  {FEATURES_EXT.map(feat => (
                    <label key={feat} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3 cursor-pointer hover:border-slate-600 transition-colors">
                      <input type="checkbox" checked={f.features.includes(feat)} onChange={() => toggle("features", feat)}
                        className="w-4 h-4 accent-blue-500 rounded" />
                      <span className="text-sm text-slate-200">{feat}</span>
                    </label>
                  ))}
                </div>
              </section>

              <div className="h-px bg-slate-800" />

              {/* Caractéristiques intérieures */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-200">Caractéristiques intérieures</h3>
                <div className="grid grid-cols-2 gap-2">
                  {FEATURES_INT.map(feat => (
                    <label key={feat} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3 cursor-pointer hover:border-slate-600 transition-colors">
                      <input type="checkbox" checked={f.features.includes(feat)} onChange={() => toggle("features", feat)}
                        className="w-4 h-4 accent-blue-500 rounded" />
                      <span className="text-sm text-slate-200">{feat}</span>
                    </label>
                  ))}
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 shrink-0 bg-slate-950">
              <button onClick={() => setF(DEFAULT_FILTERS)} className="text-sm text-slate-400 hover:text-white transition-colors">
                Effacer les filtres
              </button>
              <button onClick={() => { onApply(f); onClose() }}
                className="rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors px-6 py-2.5 text-sm font-semibold text-white">
                Rechercher
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default function VenduPage() {
  const [arrFilter, setArrFilter] = useState("Tous")
  const [modalOpen, setModalOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)

  const activeCount = filters.types.length + filters.dpes.length + filters.features.length +
    (filters.prixMin > 0 ? 1 : 0) + (filters.prixMax > 0 ? 1 : 0) + (filters.piecesMin > 0 ? 1 : 0)

  const filtered = TRANSACTIONS.filter(t => {
    if (arrFilter !== "Tous" && t.arr !== arrFilter) return false
    if (filters.types.length && !filters.types.includes(t.type)) return false
    if (filters.prixMin && t.prix < filters.prixMin) return false
    if (filters.prixMax && t.prix > filters.prixMax) return false
    if (filters.piecesMin && t.pieces < filters.piecesMin) return false
    if (filters.dpes.length && !filters.dpes.includes(t.dpe)) return false
    if (filters.features.length && !filters.features.every(f => t.features.includes(f))) return false
    return true
  })

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <FilterModal open={modalOpen} onClose={() => setModalOpen(false)} filters={filters} onApply={setFilters} />

      {/* Hero */}
      <div className="border-b border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">
              <TrendingUp className="h-4 w-4" />DVF Open Data · DGFIP
            </div>
            <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight">Transactions récentes</h1>
            <p className="mt-2 text-slate-400 text-sm max-w-xl">
              Toutes les ventes issues du fichier DVF public — données DGFIP, aucune estimation, 100&nbsp;% transactions réelles.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="sticky top-14 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap gap-2 items-center">
          {/* Arrdt chips */}
          <span className="text-xs text-slate-500 mr-1">Arrdt :</span>
          {ARRS.map(a => (
            <button key={a} onClick={() => setArrFilter(a)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${arrFilter === a ? "bg-blue-600 text-white" : "border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"}`}>
              {a === "Tous" ? "Tous" : a.slice(2) + "e"}
            </button>
          ))}

          {/* Filter button */}
          <button onClick={() => setModalOpen(true)}
            className={`ml-auto flex items-center gap-2 rounded-xl px-4 py-1.5 text-sm font-medium border transition-colors ${activeCount > 0 ? "bg-blue-600 border-blue-600 text-white" : "border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"}`}>
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtres{activeCount > 0 && <span className="ml-1 rounded-full bg-white/20 px-1.5 text-xs">{activeCount}</span>}
          </button>

          <span className="text-xs text-slate-500">{filtered.length} résultats</span>
        </div>
      </div>

      {/* Cards */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={JSON.stringify(filters) + arrFilter}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((t, i) => {
              const pm2 = Math.round(t.prix / t.surface)
              const delta = pm2 - AVG_M2
              const above = delta > 0
              return (
                <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="group rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden hover:border-slate-600 hover:shadow-xl hover:shadow-black/30 transition-all duration-200 hover:-translate-y-1">
                  <div className="relative h-44 overflow-hidden bg-slate-800">
                    <img src={img(t.id)} alt={`${t.type} ${t.adresse}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className="rounded-full bg-slate-950/80 backdrop-blur-sm border border-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-200">
                        {t.arr.slice(2)}e arrt
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm ${t.type === "Maison" ? "bg-amber-500/90 text-white" : "bg-blue-600/90 text-white"}`}>
                        {t.type}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 flex gap-1.5">
                      <span className="rounded-full bg-emerald-600/90 backdrop-blur-sm px-2 py-0.5 text-xs font-bold text-white">DVF ✓</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold backdrop-blur-sm ${["A","B"].includes(t.dpe) ? "bg-green-600/90" : ["C","D"].includes(t.dpe) ? "bg-yellow-500/90 text-slate-900" : "bg-red-600/90"} text-white`}>
                        DPE {t.dpe}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-200 leading-tight">{t.adresse}, Paris</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      {t.type === "Maison" ? <Home className="h-3.5 w-3.5" /> : <Building2 className="h-3.5 w-3.5" />}
                      {t.surface} m² · {t.pieces} p.
                    </div>
                    {t.features.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {t.features.slice(0, 3).map(f => (
                          <span key={f} className="rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-xs text-slate-400">{f}</span>
                        ))}
                      </div>
                    )}
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
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="h-3.5 w-3.5" />{fmtDate(t.date)}
                      </div>
                      <Link href={`/bien/${t.id}`} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                        <Eye className="h-3.5 w-3.5" />Voir détail
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-20 space-y-3">
            <p className="text-slate-400">Aucune transaction pour ces filtres.</p>
            <button onClick={() => { setFilters(DEFAULT_FILTERS); setArrFilter("Tous") }}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-slate-800 mx-auto max-w-6xl px-4 py-6">
        <p className="text-xs text-slate-600">
          Source : DVF DGFIP / data.gouv.fr · Open data · RGPD compliant
        </p>
      </div>
    </div>
  )
}
