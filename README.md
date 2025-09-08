# 📘 MonEditeur — Éditeur de texte / code personnalisé (React + Electron + Monaco)

[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js->=18-brightgreen)](https://nodejs.org/)
[![Electron](https://img.shields.io/badge/Electron->=26-blue)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React->=18-blueviolet)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite->=5-blue)](https://vitejs.dev/)

---

## 📝Description

**MonEditeur** est un éditeur de texte / code minimal et extensible construit avec **React**, **Electron** et **Monaco Editor**.  
L'objectif : proposer une base légère, performante et facile à étendre, avec un explorateur de fichiers réactif (lazy loading) et une stratégie de surveillance des dossiers proche de VSCode (watchers par dossier ouvert).

---

## 🚀Démarrage rapide

1. **Cloner le dépôt :**
   ```bash
   git clone <url-du-dépôt>
   cd <nom-du-répo>
   ```

2. **Installer les dépendances :**
   ```bash
   npm install
   ```

3. **Démarrer l'interface (Vite / React) :**
   ```bash
   npm run dev
   ```

4. **Dans un autre terminal, lancer Electron (chargera l'UI dev) :**
   ```bash
   npm run start:electron
   ```

> Remarque : Les scripts (`dev`, `start:electron`, `build`) doivent figurer dans ton `package.json`.  
> Si des bibliothèques manquent (ex: `chokidar`, `monaco-editor`), lance :  
> ```bash
> npm install chokidar monaco-editor
> ```

---

## Scripts utiles (`package.json`)

```json
{
  "scripts": {
    "dev": "vite",
    "start:electron": "electron .",
    "build": "vite build && electron-builder"
  }
}
```

---

## 📂Structure du projet

```
.gitignore
LICENSE
package.json
postcss.config.js
README.md
tailwind.config.js
vite.config.ts
src/
  main/
    fileManager.js      # gestion des opérations fs (read/write/stat, etc.)
    ipcHandlers.js      # handlers IPC + watchers (chokidar)
    main.js             # entry Electron (création de fenêtres, initialisation)
    windows.js          # utilitaires de création/gestion de fenêtres
  preload/
    preload.js          # expose l'API sécurisée (window.api) au renderer
  renderer/
    App.jsx
    index.html
    index.jsx
    style.css
    components/
      EditorTab.jsx
      FileExplorer.jsx
      Sidebar.jsx
    layouts/
      MainLayout.jsx
```

---

## ⚙️Fonctionnement principal

### Lazy loading + Watchers dynamiques (façon VSCode)

- **Lazy loading** : lecture du contenu d'un dossier uniquement lorsqu'il est déplié dans l'explorateur.
- **Watchers par dossier ouvert** : le renderer demande au main process de démarrer un watcher `chokidar` sur le dossier ouvert (profondeur 0).  
  Quand le dossier est replié, le watcher est arrêté.

- **IPC** : main <-> renderer pour propager les événements FS

---

## API exposée par `preload.js` (`window.api`)

- `openFolder()` → ouvre un dialog et renvoie le chemin choisi.
- `readDir(dirPath)` → lit un dossier (liste d'entries).
- `readFile(filePath)` / `writeFile(filePath, content)` → lecture/écriture de fichiers.
- `mkdir`, `copyFile`, `copyDir`, `rename` → opérations fs.
- `watchDir(dirPath)` / `unwatchDir(dirPath)` → démarrer/arrêter un watcher.
- `onFsEvent(callback)` / `offFsEvent(callback)` → s'abonner/se désabonner aux événements `fs-event`.

---

## ✅Avantages

- **Rapidité au lancement** : pas de scan massif au démarrage.
- **Scalabilité** : fonctionne sur de gros projets.
- **Réactivité** : mises à jour incrémentales.
- **Contrôle fin** : watchers uniquement sur les dossiers ouverts.

## ⚠️Limites

- Cohérence partielle : modifications dans les dossiers fermés non connues.
- Multiplication des watchers si beaucoup de dossiers ouverts.
- Pas de fonctionnalités IDE avancées par défaut.

---

## 🔧Conseils & optimisations

- Ignorer `node_modules`, `.git`, `dist` dans `chokidar`.
- Utiliser `awaitWriteFinish` pour éviter les doublons d'événements.
- Fermer les watchers inutilisés.
- Sur Linux, augmenter `fs.inotify.max_user_watches` si besoin.
- Pour la recherche globale : indexeur asynchrone en background.

---

---

## 📌Roadmap & améliorations possibles

- Indexation persistante pour recherche instantanée.
- Watch-file dédié sur le fichier ouvert.
- Terminal intégré & Debugger.
- Support multi-workspace.
- Extensions / plugins (LSP, linters, formatters).
- Packaging (electron-builder / electron-forge) et CI/CD.

---

## 🤝Contribution

- Fork → Branche feature → PR.
- Suivre les conventions du projet (lint, format).
- Ajouter des tests pour les nouvelles fonctionnalités.

---

MIT © Start'App Mada
