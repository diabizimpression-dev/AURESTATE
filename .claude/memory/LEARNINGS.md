# LEARNINGS — AURESTATE
_2026-04-28_

---

## DÉCISIONS FONDATRICES

| Question | Décision | Impact |
|---|---|---|
| Marché cible | **France** | DVF valide, architecture FR |
| Source DVF | **API data.gouv.fr** | Pas de CSV, toujours à jour |
| Géocodage | **API Adresse data.gouv.fr** | Gratuit, 99.9% couverture |
| Périmètre MVP | **France métropolitaine** | Volume maîtrisé |

> L'intelligence compétitive australienne (REA, Domain, Coposit) reste utile comme **benchmark UX/produit** mais l'architecture data est 100% FR.

---

## Competitive Intelligence — Benchmarks (référence UX uniquement)

---

## 1. realestate.com.au — Stack réel

- **Framework**: React 19 + SSR propriétaire **Argonaut** (pas Next.js)
- CDN: `argonaut.au.reastatic.net`
- Data variable: `window.ArgonautExchange` (pas `__NEXT_DATA__`)
- **GraphQL search public (no auth)**: `https://lexa.realestate.com.au/graphql`
- Home loans: `https://homeloans.realestate.com.au/api/graphql`

### Lexa GraphQL — paramètres search confirmés
```
locations: string[]
channel: "buy" | "rent" | "sold"
surrounding_suburbs: boolean
sortType: "new-desc" | "price-asc" | "price-desc" | "date-updated"
propertyTypes: house | unit apartment | townhouse | land | acreage | rural
bedroomsMin/Max, bathroomsMin, parkingSpacesMin
priceMin/Max (AUD integer)
landSizeMin/Max (m2)
page, pageSize (max 100)
```

### Champs listing retournés
`id`, `propertyType`, `propertyLink`, `address.{shortAddress, suburb, state, postcode}`,
`generalFeatures.{bedrooms, bathrooms, parkingSpaces}`, `propertySizes.{building, land}`,
`price.{display, range.lowPrice, range.highPrice}`, `media.{mainImage, images, floorplans, videos}`,
`listingCompany.{id, name, phoneNumber}`, `listers[]`, `inspectionDetails`, `auctionDetails`,
`dateListed`, `dateUpdated`, `status`, `tags`

---

## 2. domain.com.au — API publique officielle

- **Framework**: Next.js standard, data dans `__NEXT_DATA__.props.pageProps.listing`
- **API**: `https://api.domain.com.au/v1` (OAuth2 Bearer via developer.domain.com.au)
- **Search**: `POST https://api.domain.com.au/v1/listings/residential/_search`

### Paramètres search
```
listingType, propertyTypes[], minBedrooms, maxBedrooms, minBathrooms,
minCarspaces, minPrice, maxPrice, minLandArea, maxLandArea,
locations[].{state, suburb, postCode}, keywords[], sort.{sortKey, direction},
pageSize (max 200), pageNumber
```

### Types propriété
`House`, `ApartmentUnitFlat`, `Townhouse`, `Villa`, `Land`, `Rural`,
`BlockOfUnits`, `RetirementVillage`, `Acreage`, `DevelopmentSite`

### Sort keys
`Default`, `DateUpdated`, `Price-Asc`, `Price-Desc`, `SupplierDate`, `Bedrooms-Asc/Desc`

### Pagination
`pageNumber`, `pageSize`, `X-Total-Count` (header)

---

## 3. Marché AU — Duopole + niches connues

| Plateforme | Part | Faille |
|---|---|---|
| realestate.com.au | ~60% | Sert agents pas acheteurs, prix en hausse, cible ACCC |
| domain.com.au | ~30% | Bilan lourd, churn agents, faible vélocité produit |
| homely.com.au | niche | Bon concept (avis quartiers), pas de traction |
| rent.com.au | rentals | Owned REA = conflit d'intérêts |
| buyside.com.au | off-market | Concept bon, trop petit |
| realtair.com.au | enchères | B2B agents uniquement |
| propertyvalue.com.au | AVM | Gratuit mais limité |

---

## 4. Concurrents inconnus identifiés (NOUVEAUX)

| Startup | URL | Funding | Feature unique | Cible |
|---|---|---|---|---|
| **Soho** | soho.com.au | A$5M+ Series B | PropertyMatch AI: swipe-to-learn, rank par match pas par pub payante | B2C acheteurs/locataires |
| **view.com.au** | view.com.au | Revenue-funded (ex-CEO Domain) | Listing gratuit agents + Nearmap aerial + off-market EOI | Disruption frais REA/Domain |
| **Coposit** | coposit.com.au | A$14M seed (CBA) | Achat off-plan avec $10K dépôt + versements hebdo sans intérêts | First-home buyers + promoteurs |
| **FOUNDIT** | foundit.property | A$2M pre-seed (ex-Domain founders) | Buyer's agent + tech hybride, accès off-market | Acheteurs avec représentation |
| **Agentsy** | agentsy.com.au | A$700K pre-seed (fév 2026) | IA back-office agences (emails, compliance, marketing) | Agences immobilières B2B |

**Vecteurs de disruption observés**: anti-paid-placement AI, modèle freemium agents, financement dépôt transaction, hybride buyers-agent tech, IA productivité agences.

---

## 5. Gaps non exploités en AU

1. AVM public sur chaque bien (Zillow le fait, personne en AU)
2. Score risque climatique/incendie/inondation par bien
3. Filtre temps de trajet domicile→travail (Rightmove UK)
4. Alertes <1 min (REA = 15 min délai)
5. Profil locataire vérifié (ImmoScout DE)
6. Listings "coming soon" off-market
7. Ranking agents transparent (taux vente/prix affiché, jours marché)
8. Parcours acheteur intégré (search→inspection→offre→conveyancing)

---

## 6. Benchmarks internationaux

- **Zillow**: Zestimate (AVM public) + climate risk + "Make Me Move" prix secret vendeur
- **Redfin**: "Hot Homes" algo + frais 1% + tour scheduling direct app
- **Rightmove**: filtre temps trajet + "Rightmove Plus" abonnement acheteur
- **ImmoScout24**: badge locataire vérifié + virtual staging IA
- **SeLoger**: alertes instantanées + estimation vendeur comme lead gen
- **PropertyGuru**: VR tour + Price Trend Index hebdo par district

---

## 7. Vulnérabilités REA à exploiter

- Hausses tarifaires annuelles → agents mécontents
- UX vieillissante, app mobile 3.8/5
- Conflit d'intérêts (data + courtage + listings)
- Scrutin ACCC croissant
- Échecs expansion internationale → management distrait
- Lexa GraphQL **sans auth** → leurs données search sont publiques
