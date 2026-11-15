/* AMANA — outils de lecture des pages qui contiennent des traductions d'exemples (composants .paire-fr et .trad).
   Deux boutons, ajoutés en haut de la page (rien n'est ajouté si la page n'a aucune traduction d'exemple) :
   - « Masquer les traductions » : les traductions des exemples sont floutées ; un clic sur une ligne (ou sur sa traduction,
     ou Entrée / Espace au clavier) révèle la traduction de cette ligne seule, pour s'auto-tester ;
   - « Imprimer sans traductions » : ouvre l'impression de la page entière sans les traductions des exemples. Le reste du
     cours (règles, explications, consignes) est imprimé tel quel. L'affichage à l'écran n'est jamais modifié.
   Sans JavaScript, la page s'affiche et s'imprime normalement, avec toutes les traductions. Le bouton est masqué à l'impression. */
(function () {
  'use strict';
  var SEL = '.paire-fr, .trad';
  var racine = document.documentElement;

  function init() {
    if (!document.querySelector(SEL) || document.querySelector('.outils-lecture')) { return; }

    var barre = document.createElement('div');
    barre.className = 'outils-lecture noprint';
    barre.setAttribute('role', 'group');
    barre.setAttribute('aria-label', 'Outils de lecture');

    var masquer = bouton('Masquer les traductions');
    masquer.setAttribute('aria-pressed', 'false');
    var imprimer = bouton('Imprimer sans traductions');
    barre.appendChild(masquer);
    barre.appendChild(imprimer);

    var conteneur = document.querySelector('.container') || document.body;
    var titre = conteneur.querySelector('h1');
    if (titre && titre.parentNode) { titre.parentNode.insertBefore(barre, titre.nextSibling); }
    else { conteneur.insertBefore(barre, conteneur.firstChild); }

    function traductions() { return [].slice.call(document.querySelectorAll(SEL)); }

    function basculer(actif) {
      racine.classList.toggle('masque-trad', actif);
      masquer.setAttribute('aria-pressed', actif ? 'true' : 'false');
      masquer.textContent = actif ? 'Afficher les traductions' : 'Masquer les traductions';
      traductions().forEach(function (t) {
        t.classList.remove('revele');
        if (actif) { t.setAttribute('tabindex', '0'); t.setAttribute('role', 'button'); t.setAttribute('aria-label', 'Afficher la traduction'); }
        else { t.removeAttribute('tabindex'); t.removeAttribute('role'); t.removeAttribute('aria-label'); }
      });
    }

    masquer.addEventListener('click', function () { basculer(!racine.classList.contains('masque-trad')); });

    /* un clic sur la ligne arabe ou sur la traduction révèle (puis recache) la traduction de cette ligne */
    function reveler(cible) {
      var trad = cible.closest(SEL);
      if (!trad) { var ligne = cible.closest('.paire'); trad = ligne && ligne.querySelector('.paire-fr'); }
      if (trad) { trad.classList.toggle('revele'); }
    }
    document.addEventListener('click', function (e) {
      if (racine.classList.contains('masque-trad') && !e.target.closest('.outils-lecture')) { reveler(e.target); }
    });
    document.addEventListener('keydown', function (e) {
      if (!racine.classList.contains('masque-trad')) { return; }
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches(SEL)) { e.preventDefault(); reveler(e.target); }
    });

    /* impression sans traductions : la classe n'existe que le temps de l'impression */
    function nettoyer() { racine.classList.remove('impr-sans-trad'); }
    window.addEventListener('afterprint', nettoyer);
    imprimer.addEventListener('click', function () {
      racine.classList.add('impr-sans-trad');
      window.print();
    });
  }

  function bouton(texte) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = texte;
    return b;
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
}());
