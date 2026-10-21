# PDF Studio — Déploiement Vercel

Application web professionnelle de mise en page et d'impression PDF.
**100% côté client** : vos fichiers PDF ne quittent jamais le navigateur.

## Stack technique

- **Next.js 16** (App Router, Turbopack)
- **TypeScript 5**
- **Tailwind CSS 4** + **shadcn/ui** (Radix UI)
- **pdf-lib** pour la manipulation PDF
- **pdfjs-dist** pour le rendu PDF.js (worker dans `/public/pdf-worker/`)
- **@dnd-kit** pour le glisser-déposer des pages
- **zustand** pour la gestion d'état
- **react-dropzone** pour l'import de fichiers
- **framer-motion** pour les animations
- **sonner** pour les notifications

## Déploiement sur Vercel

### Option 1 : Déploiement via Git (recommandé)

1. **Initialiser un dépôt Git local**
   ```bash
   git init
   git add .
   git commit -m "Initial commit — PDF Studio"
   ```

2. **Pousser vers GitHub/GitLab/Bitbucket**
   - Créez un nouveau dépôt sur votre plateforme
   - Ajoutez le remote et poussez :
   ```bash
   git remote add origin https://github.com/votre-utilisateur/pdf-studio.git
   git branch -M main
   git push -u origin main
   ```

3. **Importer sur Vercel**
   - Allez sur https://vercel.com/new
   - Importez votre dépôt GitHub
   - Vercel détecte automatiquement Next.js
   - Cliquez sur **Deploy** (aucune configuration supplémentaire requise)

### Option 2 : Déploiement via Vercel CLI

1. **Installer Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Se connecter**
   ```bash
   vercel login
   ```

3. **Déployer** (depuis la racine du projet)
   ```bash
   # Déploiement de preview
   vercel

   # Déploiement en production
   vercel --prod
   ```

## Configuration Vercel

Aucune configuration spéciale requise. Vercel détecte automatiquement :
- **Framework Preset** : Next.js
- **Build Command** : `next build` (par défaut)
- **Output Directory** : `.next` (par défaut)
- **Install Command** : `npm install` ou `bun install` (par défaut)
- **Node.js Version** : 20.x (recommandé)

## Variables d'environnement

PDF Studio fonctionne **sans aucune variable d'environnement** — tout est côté client.
Optionnellement, vous pouvez définir `DATABASE_URL` si vous voulez activer Prisma.

## Structure du projet

```
.
├── public/
│   ├── logo.png                       # Logo PDF Studio
│   └── pdf-worker/
│       └── pdf.worker.min.mjs         # Worker PDF.js (1.2 Mo)
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Layout racine (FR, métadonnées, toasters)
│   │   ├── page.tsx                  # Route principale (routage via Zustand)
│   │   └── globals.css               # Thème bleu #2563EB + styles d'impression
│   ├── lib/
│   │   ├── pdf-utils.ts              # Toute la logique PDF (rendu, manipulation, layout, impression)
│   │   ├── db.ts                     # Prisma client (optionnel)
│   │   └── utils.ts                  # Helper shadcn (cn)
│   ├── store/
│   │   └── pdf-store.ts              # Store Zustand (docs, layout, print, auth, recents)
│   ├── hooks/
│   │   ├── use-mobile.ts
│   │   └── use-toast.ts
│   └── components/
│       ├── ui/                        # Composants shadcn/ui (40+ fichiers)
│       └── pdfstudio/
│           ├── shared/
│           │   ├── sidebar.tsx        # Navigation + profil utilisateur
│           │   └── file-dropzone.tsx # Import multi-fichiers
│           ├── dashboard/
│           │   └── dashboard-view.tsx
│           ├── editor/
│           │   ├── editor-view.tsx   # Layout 3 zones + mobile Sheets
│           │   ├── editor-toolbar.tsx
│           │   ├── thumbnails-panel.tsx  # @dnd-kit sortable
│           │   ├── preview-panel.tsx     # Aperçu PDF.js
│           │   └── settings-panel.tsx    # Format / marges / en-têtes
│           ├── print/
│           │   └── print-view.tsx       # N-up, marges, couleur, recto-verso
│           ├── merge-split/
│           │   ├── merge-view.tsx
│           │   └── split-view.tsx
│           └── landing/
│               ├── landing-view.tsx     # Page d'accueil publique
│               └── login-view.tsx       # Connexion / Inscription / Invité
├── prisma/
│   └── schema.prisma                  # Schéma de base (optionnel)
├── package.json
├── next.config.ts                    # Turbopack + allowedDevOrigins
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── components.json                   # Config shadcn/ui
├── eslint.config.mjs
└── .env.example
```

## Fonctionnalités

### Vues principales
- **Landing** : page d'accueil publique avec hero, features, CTA
- **Login** : connexion / inscription / mode invité (mock auth, localStorage)
- **Dashboard** : tableau de bord avec raccourcis, recents, dropzone
- **Éditeur PDF** : 3 zones (miniatures / aperçu / réglages) + barre d'outils
- **Préparer l'impression** : N-up (1/2/4/6/8/16), marges, couleur, recto-verso, aperçu iframe live
- **Fusionner** : assembler plusieurs PDF avec réordonnancement
- **Découper** : séparer un PDF en chunks (1/2/5/10/custom)

### Opérations sur pages
- Glisser-déposer pour réordonner (@dnd-kit)
- Rotation 90° par page
- Suppression / extraction (sélection multiple Maj+Clic)
- Annuler/Rétablir (historique 30 niveaux)
- Zoom 25-300%

### Mise en page
- Formats : A4, A3, A5, Letter, Legal, personnalisé
- Orientation portrait / paysage
- Marges réglables (sliders + presets)
- Bordures avec couleur et épaisseur
- En-têtes / pieds de page
- Numéros de page / date
- Centrage horizontal / vertical
- Logique A3 intelligente : 2 pages A4 + paysage automatique

### Impression
- 1, 2, 4, 6, 8 ou 16 pages par feuille
- Format de papier + orientation
- Plage de pages personnalisée ("1-3, 5, 8-10")
- Marges d'impression
- Espace entre pages
- Repères de coupe (optionnel)
- Mode couleur / noir & blanc
- Recto-verso (si l'imprimante le permet)
- Aperçu fidèle iframe + récapitulatif

### Export
- Télécharger le PDF avec mise en page appliquée
- Enregistrer l'original
- Imprimer via la boîte de dialogue du navigateur

## Développement local

```bash
# Installer les dépendances
npm install
# ou
bun install

# Lancer le serveur de développement
npm run dev
# ou
bun run dev

# Vérifier le lint
npm run lint

# Build de production
npm run build
```

## Notes de sécurité

- **100% confidentiel** : aucun fichier PDF n'est envoyé vers un serveur
- Tout le traitement se fait dans le navigateur via pdf-lib et PDF.js
- Les sessions utilisateur sont stockées en `localStorage` (mock auth)
- Le worker PDF.js est servi depuis `/public/pdf-worker/pdf.worker.min.mjs`

## Licence

© 2026 PDF Studio. Tous droits réservés.
