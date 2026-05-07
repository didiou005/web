# ⚙️ Nadhif Backend API

API REST robuste alimentant le tableau de bord administratif Nadhif. Gère l'authentification sécurisée, les statistiques de performance et la coordination des équipes terrain.

## 🔗 Synchronisation SQL & Schéma

L'API est synchronisée avec un schéma PostgreSQL/PostGIS optimisé.
**Table Critique :** `team_members` (Singulier) – contient les membres des équipes.
**Statuts Officiels :** `en_attente`, `en_cours`, `resolue`.

## 🛠️ Routes API (v2.0)

### 👥 Administration (`/api/auth`)

- `GET /admins` : Liste filtrable des administrateurs.
- `PUT /:id` : Mise à jour des profils et fonctions.
- `DELETE /:id` : Suppression sécurisée (Super Admin protégé).

### 🚛 Équipes & Logistique (`/api/teams`)

- `GET /` : Liste complète des équipes avec décompte des membres et plaintes actives.
- `POST /` : Création d'une nouvelle équipe rattachée à une région.
- `PUT /:id` : Mise à jour des infos véhicules et horaires.
- `DELETE /:id` : Suppression (vérifie si des plaintes sont encore assignées).
- `GET /:id/performance` : Calcul du taux de réussite et délai moyen de résolution.

### 📊 Statistiques & Dashboard (`/api/dashboard`)

- `GET /stats/kpis` : Chiffres clés du jour (nouvelles plaintes, résolues).
- `GET /stats/regions` : Performance par secteur géographique.

## 🔒 Sécurité & Performance

- **Pool de Connexion Optimized** : Gestion asynchrone pour supporter de fortes charges.
- **Middleware JWT** : Validation stricte des tokens sur chaque route protégée.
- **Audit Logging** : Enregistrement de l'IP et du User-Agent lors des tentatives de login.

## ⚙️ Démarrage Rapide

```bash
npm install
# Configurez le fichier .env
npm run dev # Avec Nodemon pour le rechargement automatique
```
