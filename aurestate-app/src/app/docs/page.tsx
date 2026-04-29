"use client"

import { motion } from "framer-motion"
import { Code2, Zap, Lock, Database } from "lucide-react"

const ENDPOINT = {
  method: "POST",
  path: "/api/v1/estimation",
  desc: "Estimation de valeur vénale d'un bien immobilier via données DVF + scoring 4D",
}

const REQUEST_EXAMPLE = `{
  "adresse": "10 rue de Rivoli, 75001 Paris",
  "type_local": "Appartement",
  "surface_bati": 65,
  "nb_pieces": 3
}`

const RESPONSE_EXAMPLE = `{
  "request_id": "est_abc123",
  "adresse_geocodee": "10 Rue de Rivoli, 75001 Paris 1er Arrondissement",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "geocoding_score": 0.98,
  "fourchette": {
    "min": 487500,
    "median": 610000,
    "max": 742500,
    "p25": 548000,
    "p75": 676000,
    "prix_m2_min": 7500,
    "prix_m2_median": 9385,
    "prix_m2_max": 11423,
    "prix_m2_p25": 8431,
    "prix_m2_p75": 10400
  },
  "scores": {
    "localisation": { "label": "Valeur marché", "value": 78.5, "weight": 0.4 },
    "marche": { "label": "Tension locale", "value": 92.0, "weight": 0.3 },
    "bien": { "label": "Liquidité", "value": 80.0, "weight": 0.2 },
    "dpe": { "label": "Risque énergétique", "value": 75.0, "weight": 0.1 },
    "global": 82.6
  },
  "confidence": 0.87,
  "nb_comparables": 17,
  "dpe_classe": "C",
  "dpe_conso": 178,
  "tendance_pct": 3.2
}`

const FIELDS = [
  { name: "adresse", type: "string", required: true, desc: "Adresse complète (geocodée via API Adresse data.gouv.fr)" },
  { name: "type_local", type: '"Appartement" | "Maison"', required: true, desc: "Type de bien" },
  { name: "surface_bati", type: "number", required: true, desc: "Surface en m²" },
  { name: "nb_pieces", type: "number", required: false, desc: "Nombre de pièces (optionnel)" },
]

const SCORE_FIELDS = [
  { name: "localisation", weight: "40%", desc: "Comparaison prix/m² du bien vs quartile inférieur du marché local" },
  { name: "marche", weight: "30%", desc: "Tension immobilière locale (volume, délai de revente estimé)" },
  { name: "bien", weight: "20%", desc: "Liquidité — nombre de comparables disponibles dans 500 m" },
  { name: "dpe", weight: "10%", desc: "Risque énergétique — classe DPE ADEME (A→G)" },
]

const SOURCES = [
  { icon: <Database className="h-4 w-4 text-blue-400" />, name: "DVF", desc: "Demandes de Valeurs Foncières — DGFIP / data.gouv.fr (transactions 24 mois)" },
  { icon: <Zap className="h-4 w-4 text-emerald-400" />, name: "API Adresse", desc: "Géocodage — adresse.data.gouv.fr (seuil qualité ≥ 0.5)" },
  { icon: <Database className="h-4 w-4 text-amber-400" />, name: "ADEME DPE", desc: "Diagnostics Performance Énergétique — ADEME open data" },
]

function CodeBlock({ code, lang = "json" }: { code: string; lang?: string }) {
  return (
    <pre className={`language-${lang} overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-300 leading-relaxed`}>
      <code>{code}</code>
    </pre>
  )
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16 space-y-12">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-widest">
            <Code2 className="h-4 w-4" />
            Référence API
          </div>
          <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight">API AURESTATE</h1>
          <p className="text-slate-400 text-base">
            REST JSON · FastAPI · Données DVF publiques · Scoring 4D explicable
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />Base URL : http://localhost:8000
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-400">
              <Lock className="h-3 w-3" />Pas d&apos;auth requise (open data)
            </span>
          </div>
        </motion.div>

        {/* Endpoint */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">Endpoint</h2>
          <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <span className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-bold text-white uppercase">{ENDPOINT.method}</span>
            <code className="text-sm text-slate-200 font-mono">{ENDPOINT.path}</code>
          </div>
          <p className="text-sm text-slate-400">{ENDPOINT.desc}</p>
        </motion.section>

        {/* Request */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">Corps de la requête</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60">
                  {["Champ", "Type", "Requis", "Description"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FIELDS.map((f, i) => (
                  <tr key={f.name} className={`border-b border-slate-800/50 ${i % 2 === 0 ? "bg-slate-900/20" : ""}`}>
                    <td className="px-4 py-3 font-mono text-xs text-blue-400">{f.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{f.type}</td>
                    <td className="px-4 py-3 text-xs">
                      {f.required
                        ? <span className="text-emerald-400">✓ oui</span>
                        : <span className="text-slate-600">optionnel</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{f.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <CodeBlock code={REQUEST_EXAMPLE} />
        </motion.section>

        {/* Response */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">Réponse — 200 OK</h2>
          <CodeBlock code={RESPONSE_EXAMPLE} />
        </motion.section>

        {/* Scoring */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">Scores 4D — méthodologie</h2>
          <div className="grid gap-3">
            {SCORE_FIELDS.map((s) => (
              <div key={s.name} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex items-start gap-4">
                <span className="shrink-0 rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-bold text-blue-400">{s.weight}</span>
                <div className="space-y-0.5">
                  <div className="text-sm font-medium text-slate-200 font-mono">{s.name}</div>
                  <div className="text-xs text-slate-400">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Data sources */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }} className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">Sources de données</h2>
          <div className="space-y-3">
            {SOURCES.map((s) => (
              <div key={s.name} className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <div className="mt-0.5">{s.icon}</div>
                <div>
                  <div className="text-sm font-semibold text-slate-200">{s.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Errors */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">Codes d&apos;erreur</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60">
                  {["Code", "Cause", "Solution"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["422", "Validation échouée (champ manquant ou invalide)", "Vérifier le corps JSON"],
                  ["404", "Aucune transaction DVF trouvée dans un rayon 1 km", "Essayer une adresse plus dense"],
                  ["503", "Géocodage échoué (score < 0.5)", "Préciser l'adresse (numéro, code postal)"],
                ].map(([code, cause, sol], i) => (
                  <tr key={code} className={`border-b border-slate-800/50 ${i % 2 === 0 ? "bg-slate-900/20" : ""}`}>
                    <td className="px-4 py-3 font-mono text-xs text-red-400">{code}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{cause}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{sol}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          className="text-xs text-slate-600 border-t border-slate-800 pt-6"
        >
          API AURESTATE — données DVF open data · RGPD compliant · aucune donnée personnelle stockée
        </motion.p>
      </div>
    </div>
  )
}
