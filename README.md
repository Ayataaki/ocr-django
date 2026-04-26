#  SANAD — Système de Gestion Électronique de Documents (GED)

##  Description

SANAD est une application web développée avec **Django** permettant la gestion électronique de documents (GED).  
Elle facilite la gestion des **clients**, **dossiers**, et **documents**, avec des fonctionnalités dynamiques comme la recherche en temps réel et l'organisation des fichiers.

---

##  Fonctionnalités principales

###  Gestion des clients
- Recherche dynamique (autocomplete)
- Sélection rapide d’un client existant
- Liaison avec les dossiers

###  Gestion des dossiers
- Affichage des dossiers liés à un client
- Création de nouveaux dossiers
- Sélection dynamique

###  Gestion des documents
- Upload de fichiers
- Association à un dossier
- Préparation pour OCR (texte extrait)

###  Système de rôles
- Admin
- Opérateur
- (Extensible)

---

##  Installation

### 1. Cloner le projet
```bash
git clone <repo-url>
cd sanad_project
````

---

### 2. Créer un environnement virtuel

```bash
python -m venv venv
```

#### Activation

* Windows :

```bash
venv\Scripts\activate
```

* Linux / Mac :

```bash
source venv/bin/activate
```

---

### 3. Installer les dépendances

```bash
pip install -r requirements.txt
```

---

### 4. Appliquer les migrations

```bash
python manage.py migrate
```

---

### 5. Charger les rôles

```bash
python manage.py loaddata roles.json
```

---

### 6. Le compte d'administrateur créé automatiquement après la migration

```bash
python manage.py seed
```

 Compte par défaut :

* username : `admin`
* password : `admin123`

---

### 7. Lancer le serveur

```bash
python manage.py runserver
```

---

##  API utilisées

###  Recherche client

```
GET /accounts/clients/search/?q=nom
```

---

###  Dossiers par client

```
GET /docs/dossiers/client/<client_id>/
```

---

###  Création dossier

```
POST /api/create-dossier/
```

---

##  Bonnes pratiques appliquées

* Séparation Frontend / Backend (AJAX)
* Utilisation de `fetch` pour les appels API
* Architecture modulaire Django
* Fixtures pour initialisation des données
* Commande custom pour seed

---

##  Points d’attention

* Vérifier les URLs API en cas d’erreur
* Vérifier les IDs HTML (client-id, dossier-select…)
* Toujours tester les endpoints avant le frontend
* Activer CSRF en production

---

##  Évolutions futures

* OCR automatique (Tesseract / AI)
* Indexation intelligente des documents
* Recherche avancée
* Gestion des permissions avancées
* Dashboard analytics

---

## Auteur

Projet réalisé dans le cadre d’un système GED avancé avec Django.

---

##  Licence

Ce projet est open-source et libre d’utilisation.

```
