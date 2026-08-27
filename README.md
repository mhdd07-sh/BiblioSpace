# BiblioSpace

BiblioSpace est une application web de gestion de bibliothèque permettant aux membres de consulter un catalogue de livres, d'effectuer des emprunts et de suivre leur historique. Un espace d'administration permet également de gérer les livres et les emprunts.

##  Objectifs

- Consulter et rechercher des livres.
- Filtrer les livres par catégorie et disponibilité.
- Consulter les détails d'un livre.
- Permettre aux membres d'emprunter des livres.
- Suivre les emprunts, retards et retours.
- Permettre à l'administrateur de gérer les livres et les emprunts.
- Proposer un mode clair et un mode sombre.

## Technologies

- **Node.js**
- **Express.js**
- **PostgreSQL** — utilisateurs, catégories et emprunts
- **JSON (`db.json`)** — informations des livres
- **HTML5 / CSS3**
- **JavaScript**
- **JWT** — authentification


## Fonctionnalités membre

- Inscription et connexion.
- Consultation du catalogue.
- Recherche par titre, auteur ou informations du livre.
- Filtrage par catégorie et disponibilité.
- Consultation des détails d'un livre.
- Emprunt d'un livre disponible.
- Consultation des emprunts personnels.
- Affichage des emprunts en cours, retards et retours.
- Déconnexion.

## Fonctionnalités administrateur

- Tableau de bord avec statistiques.
- Nombre de livres, membres, emprunts actifs et retards.
- Ajout d'un livre.
- Modification d'un livre.
- Suppression d'un livre avec confirmation.
- Recherche et consultation des livres.
- Consultation de tous les emprunts.
- Enregistrement du retour d'un livre.

##  Gestion des livres

Les livres sont stockés dans :

```text
data/db.json
```

Exemple :

```json
{
  "id": 1,
  "title": "Le Petit Prince",
  "author": "Antoine de Saint-Exupéry",
  "genre": "Roman",
  "isbn": "9782070612758",
  "pages": 96,
  "publishedYear": 1943,
  "publisher": "Gallimard",
  "description": "Description du livre.",
  "cover": "URL_DE_L_IMAGE",
  "stock": 3,
  "availableStock": 3,
  "available": true
}
```

### Catégories

- Droit
- Économie
- Histoire
- Informatique
- Mathématiques
- Roman
- Science-fiction
- Philosophie
- Poésie
- Littérature africaine
- Sciences

##  Emprunts

Lors d'un emprunt, l'application vérifie :

1. la limite d'emprunts actifs du membre ;
2. l'existence du livre ;
3. la disponibilité du stock ;
4. l'absence d'un emprunt actif identique.

L'emprunt est ensuite enregistré et le stock disponible est diminué.

La durée actuelle d'un emprunt est de **7 jours**.

Lors d'un retour, l'emprunt passe à `RETOURNE`, la date de retour est enregistrée et le stock disponible est augmenté.

### Statuts

- `EN_COURS`
- `EN_RETARD`
- `RETOURNE`

## Authentification

L'application utilise des tokens **JWT** pour authentifier les utilisateurs.

Deux rôles sont utilisés :

```text
member
admin
```

Les routes réservées à l'administration sont protégées par des contrôles d'authentification et de rôle.

##  Installation

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer PostgreSQL

Configurer la base de données et les paramètres de connexion utilisés par l'application.

Les informations sensibles doivent être placées dans `.env`.


### 4. Démarrer l'application

Selon le contenu de `package.json` :

```bash
npm start
```

ou :

```bash
npm run dev
```

Puis ouvrir :

```text
http://localhost:3000
```

##  Sécurité

Ne jamais publier dans un dépôt public :

- mots de passe PostgreSQL ;
- secrets JWT ;
- clés API ;
- tokens ;
- fichiers `.env` ;
- données personnelles réelles.


