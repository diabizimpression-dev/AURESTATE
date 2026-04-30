import { BienDetail, type Transaction } from "./BienDetail"

const TRANSACTIONS: Transaction[] = [
  { id: "1", adresse: "14 rue de la Paix", arr: "75001", type: "Appartement", surface: 68, prix: 714000, date: "2024-11-12", pieces: 3, dpe: "C", etage: 3 },
  { id: "2", adresse: "3 avenue Ledru-Rollin", arr: "75011", type: "Appartement", surface: 52, prix: 498000, date: "2024-11-08", pieces: 2, dpe: "D", etage: 2 },
  { id: "3", adresse: "27 rue Oberkampf", arr: "75011", type: "Appartement", surface: 41, prix: 379000, date: "2024-11-05", pieces: 2, dpe: "E", etage: 1 },
  { id: "4", adresse: "8 rue de la Roquette", arr: "75011", type: "Appartement", surface: 76, prix: 712000, date: "2024-10-29", pieces: 3, dpe: "C", etage: 4 },
  { id: "5", adresse: "55 rue du Faubourg Saint-Antoine", arr: "75011", type: "Maison", surface: 110, prix: 1240000, date: "2024-10-25", pieces: 5, dpe: "B", etage: 0 },
  { id: "6", adresse: "2 place de la République", arr: "75010", type: "Appartement", surface: 63, prix: 567000, date: "2024-10-22", pieces: 3, dpe: "D", etage: 5 },
  { id: "7", adresse: "18 rue de Lancry", arr: "75010", type: "Appartement", surface: 38, prix: 342000, date: "2024-10-18", pieces: 2, dpe: "E", etage: 1 },
  { id: "8", adresse: "91 quai de Valmy", arr: "75010", type: "Appartement", surface: 55, prix: 539000, date: "2024-10-15", pieces: 2, dpe: "C", etage: 3 },
  { id: "9", adresse: "4 rue Beaubourg", arr: "75003", type: "Appartement", surface: 82, prix: 984000, date: "2024-10-10", pieces: 4, dpe: "B", etage: 6 },
  { id: "10", adresse: "16 rue des Archives", arr: "75004", type: "Appartement", surface: 70, prix: 910000, date: "2024-10-07", pieces: 3, dpe: "C", etage: 4 },
  { id: "11", adresse: "33 boulevard Voltaire", arr: "75011", type: "Appartement", surface: 47, prix: 432000, date: "2024-10-03", pieces: 2, dpe: "D", etage: 2 },
  { id: "12", adresse: "7 rue de la Fontaine au Roi", arr: "75011", type: "Appartement", surface: 60, prix: 558000, date: "2024-09-30", pieces: 3, dpe: "C", etage: 3 },
  { id: "13", adresse: "22 rue Sedaine", arr: "75011", type: "Appartement", surface: 35, prix: 315000, date: "2024-09-26", pieces: 1, dpe: "F", etage: 1 },
  { id: "14", adresse: "5 avenue de la République", arr: "75011", type: "Appartement", surface: 88, prix: 836000, date: "2024-09-22", pieces: 4, dpe: "C", etage: 5 },
  { id: "15", adresse: "12 rue Amelot", arr: "75011", type: "Appartement", surface: 54, prix: 513000, date: "2024-09-18", pieces: 2, dpe: "D", etage: 2 },
  { id: "16", adresse: "44 rue du Chemin Vert", arr: "75011", type: "Maison", surface: 95, prix: 1050000, date: "2024-09-14", pieces: 5, dpe: "B", etage: 0 },
  { id: "17", adresse: "9 rue des Trois-Bornes", arr: "75011", type: "Appartement", surface: 43, prix: 398000, date: "2024-09-10", pieces: 2, dpe: "E", etage: 1 },
  { id: "18", adresse: "71 rue Saint-Maur", arr: "75011", type: "Appartement", surface: 66, prix: 609000, date: "2024-09-05", pieces: 3, dpe: "C", etage: 3 },
  { id: "19", adresse: "30 rue de la Folie Méricourt", arr: "75011", type: "Appartement", surface: 79, prix: 742000, date: "2024-09-01", pieces: 3, dpe: "D", etage: 4 },
  { id: "20", adresse: "6 rue Keller", arr: "75011", type: "Appartement", surface: 31, prix: 287000, date: "2024-08-28", pieces: 1, dpe: "F", etage: 2 },
]

export function generateStaticParams() {
  return TRANSACTIONS.map(t => ({ id: t.id }))
}

export default async function BienPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const t = TRANSACTIONS.find(t => t.id === id)
  if (!t) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Transaction introuvable</div>

  const similaires = TRANSACTIONS.filter(x => x.arr === t.arr && x.id !== t.id).slice(0, 3)
  return <BienDetail t={t} similaires={similaires} />
}
