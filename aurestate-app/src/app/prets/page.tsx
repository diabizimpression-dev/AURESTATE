"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Calculator, TrendingDown, ShieldCheck, ArrowRight, RefreshCw,
  Euro, Clock, BarChart3, ChevronDown, ChevronUp, Zap, CheckCircle2,
  Info,
} from "lucide-react"
import Link from "next/link"

const fmt = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €"
const fmtPct = (n: number) => n.toFixed(2).replace(".", ",") + " %"

function monthlyPayment(principal: number, annualRate: number, years: number): number {
  if (annualRate === 0) return principal / (years * 12)
  const r = annualRate / 100 / 12
  const n = years * 12
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

const BANKS = [
  {
    id: "bnp", nom: "BNP Paribas", logo: "BNP", color: "#00965e",
    taux: 3.45, dureeMax: 25, apportMin: 10,
    points: ["Accompagnement personnalisé", "Offre réponse en 48h", "Rachat de crédit inclus"],
    desc: "Leader historique, fort réseau d'agences, idéal pour les primo-accédants.",
    badge: "Meilleur taux 20 ans",
  },
  {
    id: "ca", nom: "Crédit Agricole", logo: "CA", color: "#008a00",
    taux: 3.52, dureeMax: 25, apportMin: 10,
    points: ["Prêt à taux zéro éligible", "Assurance groupe compétitive", "Réseau mutualiste"],
    desc: "Banque mutualiste, très présente en régions. Offres DPE avantageuses.",
    badge: "Meilleur pour DPE A/B",
  },
  {
    id: "sg", nom: "Société Générale", logo: "SG", color: "#e2001a",
    taux: 3.58, dureeMax: 25, apportMin: 5,
    points: ["Apport minimum 5%", "100% digital possible", "Modulation mensualités"],
    desc: "Flexibilité des mensualités, offre modulable. Adapté aux profils dynamiques.",
    badge: "Apport minimum 5%",
  },
  {
    id: "lcl", nom: "LCL", logo: "LCL", color: "#0070b8",
    taux: 3.61, dureeMax: 25, apportMin: 10,
    points: ["Conseiller dédié", "Remboursement anticipé gratuit", "Offres primo-accédants"],
    desc: "Filiale du Crédit Agricole dédiée aux particuliers urbains.",
    badge: "Remboursement anticipé gratuit",
  },
  {
    id: "bourso", nom: "Boursobank", logo: "BB", color: "#0066cc",
    taux: 3.38, dureeMax: 25, apportMin: 10,
    points: ["Meilleur taux du marché", "100% en ligne, rapide", "Frais de dossier offerts"],
    desc: "Banque en ligne — meilleurs taux, zéro frais de dossier. Idéal pour les profils simples.",
    badge: "Meilleur taux global",
    highlight: true,
  },
  {
    id: "labanque", nom: "La Banque Postale", logo: "LP", color: "#ff7900",
    taux: 3.72, dureeMax: 30, apportMin: 0,
    points: ["Durée jusqu'à 30 ans", "Sans apport possible", "Prêt conventionné"],
    desc: "Offre accessible, prêts aidés et conventionnés. Durée 30 ans possible.",
    badge: "Sans apport",
  },
]

const DUREES = [10, 15, 20, 25]

export default function PretsPage() {
  const [tab, setTab] = useState<"calculer" | "comparer">("calculer")

  // Calculator state
  const [prixBien, setPrixBien] = useState(400000)
  const [apport, setApport] = useState(80000)
  const [duree, setDuree] = useState(20)
  const [taux, setTaux] = useState(3.45)
  const [assurance, setAssurance] = useState(0.3)
  const [expanded, setExpanded] = useState<string | null>(null)

  const emprunt = prixBien - apport
  const mensualite = useMemo(() => monthlyPayment(emprunt, taux, duree), [emprunt, taux, duree])
  const mensualiteAssurance = (emprunt * (assurance / 100)) / 12
  const mensualiteTotale = mensualite + mensualiteAssurance
  const coutTotal = mensualiteTotale * duree * 12
  const coutInterets = coutTotal - emprunt
  const pctApport = Math.round((apport / prixBien) * 100)

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* Hero */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex items-center gap-2 mb-4">
              <Euro className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-semibold tracking-widest uppercase text-blue-400">Financement</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight mb-2">
              Vos options de prêt immobilier
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Calculez vos mensualités, comparez les offres des grandes banques françaises et trouvez le financement idéal pour votre projet.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-14 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 flex gap-1 py-2">
          {[
            { key: "calculer" as const, label: "Calculatrice", icon: <Calculator className="h-3.5 w-3.5" /> },
            { key: "comparer" as const, label: "Comparer les banques", icon: <BarChart3 className="h-3.5 w-3.5" /> },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`relative inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${tab === t.key ? "text-white" : "text-slate-400 hover:text-slate-200"}`}>
              {tab === t.key && (
                <motion.div layoutId="prets-tab-bg" className="absolute inset-0 rounded-lg bg-slate-800" style={{ zIndex: -1 }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />
              )}
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10">
        <AnimatePresence mode="wait">

          {/* ─── Calculatrice ─── */}
          {tab === "calculer" && (
            <motion.div key="calc"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="grid gap-8 lg:grid-cols-[1fr_380px]"
            >
              {/* Sliders */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-6">
                  <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-blue-400" />Paramètres du prêt
                  </h2>

                  {[
                    { label: "Prix du bien", value: prixBien, set: setPrixBien, min: 50000, max: 2000000, step: 5000, suffix: "€", fmt: (v: number) => v.toLocaleString("fr-FR") + " €" },
                    { label: "Apport personnel", value: apport, set: setApport, min: 0, max: prixBien * 0.9, step: 5000, suffix: "€", fmt: (v: number) => v.toLocaleString("fr-FR") + " € (" + Math.round((v / prixBien) * 100) + "%)" },
                    { label: "Durée", value: duree, set: setDuree, min: 5, max: 30, step: 1, suffix: "ans", fmt: (v: number) => v + " ans" },
                    { label: "Taux d'intérêt", value: taux, set: setTaux, min: 1, max: 7, step: 0.05, suffix: "%", fmt: (v: number) => v.toFixed(2).replace(".", ",") + " %" },
                    { label: "Assurance emprunteur", value: assurance, set: setAssurance, min: 0.1, max: 1, step: 0.05, suffix: "%", fmt: (v: number) => v.toFixed(2).replace(".", ",") + " % / an" },
                  ].map(({ label, value, set, min, max, step, fmt: fmtFn }) => (
                    <div key={label} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">{label}</span>
                        <span className="text-white font-semibold tabular-nums">{fmtFn(value)}</span>
                      </div>
                      <input
                        type="range" min={min} max={max} step={step} value={value}
                        onChange={e => set(Number(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none bg-slate-800 accent-blue-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>{min.toLocaleString("fr-FR")}</span>
                        <span>{typeof max === "number" ? max.toLocaleString("fr-FR") : max}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Refinance tip */}
                <div className="rounded-xl border border-blue-800/30 bg-blue-950/20 p-4 flex gap-3">
                  <RefreshCw className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-400 leading-relaxed">
                    <span className="text-blue-400 font-semibold">Renégociation :</span> Si votre taux actuel dépasse 4,5%, une renégociation peut économiser entre{" "}
                    <span className="text-white font-semibold">{fmt(Math.round(emprunt * 0.008))}</span> et{" "}
                    <span className="text-white font-semibold">{fmt(Math.round(emprunt * 0.015))}</span> sur la durée restante.
                  </div>
                </div>
              </div>

              {/* Results sticky panel */}
              <div className="lg:sticky lg:top-28 lg:self-start space-y-4">
                <motion.div
                  key={`${mensualiteTotale}`}
                  initial={{ scale: 0.98 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-5"
                >
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Mensualité totale</div>
                    <div className="text-4xl font-light text-white">{fmt(Math.round(mensualiteTotale))}</div>
                    <div className="text-xs text-slate-500 mt-0.5">dont {fmt(Math.round(mensualite))} capital+intérêts + {fmt(Math.round(mensualiteAssurance))} assurance</div>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { label: "Montant emprunté", value: fmt(emprunt), color: "text-slate-200" },
                      { label: "Apport", value: `${fmt(apport)} (${pctApport}%)`, color: "text-emerald-400" },
                      { label: "Durée", value: `${duree} ans (${duree * 12} mensualités)`, color: "text-slate-200" },
                      { label: "Taux nominal", value: fmtPct(taux), color: "text-blue-400" },
                      { label: "Coût total du crédit", value: fmt(Math.round(coutInterets)), color: "text-amber-400" },
                      { label: "Total remboursé", value: fmt(Math.round(coutTotal)), color: "text-slate-200" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex justify-between text-sm border-b border-slate-800/60 pb-2.5 last:border-0 last:pb-0">
                        <span className="text-slate-500">{label}</span>
                        <span className={`font-semibold tabular-nums ${color}`}>{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Visual split: capital vs interest */}
                  <div className="space-y-1.5">
                    <div className="text-xs text-slate-500">Répartition capital / intérêts</div>
                    <div className="flex h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500" style={{ width: `${(emprunt / coutTotal) * 100}%` }} />
                      <div className="bg-amber-500 flex-1" />
                    </div>
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />Capital {Math.round((emprunt / coutTotal) * 100)}%</span>
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />Intérêts+Ass. {Math.round((1 - emprunt / coutTotal) * 100)}%</span>
                    </div>
                  </div>

                  <Link href="/prets#comparer"
                    onClick={() => setTab("comparer")}
                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors py-3 text-sm font-semibold text-white">
                    <BarChart3 className="h-4 w-4" />Comparer les banques
                  </Link>
                </motion.div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Simulation indicative. Le taux définitif dépend de votre dossier. Utilisez cet outil pour comparer et négocier.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Comparaison banques ─── */}
          {tab === "comparer" && (
            <motion.div key="compare"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Duration selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400">Durée :</span>
                <div className="flex gap-1.5">
                  {DUREES.map(d => (
                    <button key={d} onClick={() => setDuree(d)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${duree === d ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}>
                      {d} ans
                    </button>
                  ))}
                </div>
              </div>

              {/* Bank cards */}
              <div className="space-y-3">
                {BANKS.sort((a, b) => a.taux - b.taux).map((bank, i) => {
                  const m = monthlyPayment(300000, bank.taux, duree)
                  const isOpen = expanded === bank.id
                  return (
                    <motion.div key={bank.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className={`rounded-2xl border transition-colors ${bank.highlight ? "border-blue-500/40 bg-blue-950/20" : "border-slate-800 bg-slate-900/50"}`}
                    >
                      <button className="w-full text-left p-5" onClick={() => setExpanded(isOpen ? null : bank.id)}>
                        <div className="flex items-center gap-4">
                          {/* Logo pill */}
                          <div
                            className="shrink-0 rounded-xl w-14 h-10 flex items-center justify-center text-white text-sm font-bold"
                            style={{ backgroundColor: bank.color }}
                          >{bank.logo}</div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-slate-100">{bank.nom}</span>
                              {bank.highlight && (
                                <span className="rounded-full bg-blue-600/80 px-2 py-0.5 text-xs font-semibold text-white">⭐ Recommandé</span>
                              )}
                              <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-400">{bank.badge}</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">{bank.desc}</div>
                          </div>

                          <div className="shrink-0 text-right">
                            <div className="text-xl font-light text-white">{fmtPct(bank.taux)}</div>
                            <div className="text-xs text-slate-500">≈ {fmt(Math.round(m))} /mois</div>
                            <div className="text-xs text-slate-600">pour 300 000 €</div>
                          </div>

                          <div className="shrink-0 ml-1">
                            {isOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                          </div>
                        </div>
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 border-t border-slate-800 pt-4 space-y-4">
                              <div className="grid gap-2 sm:grid-cols-3">
                                {bank.points.map(p => (
                                  <div key={p} className="flex items-start gap-1.5 text-xs text-slate-400">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />{p}
                                  </div>
                                ))}
                              </div>
                              <div className="grid grid-cols-3 gap-3 text-center">
                                {[
                                  { label: "Taux nominal", value: fmtPct(bank.taux) },
                                  { label: "Apport min.", value: bank.apportMin + "%" },
                                  { label: "Durée max.", value: bank.dureeMax + " ans" },
                                ].map(({ label, value }) => (
                                  <div key={label} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                                    <div className="text-xs text-slate-500">{label}</div>
                                    <div className="text-sm font-semibold text-white mt-0.5">{value}</div>
                                  </div>
                                ))}
                              </div>
                              <div className="flex items-center gap-2 rounded-lg bg-slate-800/50 p-3">
                                <Info className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                <span className="text-xs text-slate-500">Taux indicatifs au 30 avril 2026. Contactez la banque pour une offre personnalisée selon votre profil.</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>

              {/* Rate comparison bar chart */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
                <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-blue-400" />Comparatif taux — {duree} ans
                </h2>
                <div className="space-y-2.5">
                  {BANKS.sort((a, b) => a.taux - b.taux).map(bank => {
                    const min = Math.min(...BANKS.map(b => b.taux))
                    const max = Math.max(...BANKS.map(b => b.taux))
                    const pct = ((bank.taux - min) / (max - min)) * 60 + 40
                    return (
                      <div key={bank.id} className="flex items-center gap-3">
                        <div className="shrink-0 w-24 text-xs text-slate-400 truncate">{bank.nom.split(" ")[0]}</div>
                        <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                            className={`h-full rounded-full ${bank.highlight ? "bg-blue-500" : "bg-slate-500"}`}
                          />
                        </div>
                        <span className="shrink-0 text-xs text-slate-300 tabular-nums font-semibold">{fmtPct(bank.taux)}</span>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Info className="h-3 w-3" />Taux indicatifs moyens du marché · Barre = écart relatif entre établissements
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CTA */}
      <section className="border-t border-slate-800 bg-slate-900/30">
        <div className="mx-auto max-w-5xl px-4 py-12 text-center space-y-4">
          <h2 className="text-xl sm:text-2xl font-light text-white">Prêt à estimer votre bien ?</h2>
          <p className="text-sm text-slate-400">Combinez estimation DVF + simulation prêt pour une vision complète de votre projet.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors px-6 py-3 text-sm font-semibold text-white">
              <Zap className="h-4 w-4" />Estimer un bien
            </Link>
            <Link href="/investir" className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/40 hover:bg-slate-800 transition-colors px-6 py-3 text-sm text-slate-300">
              <BarChart3 className="h-4 w-4 text-blue-400" />Simuler un investissement
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
