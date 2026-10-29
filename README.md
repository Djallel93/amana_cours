# AMANA — Cours d'arabe

Pour consulter les cours en local : `sh serve.sh`, puis ouvrir http://localhost:8000/.
Le script utilise PHP, BusyBox, Node ou Ruby, selon ce qui est installé (pas de Python).
Ouvrir `index.html` via le portail d'un navigateur Flatpak/Snap ne fonctionne pas : les pages liées ne sont pas exposées.

## Organisation des dossiers

```
Adultes/niveau-x/<dossier>/page.html
Enfants/<tranche>-ans/niveau-x/<dossier>/page.html
Commun/niveau-x/<dossier>/page.html        pages communes aux adultes et aux enfants
Enfants/aides, Enfants/guide-enseignant, Enfants/placement
```

`<dossier>` : `cours`, `exercices`, `revisions`, `corriges_revisions`, `evaluations` (et `textes`, `vocabulaire` selon le niveau).

| Dossier enfants | Contenu |
|---|---|
| `Enfants/6-15-ans/` | niveaux 1 à 3 (un seul jeu pour toutes les tranches d'âge) |
| `Enfants/9-11-ans/` et `Enfants/12-15-ans/` | niveau 4-1 par tranche d'âge ; `12-15-ans` contient aussi le niveau 4-2 |
| `Commun/niveau-4-1/` | `textes` et `vocabulaire` du niveau 4-1, communs aux adultes et aux deux tranches d'âge (voir ci-dessous) |

Une page déplacée ou ajoutée doit figurer dans `index.html` (liens `href` et `data-p`) : c'est lui qui alimente les livres.

## Pages communes aux adultes et aux enfants (`Commun/`)

Les textes et le vocabulaire du niveau 4-1 sont les mêmes pour les adultes et les enfants : ils n'existent qu'en un exemplaire, dans `Commun/niveau-4-1/`, avec le fichier `niveau-4-1.csv` dont vient le vocabulaire. Seule l'apparence change : `…page.html?public=enfants` charge, via `js/public.js`, le thème enfant et le bandeau « Enfants », et garde le paramètre dans les liens. Sans paramètre, la page s'affiche en version adultes (c'est aussi le repli sans JavaScript).

- `index.html` liste ces pages sous les deux publics ; sous Enfants, leurs liens reçoivent `?public=enfants`. `js/livre.js` les reprend dans les livres des deux publics.
- Dans une page commune, `js/public.js` est placé dans le `<head>` à la place du lien vers le thème, suivi d'un `<noscript>` qui charge le thème adultes.
- Pour qu'une page des enfants (guide, cours…) ouvre une page commune avec l'apparence enfant, son lien doit porter `?public=enfants`.
- Un texte ou un vocabulaire qui doit différer selon le public ne peut pas être commun : il resterait dans `Adultes/` et `Enfants/`, mais les pages communes voisines pointent vers leurs voisines, donc toute la série bascule ensemble.
- Autres niveaux : le niveau 3 garde un fichier `niveau-3.csv` par public (numérotation des séances propre à chaque cours).

## Garçons et filles (enfants, niveaux 1 à 3 et aides)

Les pages sont les mêmes pour tous ; seule l'apparence change. L'adresse `…page.html?genre=filles` charge, via `js/genre.js`, le thème « filles » du niveau et garde le paramètre dans les liens de page en page. Sans paramètre : apparence d'origine (garçons).

| Contenu | Thème filles | Fichier |
|---|---|---|
| Niveaux 1 et 2, aides | Jardin (rose et menthe) | `css/theme-enfant-filles-jardin.css` |
| Niveau 3 | Rose & Or (rose, filets dorés, titres en Amiri) | `css/theme-enfant-filles-rose-or.css` |

- Les thèmes ne redéfinissent que les variables de `css/theme-enfant.css` (couleurs, repères, rayon des angles). Pour modifier un thème, éditer son fichier ; pour en ajouter un, copier un fichier existant et adapter le choix dans `js/genre.js`.
- `index.html` génère lui-même la section « Enfants · Filles » à partir de la section « Enfants · Garçons » : rien à dupliquer. Chaque section a ses boutons « Imprimer le livre » (`livre.html?public=Enfants&niveau=niveau-1&genre=filles`, `…&genre=garcons`) ; la couverture porte « Enfants · Filles » ou « Enfants · Garçons ».
- Une nouvelle page des niveaux 1 à 3 ou des aides enfants doit contenir, juste avant `</head>`, `<script src="…/js/genre.js"></script>` (chemin relatif vers `js/`), comme les pages existantes.
- Les niveaux 4-1 et 4-2 ne sont pas concernés : pas de paramètre `genre`.

## Feuilles de style propres à certaines pages

Quelques règles ne concernent que certaines pages (tableaux des cours d'adultes du niveau 4-2, révisions…). Elles sont dans `css/page-tableaux.css`, `css/page-revisions.css` et `css/page-sources.css`, liées dans le `<head>` des seules pages concernées (et non dans `amana-content.css`, qui s'applique à toutes). `js/livre.js` charge aussi ces feuilles et les limite à la page, comme un bloc `<style>` de page. Les blocs `<style>` isolés restent dans leur page.

## Imprimer un livre

Sur la page d'accueil, sous chaque public d'un niveau, le bouton « Imprimer le livre » ouvre `livre.html`, qui assemble le livre de l'élève (couverture, sommaire, puis cours, textes, exercices, révisions et vocabulaire) et propose de l'imprimer ou de l'enregistrer en PDF. Il faut passer par `sh serve.sh` : le livre est assemblé par JavaScript et ne fonctionne pas depuis un fichier ouvert directement.

- **Exclus** : guide enseignant, test de placement, évaluations (y compris `revisions/bilan.html`), corrigés, aides, encadrés « Pour l'enseignant » et mini-évaluations de fin de cours. Règle générale : le livre contient ce que les pages impriment déjà (tout élément `noprint` est retiré).
- **Ordre** : pour chaque cours, le cours, ses textes, puis ses exercices ; ensuite les révisions, puis le vocabulaire. Un exercice suit le cours qui renvoie vers lui (au niveau 2, chaque partie A, B ou C d'un fichier d'exercices suit le dernier cours qui la cite) ; à défaut, le cours de même nom.
- **Textes** : ceux du niveau 4-2 se rattachent au cours cité dans leur introduction (« … (cours 26) »). Ceux du niveau 4-1 sont rattachés par la table `TEXTES` en tête de `js/livre.js`, à modifier si un texte change de cours. Un texte non rattaché est placé en fin de livre.
- **Révisions du niveau 4-2 (adultes)** : cinq unités de rentrée `revisions/revision-01_…` à `revision-05_…` (R1 : cours 24 à 28, R2 : 29 à 35, R3 : 36 à 42, R4 : 43 à 46, R5 : 47 à 52) regroupent synthèse, exercices et textes de pratique. Leurs corrigés sont dans `corriges_revisions/` et ne sont pas imprimés.
- **Révisions du niveau 4-1 (adultes)** : six unités de rentrée `revisions/revision-01_…` à `revision-06_…` (R1 : cours 1 à 5, R2 : 6 à 9, R3 : 10 à 12, R4 : 13 à 16, R5 : 17 à 19, R6 : 20 à 23), même principe que pour le 4-2. Corrigés dans `corriges_revisions/`, non imprimés.
- **Révisions enfants (niveaux 4-1 et 4-2)** : mêmes unités de rentrée, adaptées à chaque livre : 4-1 de 9 à 11 ans (`Enfants/9-11-ans/niveau-4-1/revisions/`, 3 unités, cours 1 à 12), 4-1 de 12 à 15 ans (`Enfants/12-15-ans/niveau-4-1/revisions/`, 6 unités, cours 1 à 26), 4-2 (`Enfants/12-15-ans/niveau-4-2/revisions/`, 4 unités, cours 1 à 15). Corrigés dans `corriges_revisions/` (non imprimés).
- **Révisions de rentrée des niveaux 1 à 3 (adultes et enfants)** : unités `revisions/synthese-NN_…` (niveau 1 : 2 unités ; niveau 2 : 4 ; niveau 3 : 6), avec synthèse, exercices et, au niveau 3, textes vocalisés. Elles s’impriment après les anciennes fiches `revision-NN.html`, qui restent inchangées. Corrigés dans `corriges_revisions/` (non imprimés).
- **Nouvelle page** : elle entre dans le livre dès qu'elle figure dans `index.html` (la liste des pages vient de l'index).
- **Impression** : format A4, échelle 100 %, « En-têtes et pieds de page » décoché. Les numéros de page sont ajoutés par Chrome/Edge récents ; le sommaire n'en comporte pas.

### Imprimer les documents (placement, enseignant, aides)

Trois documents s'impriment aussi avec `livre.html`, depuis les boutons de la page d'accueil, sous le bloc concerné :

- **Test de placement** (`livre.html?doc=placement`) : un seul document pour les adultes et les enfants, avec une rubrique « Adultes » puis une rubrique « Enfants ». Il contient les feuilles du candidat ; le corrigé reste réservé à l'enseignant et ne s'imprime pas (comme sur les pages).
- **Aides à l'enseignant** (`livre.html?doc=enseignant`) : un seul document pour les adultes et les enfants (guides par niveau, mode d'emploi, fiche de préparation de séance).
- **Aides pour les élèves** (`livre.html?doc=aides&public=Adultes` ou `Enfants`) : un document par public ; pour les enfants, un document garçons et un document filles (`&genre=garcons` / `&genre=filles`).

Chaque page garde le thème de son public (sobre pour les adultes, coloré pour les enfants). Une nouvelle page entre dans le document dès qu'elle est présente dans le dossier `placement`, `guide-enseignant` ou `aides` du public.
