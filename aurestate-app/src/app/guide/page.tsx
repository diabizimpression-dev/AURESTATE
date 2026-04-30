"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BarChart3, Zap, TrendingUp, Clock, ArrowRight, Database, BookOpen, Home, Euro, ShieldCheck } from "lucide-react"
import Link from "next/link"

const TABS = ["Tous", "Marché", "Achat", "DPE", "Investissement"]

const ARTICLES = [
  {
    icon: BarChart3, cat: "Marché", readTime: "4 min",
    title: "Comment lire un score DVF",
    desc: "Le score DVF agrège les prix au m² des 24 derniers mois dans un rayon de 500 m. Un score élevé = tension forte : le bien se vend vite, proche du prix affiché.",
    img: "photo-1611348586804-61bf6c080437",
  },
  {
    icon: TrendingUp, cat: "Marché", readTime: "5 min",
    title: "Tendances prix Paris 2024",
    desc: "Après deux ans de baisse, les prix se stabilisent à 10 850 €/m² en moyenne. Le 11e et le 19e résistent mieux grâce à une forte demande locative et des prix encore accessibles.",
    img: "photo-1499856871958-5b9627545d1a",
  },
  {
    icon: TrendingUp, cat: "Marché", readTime: "3 min",
    title: "Sous-évalué vs surévalué",
    desc: "Le verdict AURESTATE compare le prix demandé au prix médian DVF réel. Un écart de +8% classe le bien surévalué. En dessous, c'est une opportunité — souvent liée à un DPE dégradé ou une contrainte de vente.",
    img: "photo-1560448204-e02f11c3d0e2",
  },
  {
    icon: Home, cat: "Achat", readTime: "6 min",
    title: "Checklist avant d'acheter",
    desc: "Diagnostics obligatoires, risques de copropriété, charges prévisionnelles : les 12 points à vérifier avant de signer un compromis. Ne négligez jamais le PV d'AG des 3 dernières années.",
    img: "photo-1484154218962-a197022b5858",
  },
  {
    icon: Home, cat: "Achat", readTime: "4 min",
    title: "Négocier le prix avec les données DVF",
    desc: "Présentez les transactions DVF comparables lors de la négociation. Un vendeur ne peut pas contester des données DGFIP publiques. Un écart de 5% justifie toujours une offre en dessous du prix affiché.",
    img: "photo-1502672260266-1c1ef2d93688",
  },
  {
    icon: Zap, cat: "DPE", readTime: "3 min",
    title: "DPE et valeur immobilière",
    desc: "Un bien classé F ou G subit une décote moyenne de 15% par rapport à un équivalent D. Les banques ajustent leur financement et les acheteurs intègrent le coût des travaux dans leur offre.",
    img: "photo-1556909114-f6e7ad7d3136",
  },
  {
    icon: Zap, cat: "DPE", readTime: "4 min",
    title: "Interdiction de louer : calendrier DPE",
    desc: "G interdit depuis 2025, F interdit en 2028, E en 2034. Si vous achetez un bien classé F aujourd'hui, intégrez 30 000–80 000 € de rénovation dans votre plan de financement.",
    img: "photo-1545324418-cc1a3fa10c00",
  },
  {
    icon: Euro, cat: "Investissement", readTime: "5 min",
    title: "Rendement locatif réel à Paris",
    desc: "Le rendement brut moyen à Paris est de 3,5%. Pour dépasser 4%, il faut cibler le 19e, 20e ou 13e. Le cash-flow positif reste difficile sans apport significatif — simulez avant d'acheter.",
    img: "photo-1512917774080-9991f1c4c750",
  },
  {
    icon: ShieldCheck, cat: "Investissement", readTime: "3 min",
    title: "Déficit foncier : économiser l'impôt",
    desc: "Acheter un bien à rénover permet de déduire jusqu'à 10 700 € de déficit foncier par an sur vos revenus globaux. Combiné à un DPE amélioré, c'est la stratégie la plus efficace fiscalement.",
    img: "photo-1617098900591-3f90928e8c54",
  },
]

const STATS = [
  { value: "DPE F/G", label: "-15% de valeur en moyenne", sub: "Impact mesuré · transactions 2023–2024" },
  { value: "DVF", label: "100% transactions réelles", sub: "Source : DGFIP — aucune estimation" },
  { value: "Score > 85", label: "Vente < 35 jours", sub: "Tension élevée · Paris intramuros" },
]

export default function GuidePage() {
  const [tab, setTab] = useState("Tous")

  const articles = tab === "Tous" ? ARTICLES : ARTICLES.filter(a => a.cat === tab)

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">

      {/* Hero */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:py-18">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-semibold tracking-widest uppercase text-blue-400">Ressources</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight mb-2">Guides & Insights</h1>
            <p className="text-slate-400 text-sm max-w-xl">Comprendre le marché immobilier français avec les données DVF publiques.</p>
          </motion.div>
        </div>
      </section>

      {/* Category tabs */}
      <div className="sticky top-14 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 flex gap-1 overflow-x-auto py-2 scrollbar-none">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`relative shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${tab === t ? "text-white" : "text-slate-400 hover:text-slate-200"}`}>
              {tab === t && (
                <motion.div layoutId="tab-bg" className="absolute inset-0 rounded-lg bg-slate-800" style={{ zIndex: -1 }} transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />
              )}
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Articles grid */}
      <section className="mx-auto max-w-5xl px-4 py-10">
        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a, i) => {
              const Icon = a.icon
              return (
                <motion.article key={a.title}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  className="group rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden hover:border-slate-600 hover:shadow-xl hover:shadow-black/20 transition-all duration-200 hover:-translate-y-0.5"
                >
                  {/* Photo */}
                  <div className="relative h-36 overflow-hidden bg-slate-800">
                    <img src={`https://images.unsplash.com/${a.img}?w=480&h=200&fit=crop&auto=format`}
                      alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                    <span className="absolute bottom-3 left-3 rounded-full bg-blue-600/90 backdrop-blur-sm px-2.5 py-0.5 text-xs font-semibold text-white">{a.cat}</span>
                  </div>

                  <div className="p-5 flex flex-col gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5" />{a.readTime}
                    </div>
                    <h2 className="text-sm font-semibold text-white leading-snug">{a.title}</h2>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{a.desc}</p>
                    <Link href="#" className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors mt-auto">
                      Lire <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </motion.article>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Stats strip */}
      <section className="border-y border-slate-800 bg-slate-900/30">
        <div className="mx-auto max-w-5xl px-4 py-10 grid gap-6 sm:grid-cols-3">
          {STATS.map(s => (
            <div key={s.label} className="flex flex-col gap-1 sm:border-r sm:border-slate-800 last:border-0 sm:pr-6">
              <div className="flex items-center gap-2">
                <Database className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-blue-400 tracking-wide uppercase">{s.value}</span>
              </div>
              <p className="text-white font-bold text-lg leading-tight">{s.label}</p>
              <p className="text-xs text-slate-500">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 py-14 text-center">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col items-center gap-4">
          <h2 className="text-xl sm:text-2xl font-light text-white">Prêt à analyser votre bien ?</h2>
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors px-6 py-3 text-sm font-semibold text-white">
            Estimer votre bien <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>
    </main>
  )
}
