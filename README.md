# 🌿 Nadhif - Système de Gestion Intégrée des Déchets

**Nadhif** est une plateforme moderne conçue pour optimiser la gestion des déchets, la collecte et le signalement des plaintes citoyennes. Le projet se compose d'une infrastructure robuste incluant une application mobile/web (client), un tableau de bord administratif (admin) et une API REST performante synchronisée avec une base de données PostgreSQL/PostGIS.

## 🏗️ Architecture du Projet

Le dépôt est organisé de la manière suivante :

- **/client** : Application web/mobile destinée aux citoyens (signalement anonyme, suivi en temps réel).
- **/server** : Backend principal pour l'application citoyenne.
- **/Dashbord/nadhif-admin** : Interface d'administration React pour la gestion des données, des équipes et des statistiques de performance.
- **/Dashbord/nadhif-backend** : API spécifique pour le tableau de bord administratif (Administration, Authentification, Statistiques, Gestion des Équipes).

---

## 🚀 Fonctionnalités Majeures (Mise à jour v0.0.2)

### 👥 Gestion des Administrateurs

- **Recherche Instantanée** : Filtrage par nom, email ou fonction.
- **Tri Avancé** : Classement intuitif par date de dernière connexion, nom ou fonction.
- **Hierarchy Mapping** : Super Admin épinglé (`Pin`) avec icône distinctive et protection contre la suppression.
- **Interface Adaptive** : Support complet du **Dark Mode** avec contrastes optimisés.

### 🚛 Gestion des Équipes & Employés

- **CRUD Complet** : Création, modification et suppression des équipes de collecte.
- **Assignation Sectorielle** : Liaison directe entre les équipes et les régions géographiques.
- **Suivi des Membres** : Gestion des employés terrain rattachés à chaque équipe.
- **Stats de Performance** : Indicateurs de résolution de plaintes par équipe.

### 📊 Dashboard & Statistiques

- **Synchronisation SQL** : Intégration des statuts officiels (`en_attente`, `en_cours`, `resolue`).
- **KPIs Dynamiques** : Calcul en temps réel du taux de résolution et des délais moyens.
- **Analytique par Commune** : Distribution géographique des incidents sur les 43 communes de Bouira.

---

## 🛠️ Stack Technique

| Secteur      | Technologies                           |
| :----------- | :------------------------------------- |
| **Frontend** | React 18, Vite, Lucide React, Recharts |
| **Backend**  | Node.js, Express, PostgreSQL / PostGIS |
| **Sécurité** | JWT, Bcrypt, Middleware d'Auth         |
| **Styling**  | CSS Modern (Variables, Glassmorphism)  |

---

## ⚙️ Installation & Démarrage

### 1. Backend Administration

```bash
cd Dashbord/nadhif-backend
npm install
# Configurez .env (DB_HOST, DB_USER, DB_PASS, JWT_SECRET)
npm run dev
```

### 2. Frontend Administration

```bash
cd Dashbord/nadhif-admin
npm install
npm run dev
```

---

## 🛡️ Administration & Sécurité

- **Super Admin** : Contrôle total, épinglé en tête de liste, accès permanent.
- **Admin** : Gestion opérationnelle (plaintes, équipes, cartes).
- **Audit Logs** : Historique des connexions (adresse IP, User Agent).

---

## 📝 Contact & Maintenance

Projet optimisé pour la Wilaya de Bouira.
Développement axé sur la performance, la sécurité et l'expérience utilisateur intuitive.
