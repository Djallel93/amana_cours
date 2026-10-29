/* AMANA — thème « filles » des niveaux 1 à 3 et des aides, côté enfants.
   Les pages sont les mêmes pour les garçons et les filles : l'adresse ?genre=filles ajoute la feuille de style du
   thème choisi et garde le paramètre dans les liens vers les autres pages. Sans paramètre (ou genre=garcons) :
   apparence d'origine, rien n'est modifié.
   Thème : « Jardin » pour les niveaux 1 et 2 et pour les aides, « Rose & Or » pour le niveau 3.
   Dans livre.html, le niveau est donné par le paramètre niveau (sinon on le lit dans le chemin de la page). */
(function () {
  var q = new URLSearchParams(location.search);
  if (q.get('genre') !== 'filles') { return; }
  var ref = q.get('niveau') || location.pathname;
  var id = /niveau-3(\/|$)/.test(ref) ? 'rose-or' : 'jardin';
  var css = new URL('../css/theme-enfant-filles-' + id + '.css', document.currentScript.src).href;
  document.documentElement.classList.add('filles-' + id);
  var l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = css;
  document.head.appendChild(l);
  /* Les liens vers d'autres pages du site gardent le paramètre (la page reste « filles » de page en page). */
  document.addEventListener('DOMContentLoaded', function () {
    [].forEach.call(document.querySelectorAll('a[href]'), function (a) {
      var m = a.getAttribute('href').match(/^([^:?#]*\.html)(#.*)?$/);
      if (m) { a.setAttribute('href', m[1] + '?genre=filles' + (m[2] || '')); }
    });
  });
}());
