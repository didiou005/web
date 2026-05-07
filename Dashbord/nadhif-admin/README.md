# 🖥️ Nadhif Admin Dashboard

Interface moderne d'administration de la Wilaya, développée avec **React 18** et **Vite**. Conçue pour offrir une expérience premium et performante aux gestionnaires de déchets.

## 🌟 Nouveautés v2.0

### 🛡️ Gestion des Administrateurs (Advanced)

- **Système de Recherche & Tri** : Retrouvez rapidement n'importe quel admin par nom, email ou fonction.
- **Accès Épinglés** : Le Super Administrateur est toujours visible en haut (`Pin`) pour un accès rapide.
- **Dark Mode Optimisé** : Correction des contrastes pour une lisibilité parfaite dans toutes les conditions.

### 🚛 Pilotage des Équipes

- **Dashboard Terrain** : Gestion complète des équipes de ramassage.
- **Formulaires Intelligents** : Création et édition rapide avec validation en temps réel.
- **Indicateurs** : Visualisation du nombre de membres et des plaintes actives par équipe.

## 🎨 Design System

- **Glassmorphism & Micro-animations** : Pour une sensation de fluidité et de modernité.
- **Theming Natif** : Utilisation exclusive des variables CSS pour une maintenance simplifiée.
- **Layout Adaptatif** : Sidebar escamotable et contenu centré sur les données (Data-Driven UI).

## 🛠️ Installation & Scripts

```bash
npm install # Installer les dépendances
npm run dev # Lancement en mode développement
npm run build # Génération du dossier 'dist' pour production
```

## 📁 Structure Clé

- `/src/pages/AdminUsers` : Gestion avancée du personnel administratif.
- `/src/pages/Teams` : Interface de gestion des équipes de collecte.
- `/src/services/api.js` : Couche de communication avec le backend (Axios).
- `/src/styles/globals.css` : Définition du thème Light/Dark.
