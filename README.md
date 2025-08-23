# FreelanceLinkAI

Plateforme de mise en relation pour freelances et entreprises avec IA (MVP).

## Monorepo
- apps/api: API Node.js (Express + Prisma + SQLite en dev)
- apps/web: Frontend React (Vite + TS)
- packages/: Configs partagés (tsconfig, eslint)

## Prérequis
- Node.js 18+

## Démarrage rapide (local, SQLite)
1. Installer les dépendances:
   - `npm install`
2. API: générer Prisma et migrer la base:
   - `cd apps/api`
   - `cp .env.example .env`
   - `npx prisma migrate deploy`
3. Web: configurer l'URL de l'API si besoin:
   - `cd ../web`
   - `cp .env.example .env` (par défaut `http://localhost:4000`)
4. Lancer en dev (deux serveurs):
   - `cd ../../`
   - `npm run dev`
   - API: http://localhost:4000, Web: http://localhost:5173

## Endpoints principaux (MVP)
- `GET /health`
- `GET /users`, `POST /users` (role: 'FREELANCER' | 'COMPANY')
- `POST /skills` (création/ajout compétence)
- `GET /freelancers?skill=React&location=Casablanca`
- `POST /freelancers/:id/skills` (ajouter compétences au profil)
- `GET /projects`, `POST /projects` (companyId requis)
- `GET /projects/:id/recommendations?limit=10` (score heuristique)

## Recommandations (MVP)
Score = recouvrement des compétences * 2 + note moyenne + bonus localisation.

## Passage à PostgreSQL
- Modifier `apps/api/prisma/schema.prisma` datasource -> `postgresql`
- Mettre à jour `apps/api/.env` avec `DATABASE_URL`
- Exécuter `npx prisma migrate dev`

## Sécurité & Auth (prochaines étapes)
- Intégrer OAuth/OIDC (Auth0) et rôles
- Validation plus stricte & rate limiting

## Paiements (prochaines étapes)
- Intégrer Stripe/PayPal (test mode)

## Licence
MIT
