/* AMANA — pages communes aux adultes et aux enfants (dossier Commun/).
   Chaque page n'existe qu'en un exemplaire. L'adresse ?public=enfants charge le thème enfant, remplace « Adultes »
   par « Enfants » dans le bandeau et garde le paramètre dans les liens vers les autres pages. Sans paramètre :
   apparence adultes (celle que donne aussi <noscript> si JavaScript est désactivé).
   Ce script se place dans le <head>, à la place du lien vers le thème : le thème est écrit au même endroit. */
(function () {
  var css = new URL('../css/', document.currentScript.src).href;
  var enfants = new URLSearchParams(location.search).get('public') === 'enfants';
  document.write('<link rel="stylesheet" href="' + css + (enfants ? 'theme-enfant.css' : 'theme-adulte.css') + '">');
  if (!enfants) { return; }
  /* La page est lue de haut en bas : on corrige la classe du <body> et le bandeau dès leur arrivée, avant l'affichage. */
  function corrige() {
    var b = document.body, n = document.querySelector('.brand-name');
    if (b && !b.classList.contains('enfant')) { b.classList.remove('adulte'); b.classList.add('enfant'); }
    if (n && /Adultes\s*$/.test(n.textContent)) { n.textContent = n.textContent.replace(/Adultes\s*$/, 'Enfants'); } // seulement si besoin : écrire dans le DOM relance l'observateur
  }
  var obs = new MutationObserver(corrige);
  obs.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', function () {
    obs.disconnect();
    corrige();
    [].forEach.call(document.querySelectorAll('a[href]'), function (a) {
      var m = a.getAttribute('href').match(/^([^:?#]*\.html)(#.*)?$/);
      if (m) { a.setAttribute('href', m[1] + '?public=enfants' + (m[2] || '')); }
    });
  });
}());
