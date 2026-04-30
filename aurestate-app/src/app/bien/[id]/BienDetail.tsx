"use client"

import { motion } from "framer-motion"
import { MapPin, Calendar, Ruler, Home, Building2, TrendingUp, TrendingDown, ArrowLeft, ShieldCheck, Zap, BarChart3 } from "lucide-react"
import Link from "next/link"

const PHOTOS_POOL = [
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

const AVG_M2 = 10850
const fmt = (n: number) => n.toLocaleString("fr-FR") + " €"
const fmtDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })

const dpeColor = (d: string) => {
  if (d === "A" || d === "B") return "bg-green-600 text-white"
  if (d === "C") return "bg-lime-500 text-white"
  if (d === "D") return "bg-yellow-500 text-white"
  if (d === "E") return "bg-orange-500 text-white"
  return "bg-red-600 text-white"
}

export type Transaction = {
  id: string; adresse: string; arr: string; type: string; surface: number
  prix: number; date: string; pieces: number; dpe: string; etage: number
}

export function BienDetail({ t, similaires }: { t: Transaction; similaires: Transaction[] }) {
  const idx = parseInt(t.id) - 1
  const pm2 = Math.round(t.prix / t.surface)
  const delta = pm2 - AVG_M2
  const above = delta > 0
  const photos = [0, 1, 2, 3].map(offset => PHOTOS_POOL[(idx + offset) % PHOTOS_POOL.length])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/vendu" className="flex items-center gap-1 hover:text-slate-300 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />Transactions
          </Link>
          <span>/</span>
          <span className="text-slate-300">{t.adresse}, Paris {t.arr.slice(2)}e</span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-10 space-y-8 lg:space-y-0">

          {/* Left */}
          <div className="space-y-6">
            {/* Gallery */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden">
              <div className="col-span-2 h-64 sm:h-80 overflow-hidden">
                <img src={`https://images.unsplash.com/${photos[0]}?w=900&h=500&fit=crop&auto=format`}
                  alt="Photo principale" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
              {photos.slice(1).map((p, i) => (
                <div key={i} className="h-32 sm:h-40 overflow-hidden">
                  <img src={`https://images.unsplash.com/${p}?w=400&h=300&fit=crop&auto=format`}
                    alt={`Photo ${i + 2}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
              ))}
            </motion.div>

            {/* Title */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.type === "Maison" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-blue-500/20 text-blue-400 border border-blue-500/30"}`}>
                  {t.type}
                </span>
                <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-400 border border-slate-700">Paris {t.arr.slice(2)}e arrondissement</span>
                <span className="rounded-full bg-emerald-900/40 px-2.5 py-0.5 text-xs text-emerald-400 border border-emerald-800/40">DVF Vérifié</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-light text-white">{t.adresse}</h1>
              <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                <MapPin className="h-4 w-4" />Paris {t.arr.slice(2)}e · {fmtDate(t.date)}
              </div>
            </motion.div>

            {/* Specs */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Ruler, label: "Surface", value: `${t.surface} m²` },
                { icon: t.type === "Maison" ? Home : Building2, label: "Type", value: t.type },
                { icon: Home, label: t.type === "Maison" ? "Niveaux" : "Étage", value: t.etage === 0 ? "RDC" : `${t.etage}e` },
                { icon: Calendar, label: "Pièces", value: `${t.pieces} pièces` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500"><Icon className="h-3.5 w-3.5" />{label}</div>
                  <div className="text-sm font-semibold text-slate-200">{value}</div>
                </div>
              ))}
            </motion.div>

            {/* Scores */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-400" />Analyse AURESTATE
              </h2>
              {[
                { label: "Localisation", value: 75 + (idx % 20) },
                { label: "Tension marché", value: 80 + (idx % 15) },
                { label: "Liquidité", value: 70 + (idx % 25) },
              ].map(s => (
                <div key={s.label} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">{s.label}</span>
                    <span className="text-slate-400 tabular-nums">{s.value}/100</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${s.value}%` }}
                      transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
                      className="h-full rounded-full bg-blue-500" />
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Similaires */}
            {similaires.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Transactions similaires</h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  {similaires.map(s => (
                    <Link key={s.id} href={`/bien/${s.id}`}
                      className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden hover:border-slate-600 transition-colors group">
                      <div className="h-24 overflow-hidden">
                        <img src={`https://images.unsplash.com/${PHOTOS_POOL[(parseInt(s.id) - 1) % PHOTOS_POOL.length]}?w=300&h=160&fit=crop&auto=format`}
                          alt={s.adresse} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      </div>
                      <div className="p-3 space-y-1">
                        <div className="text-xs text-slate-200 font-medium truncate">{s.adresse}</div>
                        <div className="text-xs text-slate-400">{s.surface} m² · {fmt(s.prix)}</div>
                        <div className="text-xs text-slate-500">{Math.round(s.prix / s.surface).toLocaleString("fr-FR")} €/m²</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right — sticky */}
          <div className="lg:sticky lg:top-20 lg:self-start space-y-4">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-5">
              <div>
                <div className="text-3xl font-light text-white">{fmt(t.prix)}</div>
                <div className="text-slate-400 text-sm mt-0.5">{pm2.toLocaleString("fr-FR")} €/m²</div>
              </div>

              <div className={`flex items-center gap-2 rounded-xl p-3 ${above ? "bg-red-950/40 border border-red-800/30" : "bg-emerald-950/40 border border-emerald-800/30"}`}>
                {above ? <TrendingUp className="h-4 w-4 text-red-400" /> : <TrendingDown className="h-4 w-4 text-emerald-400" />}
                <div>
                  <div className={`text-sm font-semibold ${above ? "text-red-400" : "text-emerald-400"}`}>
                    {above ? "+" : ""}{Math.round((delta / AVG_M2) * 100)}% vs moyenne Paris
                  </div>
                  <div className="text-xs text-slate-500">Moy. Paris : {AVG_M2.toLocaleString("fr-FR")} €/m²</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Classe DPE</span>
                <span className={`rounded-lg px-3 py-1 text-sm font-bold ${dpeColor(t.dpe)}`}>{t.dpe}</span>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-slate-800/60 p-3">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <div className="text-xs text-slate-400">Transaction enregistrée au fichier <span className="text-slate-200 font-medium">DVF DGFIP</span> — données publiques officielles</div>
              </div>

              <Link href="/" className="flex items-center justify-center gap-2 w-full rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors py-3 text-sm font-semibold text-white">
                <Zap className="h-4 w-4" />Estimer un bien similaire
              </Link>
              <Link href="/vendu" className="flex items-center justify-center text-xs text-slate-500 hover:text-slate-300 transition-colors">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />Voir toutes les transactions
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Infos DVF</div>
              {[
                { label: "Date de vente", value: fmtDate(t.date) },
                { label: "Référence", value: `DVF-${t.arr}-${t.id.padStart(4, "0")}` },
                { label: "Source", value: "DGFIP / data.gouv.fr" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-slate-300 font-medium">{value}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
