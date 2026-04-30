"use client"

import { motion, AnimatePresence } from "framer-motion"
import { BarChart3, Zap, TrendingUp, Clock, ArrowRight, Database, BookOpen } from "lucide-react"
import Link from "next/link"

// ─── Data ─────────────────────────────────────────────────────────────────────

const GUIDES = [
  {
    icon: BarChart3,
    title: "Comment lire un score DVF",
    description:
      "Le score DVF est calculé à partir des transactions enregistrées par la Direction Générale des Finances Publiques — ce sont les seules données 100 % réelles du marché immobilier français. Chaque score AURESTATE agrège les prix au m² des 24 derniers mois dans un rayon de 500 m autour du bien. Un score élevé indique une tension forte : le bien se vend vite et proche du prix affiché.",
    readTime: "4 min",
    tag: "Données",
  },
  {
    icon: Zap,
    title: "DPE et valeur immobilière",
    description:
      "Le Diagnostic de Performance Énergétique influe directement sur le prix de vente depuis la réforme de 2021 : un bien classé F ou G subit en moyenne une décote de 15 % par rapport à un équivalent D. Les acheteurs intègrent désormais le coût des travaux de rénovation dans leur offre, et les banques ajustent leur financement en conséquence. Suivre l'évolution du DPE dominant dans un arrondissement permet d'anticiper les réévaluations à venir.",
    readTime: "3 min",
    tag: "Performance",
  },
  {
    icon: TrendingUp,
    title: "Sous-évalué vs surévalué",
    description:
      "Le verdict AURESTATE compare le prix demandé au prix médian DVF réel observé sur des biens comparables dans le même périmètre géographique. Un écart positif de plus de 8 % classe le bien comme surévalué — cela signifie que le vendeur anticipe une négociation ou ignore les données de marché actuelles. À l'inverse, un écart négatif signale une opportunité à saisir rapidement, souvent due à une contrainte de vente ou un DPE dégradé déjà intégré au prix.",
    readTime: "5 min",
    tag: "Analyse",
  },
]

const STATS = [
  {
    value: "DPE F/G",
    label: "-15% de valeur en moyenne",
    sub: "Impact mesuré sur transactions 2023–2024",
  },
  {
    value: "DVF",
    label: "100% transactions réelles",
    sub: "Source : Direction Générale des Finances Publiques",
  },
  {
    value: "Score > 85",
    label: "Vente < 35 jours",
    sub: "Tension marché élevée — Paris intramuros",
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-medium tracking-widest uppercase text-blue-400">
                Ressources
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
              Guides &amp; Insights
            </h1>
            <p className="text-slate-400 text-base sm:text-lg max-w-xl">
              Comprendre le marché immobilier français
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Guide Cards ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {GUIDES.map((guide, i) => {
              const Icon = guide.icon
              return (
                <motion.article
                  key={guide.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.08 }}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col gap-4 group hover:border-slate-700 transition-colors"
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-shrink-0 rounded-lg bg-blue-600/15 border border-blue-600/20 p-2.5">
                      <Icon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-slate-800 border border-slate-700 px-2.5 py-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span className="text-xs text-slate-400 font-medium">{guide.readTime}</span>
                    </div>
                  </div>

                  {/* Tag */}
                  <span className="inline-flex w-fit rounded-full bg-blue-600/10 border border-blue-600/20 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                    {guide.tag}
                  </span>

                  {/* Content */}
                  <div className="flex-1">
                    <h2 className="text-base font-semibold text-white mb-2 leading-snug">
                      {guide.title}
                    </h2>
                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-5">
                      {guide.description}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="pt-1">
                    <Link
                      href="#"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors group-hover:gap-2"
                    >
                      Lire
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </motion.article>
              )
            })}
          </AnimatePresence>
        </div>
      </section>

      {/* ── Data Insight Strip ───────────────────────────────────────────────── */}
      <section className="border-y border-slate-800 bg-slate-900/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="grid gap-6 sm:grid-cols-3"
          >
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                className="flex flex-col gap-1 sm:border-r sm:border-slate-800 last:border-0 sm:pr-6 last:pr-0"
              >
                <div className="flex items-center gap-2">
                  <Database className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                  <span className="text-xs text-blue-400 font-semibold tracking-wide uppercase">
                    {stat.value}
                  </span>
                </div>
                <p className="text-white font-bold text-lg leading-tight">{stat.label}</p>
                <p className="text-xs text-slate-500">{stat.sub}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-14 sm:py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="flex flex-col items-center gap-5"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Prêt à analyser votre bien ?
          </h2>
          <p className="text-slate-400 text-sm max-w-md">
            Obtenez une estimation fondée sur les données DVF réelles, avec score de tension et verdict de valorisation.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors px-6 py-3 text-sm font-semibold text-white"
          >
            Estimer votre bien
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>
    </main>
  )
}
