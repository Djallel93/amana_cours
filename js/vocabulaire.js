/* AMANA — vocabulaire du niveau 4-1 : amélioration progressive (la page reste lisible et imprimable sans JavaScript).
   - page d'une séance : mode auto-test (cacher l'arabe ou le français, cliquer sur une case pour la révéler) ;
   - index : recherche d'un mot, en arabe (avec ou sans voyelles) ou en français (avec ou sans accents). */
(function () {
  'use strict';

  function norm(s) {
    return String(s).normalize('NFD')
      .replace(/[ً-ٰٟـ]/g, '')
      .replace(/[̀-ͯ]/g, '')
      .replace(/ى/g, 'ي').replace(/ة/g, 'ه')
      .toLowerCase().trim();
  }

  function autoTest(table) {
    var bar = document.createElement('div');
    bar.className = 'vocab-tools noprint';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Mode auto-test');
    var hint = document.createElement('span');
    hint.textContent = 'Auto-test :';
    bar.appendChild(hint);
    var modes = [['ar', 'Cacher l’arabe'], ['fr', 'Cacher le français'], ['', 'Tout afficher']];
    var buttons = modes.map(function (m) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = m[1];
      b.dataset.mode = m[0];
      bar.appendChild(b);
      return b;
    });
    var wrapper = table.closest('.table-wrapper') || table;
    wrapper.parentNode.insertBefore(bar, wrapper);

    function set(mode) {
      if (mode) { table.dataset.masque = mode; } else { delete table.dataset.masque; }
      [].forEach.call(table.querySelectorAll('td.show'), function (c) { c.classList.remove('show'); });
      [].forEach.call(table.querySelectorAll('td.c-ar, td.c-fr'), function (c) {
        if (mode && c.classList.contains('c-' + mode)) { c.setAttribute('tabindex', '0'); } else { c.removeAttribute('tabindex'); }
      });
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === mode)); });
    }
    buttons.forEach(function (b) { b.addEventListener('click', function () { set(b.dataset.mode); }); });
    function toggle(e) {
      var mode = table.dataset.masque;
      var cell = e.target.closest ? e.target.closest('td.c-ar, td.c-fr') : null;
      if (!mode || !cell || !cell.classList.contains('c-' + mode)) { return; }
      cell.classList.toggle('show');
    }
    table.addEventListener('click', toggle);
    table.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(e); }
    });
    set('');
  }

  function search(items) {
    var input = document.createElement('input');
    input.type = 'search';
    input.className = 'vocab-search noprint';
    input.placeholder = 'Chercher un mot (arabe ou français)…';
    input.setAttribute('aria-label', 'Chercher un mot dans le vocabulaire');
    var count = document.createElement('p');
    count.className = 'vocab-count noprint';
    count.setAttribute('aria-live', 'polite');
    var first = items[0].closest('section') || items[0].parentNode;
    first.parentNode.insertBefore(input, first);
    first.parentNode.insertBefore(count, first);
    var sections = [].slice.call(document.querySelectorAll('section.mois'));
    input.addEventListener('input', function () {
      var q = norm(input.value);
      var shown = 0;
      items.forEach(function (li) {
        var ok = !q || (li.getAttribute('data-q') || '').indexOf(q) !== -1;
        li.hidden = !ok;
        if (ok) { shown++; }
      });
      sections.forEach(function (s) { s.hidden = !s.querySelector('li:not([hidden])'); });
      count.textContent = q ? (shown ? shown + (shown > 1 ? ' séances contiennent' : ' séance contient') + ' ce mot.' : 'Aucune séance ne contient ce mot.') : '';
    });
  }

  function init() {
    var table = document.querySelector('table.vocab');
    if (table) { autoTest(table); }
    var items = document.querySelectorAll('.vocab-index li[data-q]');
    if (items.length) { search([].slice.call(items)); }
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
}());
