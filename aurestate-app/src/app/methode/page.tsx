"use client"

import { motion } from "framer-motion"
import {
  MapPin,
  Search,
  BarChart3,
  TrendingUp,
  Droplets,
  Zap,
  Database,
  Shield,
  AlertTriangle,
  ExternalLink,
} from "lucide-react"
import type { Metadata } from "next"

// Metadata export is ignored in client components but kept for reference;
// for static export we set it in a server wrapper if needed.
// Since this is output:export, metadata here won't be tree-shaken — we
// handle it via generateMetadata in a separate server page if required.
// For now a simple title suffix is enough as the root layout sets the base title.

// ─── Types ─────────────────────────────────────────────────────────────────────

interface StepProps {
  number: number
  title: string
  description: string
  icon: React.ReactNode
  delay: number
}

interface ScoreCardProps {
  title: string
  weight: string
  description: string
  detail: string
  color: string
  delay: number
}

interface SourceRowProps {
  name: string
  org: string
  url: string
  description: string
  delay: number
}

interface LimitItemProps {
  text: string
  detail: string
  delay: number
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionTitle({
  children,
  subtitle,
  delay = 0,
}: {
  children: React.ReactNode
  subtitle?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="mb-8"
    >
      <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-white">
        {children}
      </h2>
      {subtitle && (
        <p className="mt-2 text-slate-400 text-base">{subtitle}</p>
      )}
    </motion.div>
  )
}

function Step({ number, title, description, icon, delay }: StepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className="flex gap-4 items-start"
    >
      <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full border border-blue-500/40 bg-blue-500/10 text-blue-400">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-blue-400 tabular-nums">
            {String(number).padStart(2, "0")}
          </span>
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        </div>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
    </motion.div>
  )
}

