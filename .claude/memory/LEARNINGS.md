# LEARNINGS — Competitive Intelligence
_2026-04-28_

## realestate.com.au — HAR (homepage)
- Stack: GraphQL (`GetBrokers(postcode)` = matching courtiers)
- Subdomains: homeloans, sasinator (A/B test), smetrics, analytics
- Monitoring: New Relic + Qualtrics surveys
- **Monétisation**: Ad stack massif (PubMatic, Rubicon, AppNexus, Yahoo, BlisMedia) → revente données d'intention

## Marché AU
| Plateforme | Part | Faille |
|---|---|---|
| realestate.com.au | ~60% | Sert agents pas acheteurs, prix en hausse, cible ACCC |
| domain.com.au | ~30% | Bilan lourd, churn agents, faible vélocité produit |
| homely.com.au | niche | Bon concept (avis quartiers), pas de traction |
| rent.com.au | rentals | Owned REA = conflit d'intérêts |
| buyside.com.au | off-market | Concept bon, trop petit |
| realtair.com.au | enchères | B2B agents uniquement |
| propertyvalue.com.au | AVM | Gratuit mais limité |

## Gaps non exploités en AU
1. AVM public sur chaque bien (Zillow le fait, personne en AU)
2. Score risque climatique/incendie/inondation par bien
3. Filtre temps de trajet domicile→travail (Rightmove UK)
4. Alertes <1 min (REA = 15 min de délai)
5. Profil locataire vérifié (ImmoScout DE)
6. Listings "coming soon" off-market
7. Ranking agents transparent (taux vente/prix affiché, jours marché)
8. Parcours acheteur intégré (search→inspection→offre→conveyancing)

## Benchmarks internationaux (features absentes en AU)
- **Zillow**: Zestimate (AVM public) + climate risk + "Make Me Move" (prix secret vendeur)
- **Redfin**: "Hot Homes" algo (prédit vente <2 semaines) + frais 1%
- **Rightmove**: filtre temps de trajet + "Rightmove Plus" (abonnement acheteur)
- **ImmoScout24**: badge locataire vérifié + virtual staging IA
- **SeLoger**: alertes instantanées + estimation vendeur comme lead gen
- **PropertyGuru**: VR tour + Price Trend Index hebdomadaire par district

## Vulnérabilités REA à exploiter
- Hausses tarifaires annuelles → agents mécontents
- UX vieillissante, app mobile 3.8/5
- Conflit d'intérêts (data + courtage + listings)
- Scrutin ACCC croissant
- Échecs expansion internationale → management distrait
