# ASRC TECH WATCH

Projet de veille technologique pour le Bachelor ASRC 2026–2027.

## Objectifs

- **H1 — chaque semaine :** suivre les actualités, vulnérabilités et évolutions des systèmes, réseaux et de la cybersécurité.
- **H2 — chaque mois :** approfondir le Cloud, l'automatisation, les infrastructures réseau et les solutions de cybersécurité.
- **H3 — chaque trimestre :** anticiper les technologies émergentes comme l'IA et l'informatique quantique.

## Architecture simple

RSS → GitHub Actions → `data/veille.json` → GitHub → Vercel

Le site est donc consultable sans laisser le PC allumé. GitHub Actions lance la collecte chaque vendredi. Le script traite H1 chaque semaine, H2 au début de chaque mois et H3 au début de chaque trimestre.

## Pourquoi RSS plutôt que des API avec clé ?

Pour cette première version, les flux RSS sont volontairement utilisés : ils permettent une collecte automatique sans clé API ni coût. Une API NVD/CVE ou d'autres APIs spécialisées pourront être ajoutées dans une V2.

## Lancer en local

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000.

Pour tester la collecte :

```bash
npm run collect
```

## Déploiement Vercel

1. Créer un dépôt GitHub et pousser ce projet.
2. Dans Vercel : Add New → Project → importer le dépôt.
3. Framework : Next.js.
4. Build command : `next build`.
5. Déployer.

Chaque commit généré par GitHub Actions peut ensuite déclencher un nouveau déploiement Vercel.

## Important pour le devoir

Le fichier `data/veille.json` contient volontairement trois premières mesures datées du **25/09/2026**, une pour H1, une pour H2 et une pour H3, afin de satisfaire l'exigence de première occurrence pour chaque horizon. Ces mesures initiales sont séparées des futures collectes automatiques.