function ScoreCard({
  title,
  weight,
  description,
  detail,
  color,
  delay,
}: ScoreCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold text-white ${color}`}
        >
          {weight}
        </span>
      </div>
      <p className="text-sm text-slate-400">{description}</p>
      <p className="text-xs text-slate-500 border-t border-slate-800 pt-3">
        {detail}
      </p>
    </motion.div>
  )
}

function SourceRow({ name, org, url, description, delay }: SourceRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay }}
      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-4 border-b border-slate-800 last:border-0"
    >
      <div className="sm:w-40 flex-shrink-0">
        <span className="text-sm font-semibold text-slate-200">{name}</span>
        <div className="text-xs text-slate-500">{org}</div>
      </div>
      <div className="flex-1 text-sm text-slate-400">{description}</div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors flex-shrink-0"
      >
        {url.replace("https://", "")}
        <ExternalLink className="h-3 w-3" />
      </a>
    </motion.div>
  )
}

function LimitItem({ text, detail, delay }: LimitItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay }}
      className="flex gap-3 items-start"
    >
      <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
      <div>
        <span className="text-sm font-medium text-slate-200">{text}</span>
        <p className="text-xs text-slate-500 mt-0.5">{detail}</p>
      </div>
    </motion.div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function MethodePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Hero */}
      <section className="relative px-4 py-16 sm:py-24 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute left-1/3 top-0 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-3"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 inline-block" />
              Transparence totale
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-4xl sm:text-5xl font-light tracking-tight text-white"
          >
            Méthodologie
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-slate-400 text-base sm:text-lg max-w-xl"
          >
            Pas d&apos;algorithme opaque. Chaque estimation est traçable et
            auditable.
          </motion.p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 pb-20 space-y-20">
        {/* Section 1: Comment ça marche */}
        <section>
          <SectionTitle subtitle="Trois étapes, toutes vérifiables.">
            Comment fonctionne AURESTATE&nbsp;?
          </SectionTitle>

          <div className="space-y-6">
            <Step
              number={1}
              title="Géocodage adresse"
              description="L'adresse saisie est résolue en coordonnées GPS (latitude/longitude) via l'API Adresse officielle de data.gouv.fr. Le score de confiance du géocodage est retourné dans chaque réponse."
              icon={<MapPin className="h-4 w-4" />}
              delay={0.05}
            />
            <Step
              number={2}
              title="Recherche de comparables DVF"
              description="Les transactions immobilières réelles (Demandes de Valeurs Foncières) dans un rayon de 500 m et sur les 24 derniers mois sont extraites depuis les données publiques de la DGFIP. Seules les mutations du même type de bien sont retenues."
              icon={<Search className="h-4 w-4" />}
              delay={0.1}
            />
            <Step
              number={3}
              title="Scoring 4D explicable"
              description="Quatre scores indépendants sont calculés et pondérés pour produire un score global de 0 à 100. Chaque score est visible dans la réponse avec son poids et sa valeur brute — aucune boîte noire."
              icon={<BarChart3 className="h-4 w-4" />}
              delay={0.15}
            />
          </div>
        </section>

        {/* Section 2: Les 4 scores */}
        <section>
          <SectionTitle subtitle="Quatre dimensions pondérées pour un score global transparent.">
            Les 4 scores
          </SectionTitle>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ScoreCard
              title="Valeur marché"
              weight="40%"
              description="Compare le prix du bien avec la médiane locale des transactions similaires sur 24 mois."
              detail="Score élevé = prix inférieur à la médiane (opportunité). Score faible = prix supérieur au marché."
              color="bg-blue-600"
              delay={0.05}
            />
            <ScoreCard
              title="Tension locale"
              weight="30%"
              description="Mesure le volume de transactions dans le secteur comme proxy de la demande immobilière."
              detail="Un secteur avec peu de transactions indique une faible liquidité ou un marché atone."
              color="bg-violet-600"
              delay={0.1}
            />
            <ScoreCard
              title="Liquidité"
              weight="20%"
              description="Nombre de comparables disponibles dans le rayon de 500 m sur 24 mois."
              detail="Plus il y a de comparables, plus l'estimation est fiable et la revente prévisible."
              color="bg-emerald-600"
              delay={0.15}
            />
            <ScoreCard
              title="Risque énergétique"
              weight="10%"
              description="Pénalité appliquée selon la classe DPE estimée du bien (de A à G)."
              detail="DPE A/B → pénalité nulle. DPE F/G → forte pénalité liée aux risques réglementaires et de valeur."
              color="bg-amber-600"
              delay={0.2}
            />
          </div>
        </section>

        {/* Section 3: Sources de données */}
        <section>
          <SectionTitle subtitle="Toutes les sources sont publiques, gratuites et accessibles à tous.">
            Sources de données
          </SectionTitle>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-5 divide-y divide-slate-800">
            <SourceRow
              name="DVF"
              org="DGFIP — data.gouv.fr"
              url="https://data.gouv.fr"
              description="Demandes de Valeurs Foncières — toutes les transactions immobilières françaises enregistrées depuis 2019."
              delay={0.05}
            />
            <SourceRow
              name="DPE"
              org="ADEME — data.ademe.fr"
              url="https://data.ademe.fr"
              description="Diagnostics de Performance Énergétique — classe et consommation énergétique par logement."
              delay={0.1}
            />
            <SourceRow
              name="Géocodage"
              org="Etalab — data.gouv.fr"
              url="https://api-adresse.data.gouv.fr"
              description="API Adresse officielle de la Base Adresse Nationale (BAN) pour la résolution d'adresses en coordonnées GPS."
              delay={0.15}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-4 flex gap-3 items-start rounded-xl border border-slate-700/60 bg-slate-800/30 p-4"
          >
            <Shield className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-sm font-medium text-slate-200">
                RGPD
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Un audit log horodaté est conservé pour chaque requête
                d&apos;estimation (adresse, surface, type). Aucune donnée
                personnelle identifiante n&apos;est stockée — seules les
                données nécessaires à la traçabilité réglementaire sont
                conservées.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Section 4: Limites */}
        <section>
          <SectionTitle subtitle="Nous préférons l'honnêteté à la fausse précision.">
            Limites actuelles
          </SectionTitle>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-5">
            <LimitItem
              text="Couverture géographique : Paris 75"
              detail="L'API et les données DVF sont actuellement optimisées pour Paris intra-muros. L'extension aux autres départements est planifiée."
              delay={0.05}
            />
            <LimitItem
              text="Fenêtre temporelle : 24 derniers mois"
              detail="Seules les transactions des 24 mois précédant la requête sont analysées. Les cycles longs du marché immobilier ne sont pas capturés."
              delay={0.1}
            />
            <LimitItem
              text="DPE : approximation par proximité géographique"
              detail="En l'absence de DPE connu pour le bien exact, la classe énergétique est estimée par interpolation sur les DPE disponibles dans le même code postal et la même période."
              delay={0.15}
            />
          </div>
        </section>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center space-y-4 pt-4 border-t border-slate-800"
        >
          <p className="text-slate-400 text-sm">
            Prêt à tester avec vos propres données&nbsp;?
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <TrendingUp className="h-4 w-4" />
            Faire une estimation
          </a>
        </motion.div>
      </div>
    </div>
  )
}
