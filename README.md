# AMANA — Cours d'arabe

Pour consulter les cours en local : `sh serve.sh`, puis ouvrir http://localhost:8000/.
Le script utilise PHP, BusyBox, Node ou Ruby, selon ce qui est installé (pas de Python).
Ouvrir `index.html` via le portail d'un navigateur Flatpak/Snap ne fonctionne pas : les pages liées ne sont pas exposées.

## Imprimer un livre

Sur la page d'accueil, sous chaque public d'un niveau, le bouton « Imprimer le livre » ouvre `livre.html`, qui assemble le livre de l'élève (couverture, sommaire, puis cours, textes, exercices, révisions et vocabulaire) et propose de l'imprimer ou de l'enregistrer en PDF. Il faut passer par `sh serve.sh` : le livre est assemblé par JavaScript et ne fonctionne pas depuis un fichier ouvert directement.

- **Exclus** : guide enseignant, test de placement, évaluations (y compris `revisions/bilan.html`), corrigés, aides, encadrés « Pour l'enseignant » et mini-évaluations de fin de cours. Règle générale : le livre contient ce que les pages impriment déjà (tout élément `noprint` est retiré).
- **Ordre** : pour chaque cours, le cours, ses textes, puis ses exercices ; ensuite les révisions, puis le vocabulaire. Un exercice suit le cours qui renvoie vers lui (au niveau 2, chaque partie A, B ou C d'un fichier d'exercices suit le dernier cours qui la cite) ; à défaut, le cours de même nom.
- **Textes** : ceux du niveau 4-2 se rattachent au cours cité dans leur introduction (« … (cours 26) »). Ceux du niveau 4-1 sont rattachés par la table `TEXTES` en tête de `js/livre.js`, à modifier si un texte change de cours. Un texte non rattaché est placé en fin de livre.
- **Nouvelle page** : elle entre dans le livre dès qu'elle figure dans `index.html` (la liste des pages vient de l'index).
- **Impression** : format A4, échelle 100 %, « En-têtes et pieds de page » décoché. Les numéros de page sont ajoutés par Chrome/Edge récents ; le sommaire n'en comporte pas.
