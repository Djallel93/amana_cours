/* AMANA — livre imprimable d'un niveau, ou document imprimable (test de placement, guide enseignant, aides).
   Usage : livre.html?public=Adultes|Enfants&niveau=niveau-3[&tranche=9-11]
           livre.html?doc=placement | enseignant            (un seul document pour adultes ET enfants)
           livre.html?doc=aides&public=Adultes|Enfants      (un document par public)

   Le livre réunit, pour un niveau et un public : cours, textes de lecture, exercices, révisions et vocabulaire.
   Il EXCLUT tout ce qui est réservé à l'enseignant ou à l'évaluation : guide enseignant, test de placement,
   évaluations, corrigés, aides. Règle générale : le livre contient exactement ce que les pages impriment déjà
   (tout élément « noprint », dont les corrigés intégrés et les encadrés « Pour l'enseignant », est retiré).

   Principe : la liste des pages vient de index.html (aucune liste à maintenir ici) ; chaque page est
   récupérée, nettoyée, puis assemblée. Les identifiants sont préfixés, les liens entre pages deviennent des
   liens internes au livre, et les <style> propres à une page sont limités à cette page.
   Nécessite un serveur HTTP (voir serve.sh) : fetch() ne fonctionne pas depuis file://.

   Documents : mêmes pages, même nettoyage, mais le contenu est celui d'un dossier (placement, guide-enseignant,
   aides), page après page. Dans un document mixte (adultes et enfants), chaque page garde l'apparence de son
   public : les feuilles de style de chaque public sont limitées aux sections de ce public.

   Ordre du livre : pour chaque cours, le cours, puis ses textes, puis ses exercices ; ensuite les révisions,
   puis le vocabulaire. Un exercice suit le cours qui renvoie vers lui (au niveau 2, chaque partie A/B/C d'un
   fichier d'exercices suit le dernier cours qui renvoie vers cette partie) ; à défaut, le cours de même nom. */
(function () {
  'use strict';

  /* ================= Données éditables ================= */

  /* Rattachement des textes de lecture aux cours, par livre.
     Clé du livre : « Public/niveau[/tranche] » ; puis numéro de cours → noms de fichiers des textes (sans .html),
     dans l'ordre d'impression. La clé 'fin' regroupe des « Lectures complémentaires » placées après les cours.
     Un texte absent de cette table est rattaché au cours cité dans son introduction (« … (cours 26) »), sinon
     placé en fin de livre. Les textes du niveau 4-2 adultes se rattachent ainsi, sans table. */
  var TEXTES = {
    'Adultes/niveau-4-1': {
      '06': ['seance-09_la_famille_du_prophete_et_la_mosquee', 'seance-09_allons_a_la_mosquee', 'seance-11_ahmed_nouvel_etudiant'],
      '07': ['seance-12_ahmed_et_l_heure'],
      '08': ['seance-13_la_journee_d_ahmed'],
      '09': ['seance-14_un_voyage_dans_une_ville_ancienne'],
      '10': ['seance-16_la_famille_d_ahmed'],
      '12': ['seance-17_au_marche_pain_fromage_oeufs', 'seance-18_chez_le_marchand', 'seance-19_au_marche_karim_et_sami', 'seance-24_au_marche_avec_ahmed'],
      '15': ['seance-26_reveille_toi_ahmed'],
      '19': ['seance-33_au_parc_les_loisirs'],
      '22': ['seance-34_passe_temps_et_metier'],
      '23': ['seance-36_rendez_vous_au_marche']
    },
    'Enfants/niveau-4-1/12-15': {
      '04': ['seance-16_la_famille_d_ahmed'],
      '08': ['seance-09_la_famille_du_prophete_et_la_mosquee', 'seance-09_allons_a_la_mosquee', 'seance-11_ahmed_nouvel_etudiant'],
      '09': ['seance-12_ahmed_et_l_heure'],
      '12': ['seance-26_reveille_toi_ahmed'],
      '14': ['seance-14_un_voyage_dans_une_ville_ancienne'],
      '16': ['seance-13_la_journee_d_ahmed'],
      '20': ['seance-33_au_parc_les_loisirs'],
      '21': ['seance-34_passe_temps_et_metier'],
      '25': ['seance-17_au_marche_pain_fromage_oeufs', 'seance-18_chez_le_marchand', 'seance-19_au_marche_karim_et_sami', 'seance-24_au_marche_avec_ahmed'],
      '26': ['seance-36_rendez_vous_au_marche']
    },
    'Enfants/niveau-4-1/9-11': {
      '04': ['seance-16_la_famille_d_ahmed'],
      '06': ['seance-24_au_marche_avec_ahmed'],
      '08': ['seance-26_reveille_toi_ahmed'],
      '09': ['seance-09_la_famille_du_prophete_et_la_mosquee', 'seance-09_allons_a_la_mosquee', 'seance-11_ahmed_nouvel_etudiant'],
      '10': ['seance-13_la_journee_d_ahmed', 'seance-14_un_voyage_dans_une_ville_ancienne'],
      '12': ['seance-17_au_marche_pain_fromage_oeufs', 'seance-18_chez_le_marchand', 'seance-19_au_marche_karim_et_sami', 'seance-33_au_parc_les_loisirs', 'seance-36_rendez_vous_au_marche'],
      'fin': ['seance-12_ahmed_et_l_heure', 'seance-34_passe_temps_et_metier']
    }
  };

  /* Pages jamais incluses, même si leur dossier l'est : « bilan » est une évaluation ; l'index du vocabulaire
     n'a de sens qu'à l'écran (le livre reprend les pages de séance, une par une). */
  var EXCLUS = ['revisions/bilan.html', 'vocabulaire/index.html'];
  /* Dossiers propres à une tranche d'âge (cours, exercices) ou communs à tout le niveau. */
  var DOSSIERS_TRANCHE = ['cours', 'exercices'];
  /* Les révisions sont communes au niveau (revisions/) ou propres à une tranche d'âge (9-11/revisions/). */
  var DOSSIERS_COMMUNS = ['textes', 'vocabulaire', 'revisions'];
  var LIBELLES = { cours: 'Cours', texte: 'Texte', exercices: 'Exercices', revision: 'Révision', vocabulaire: 'Vocabulaire' };
  /* Documents : dossier regroupé ; « mixte » = un seul document pour les adultes ET les enfants. */
  var DOCS = {
    placement: { dossier: 'placement', mixte: true, note: 'Test de départ : feuilles du candidat (le corrigé reste réservé à l’enseignant).' },
    enseignant: { dossier: 'guide-enseignant', mixte: true, note: 'Documents à l’usage des enseignants.' },
    aides: { dossier: 'aides', mixte: false, note: 'Pages de référence pour l’élève.' }
  };

  /* ================= Paramètres ================= */

  var params = new URLSearchParams(location.search);
  var book = { pub: params.get('public') || '', niveau: params.get('niveau') || '', tranche: params.get('tranche') || '' };
  var docName = params.get('doc') || '';
  var isDoc = docName !== '';
  var docDef = Object.prototype.hasOwnProperty.call(DOCS, docName) ? DOCS[docName] : null;
  var valid = isDoc
    ? !!docDef && (docDef.mixte || /^(Adultes|Enfants)$/.test(book.pub))
    : /^(Adultes|Enfants)$/.test(book.pub) && /^niveau-[A-Za-z0-9-]+$/.test(book.niveau) && /^(\d+-\d+)?$/.test(book.tranche);
  var mixed = isDoc && !!docDef && docDef.mixte;
  var theme = book.pub === 'Enfants' ? 'enfant' : 'adulte';
  var bookKey = isDoc ? 'doc:' + docName + (mixed ? '' : '/' + book.pub) : book.pub + '/' + book.niveau + (book.tranche ? '/' + book.tranche : '');
  var ROOT = new URL('.', location.href);

  var el = {
    host: document.getElementById('livre'), nom: document.getElementById('bk-nom'),
    statut: document.getElementById('bk-statut'), bouton: document.getElementById('bk-imprimer')
  };
  var warnings = [];
  var counter = 0;
  var reg = { first: {}, ids: {} }; // chemin de page → première section ; « chemin#id » → id dans le livre

  function setStatus(msg, isError) {
    el.statut.textContent = msg;
    el.statut.className = 'bk-statut' + (isError ? ' bk-erreur' : '');
  }
  function fail(msg) {
    setStatus(msg, true);
    document.body.setAttribute('data-livre', 'erreur');
  }

  /* ================= Utilitaires ================= */

  function getText(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) { throw new Error(r.status + ' ' + url); }
      return r.text();
    });
  }
  function natural(a, b) { return a.file.localeCompare(b.file, 'fr', { numeric: true }); }
  function pageUrl(page) { return new URL(page.path, ROOT); }
  function remove(n) { if (n.parentNode) { n.parentNode.removeChild(n); } }
  function unwrap(n) {
    while (n.firstChild) { n.parentNode.insertBefore(n.firstChild, n); }
    remove(n);
  }
  function norm(s) { return String(s).replace(/\s+/g, ' ').trim(); }

  /* Exécute fn sur chaque élément, n à la fois. */
  function pool(items, n, fn) {
    return new Promise(function (resolve, reject) {
      var next = 0, done = 0, failed = false;
      if (!items.length) { resolve(); return; }
      function run() {
        if (failed || next >= items.length) { return; }
        var i = next++;
        fn(items[i]).then(function () {
          done++;
          setStatus('Chargement des pages : ' + done + ' / ' + items.length);
          if (done === items.length) { resolve(); } else { run(); }
        }, function (e) { failed = true; reject(e); });
      }
      for (var k = 0; k < Math.min(n, items.length); k++) { run(); }
    });
  }

  /* Adresse d'un lien, exprimée comme chemin relatif à la racine du site, ou null si hors du site. */
  function keyOf(href, base) {
    var u;
    try { u = new URL(href, base); } catch (e) { return null; }
    if (u.origin !== ROOT.origin || u.pathname.indexOf(ROOT.pathname) !== 0) { return null; }
    var hash = '';
    try { hash = decodeURIComponent(u.hash.slice(1)); } catch (e2) { hash = u.hash.slice(1); }
    var path = u.pathname.slice(ROOT.pathname.length);
    try { path = decodeURIComponent(path); } catch (e3) { /* chemin laissé tel quel */ }
    return { path: path, hash: hash };
  }

  /* ================= Choix des pages ================= */

  function classify(path) {
    var base = book.pub + '/' + book.niveau + '/';
    if (path.indexOf(base) !== 0 || !/\.html$/.test(path)) { return null; }
    var rest = path.slice(base.length).split('/');
    var tr = '';
    if (/^\d+-\d+$/.test(rest[0])) { tr = rest.shift(); }
    if (rest.length !== 2) { return null; }
    var cat = rest[0], file = rest[1];
    if (EXCLUS.indexOf(cat + '/' + file) !== -1) { return null; }
    if (DOSSIERS_TRANCHE.indexOf(cat) !== -1) { if (tr !== book.tranche) { return null; } }
    else if (DOSSIERS_COMMUNS.indexOf(cat) !== -1) { if (tr && !(cat === 'revisions' && tr === book.tranche)) { return null; } }
    else { return null; }
    var num = (file.match(/^(\d+)/) || [])[1] || '';
    return { path: path, cat: cat, file: file, base: file.replace(/\.html$/, ''), num: num };
  }

  /* Document : toutes les pages du dossier (placement, guide-enseignant, aides) du ou des public(s) concerné(s). */
  function classifyDoc(path) {
    var m = path.match(/^(Adultes|Enfants)\/([^/]+)\/([^/]+\.html)$/);
    if (!m || m[2] !== docDef.dossier || (!docDef.mixte && m[1] !== book.pub)) { return null; }
    return { path: path, cat: 'doc', pub: m[1], file: m[3], base: m[3].replace(/\.html$/, ''), num: '' };
  }

  /* ================= Nettoyage d'une page ================= */

  /* « Évaluation » en fin de cours (niveaux 1 et 2) : dictée dirigée par l'enseignant, retirée du livre. */
  function dropEvaluation(box) {
    var dropping = false;
    [].slice.call(box.childNodes).forEach(function (n) {
      if (n.nodeType === 1 && /^H[12]$/.test(n.tagName)) { dropping = /^(mini-)?évaluation/i.test(n.textContent.trim()); }
      if (dropping) { box.removeChild(n); }
    });
  }

  function prepare(page, html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var box = doc.querySelector('.container') || doc.body;
    page.raw = box.textContent; // avant nettoyage : sert à lire « (cours N) » dans l'introduction des textes
    page.styles = [].map.call(doc.querySelectorAll('style'), function (s) { return s.textContent; });
    [].forEach.call(box.querySelectorAll('nav, script, style, link, .noprint, .corrige'), remove);
    if (page.cat === 'cours') { dropEvaluation(box); }
    page.box = box;
  }

  function isPartHeading(n) { return n.nodeType === 1 && n.tagName === 'H2' && n.classList.contains('part') && !!n.id; }
  function partIds(page) {
    return [].filter.call(page.box.childNodes, isPartHeading).map(function (n) { return n.id; });
  }
  /* Titre de la page, puis le contenu de la partie demandée (de son titre « h2.part » jusqu'au suivant). */
  function partNodes(page, id) {
    var out = [], on = false, h1 = page.box.querySelector('h1');
    if (h1) { out.push(h1); }
    [].slice.call(page.box.childNodes).forEach(function (n) {
      if (isPartHeading(n)) { on = (n.id === id); }
      if (on) { out.push(n); }
    });
    return out;
  }

  /* ================= Ordre du livre ================= */

  function plan(pages) {
    var by = { cours: [], exercices: [], textes: [], vocabulaire: [], revisions: [] };
    pages.forEach(function (p) { by[p.cat].push(p); });
    Object.keys(by).forEach(function (k) { by[k].sort(natural); });

    var items = {};  // chemin du cours → exercices (ou parties d'exercices) qui le suivent
    var texts = {};  // numéro du cours → textes qui le suivent
    function push(map, key, v) { (map[key] = map[key] || []).push(v); }

    /* Exercices : rattachés au DERNIER cours qui renvoie vers eux (ou vers une de leurs parties A/B/C). */
    var exoByPath = {};
    by.exercices.forEach(function (e) { exoByPath[e.path] = e; });
    var owner = {};
    by.cours.forEach(function (c) {
      [].forEach.call(c.box.querySelectorAll('a[href]'), function (a) {
        var k = keyOf(a.getAttribute('href'), pageUrl(c));
        if (!k || !exoByPath[k.path]) { return; }
        var parts = partIds(exoByPath[k.path]);
        owner[k.path + '|' + (parts.indexOf(k.hash) !== -1 ? k.hash : '')] = c;
      });
    });
    var orphanExo = [];
    by.exercices.forEach(function (e) {
      var parts = partIds(e), seen = {}, any = false;
      Object.keys(owner).forEach(function (key) {
        var cut = key.indexOf('|');
        if (key.slice(0, cut) !== e.path) { return; }
        any = true;
        var part = key.slice(cut + 1);
        if (part) { seen[part] = true; }
        push(items, owner[key].path, { page: e, part: part || null });
      });
      if (!any) { // aucun cours ne renvoie vers lui : cours de même nom
        var same = by.cours.filter(function (c) { return c.base === e.base; })[0];
        if (same) { push(items, same.path, { page: e, part: null }); } else { orphanExo.push({ page: e, part: null }); }
      } else {
        parts.forEach(function (id) { if (!seen[id] && !owner[e.path + '|']) { orphanExo.push({ page: e, part: id }); } });
      }
    });
    Object.keys(items).forEach(function (k) {
      items[k].sort(function (a, b) {
        return natural(a.page, b.page) || String(a.part).localeCompare(String(b.part));
      });
    });

    /* Textes : table TEXTES, sinon « (cours N) » dans l'introduction, sinon fin de livre. */
    var cfg = TEXTES[bookKey] || {}, byBase = {}, assigned = {}, fin = [], orphanTexts = [];
    by.textes.forEach(function (t) { byBase[t.base] = t; });
    Object.keys(cfg).forEach(function (num) {
      cfg[num].forEach(function (b) {
        var t = byBase[b];
        if (!t) { warnings.push('Texte introuvable : ' + b); return; }
        assigned[b] = true;
        if (num === 'fin') { fin.push(t); } else { push(texts, num, t); }
      });
    });
    var courseNums = {};
    by.cours.forEach(function (c) { courseNums[c.num] = true; });
    by.textes.forEach(function (t) {
      if (assigned[t.base]) { return; }
      var m = t.raw.match(/\(cours (\d+)\)/);
      var num = m ? ('0' + m[1]).slice(-2) : '';
      if (num && courseNums[num]) { push(texts, num, t); } else { orphanTexts.push(t); }
    });

    var seq = [];
    by.cours.forEach(function (c) {
      seq.push({ kind: 'cours', page: c });
      (texts[c.num] || []).forEach(function (t) { seq.push({ kind: 'texte', page: t }); });
      (items[c.path] || []).forEach(function (it) { seq.push({ kind: 'exercices', page: it.page, part: it.part }); });
    });
    if (orphanExo.length) {
      warnings.push(orphanExo.length + ' exercice(s) sans cours rattaché, placés en fin de partie.');
      seq.push({ divider: 'Exercices complémentaires' });
      orphanExo.forEach(function (it) { seq.push({ kind: 'exercices', page: it.page, part: it.part }); });
    }
    if (fin.length || orphanTexts.length) {
      if (orphanTexts.length) { warnings.push(orphanTexts.length + ' texte(s) sans cours rattaché, placés en fin de partie.'); }
      seq.push({ divider: 'Lectures complémentaires' });
      fin.concat(orphanTexts).forEach(function (t) { seq.push({ kind: 'texte', page: t }); });
    }
    if (by.revisions.length) {
      seq.push({ divider: 'Révisions' });
      by.revisions.forEach(function (p) { seq.push({ kind: 'revision', page: p }); });
    }
    if (by.vocabulaire.length) {
      seq.push({ divider: 'Vocabulaire', note: 'Les mots étudiés, séance par séance.' });
      by.vocabulaire.forEach(function (p) { seq.push({ kind: 'vocabulaire', page: p }); });
    }
    return { seq: seq, by: by };
  }

  /* Document : les pages de chaque public dans l'ordre des fichiers ; un séparateur par public s'il y en a deux. */
  function planDoc(pages) {
    var seq = [];
    (docDef.mixte ? ['Adultes', 'Enfants'] : [book.pub]).forEach(function (pub) {
      var list = pages.filter(function (p) { return p.pub === pub; }).sort(natural);
      if (!list.length) { return; }
      if (docDef.mixte) { seq.push({ divider: pub }); }
      list.forEach(function (p) { seq.push({ kind: 'doc', page: p }); });
    });
    return { seq: seq };
  }

  /* ================= Construction des sections ================= */

  /* Limite chaque règle CSS à une portée : la section d'une page (pour son <style>), ou les sections d'un public
     (documents mixtes). « html », « body » et « :root » deviennent la portée elle-même ; « body.enfant » et
     « body.adulte » ne valent que pour ce public (aud) et sont ignorés pour l'autre. */
  function scopeSelector(list, scope, aud) {
    var out = [];
    list.split(',').forEach(function (sel) {
      sel = sel.trim();
      var m = sel.match(/^(?:html|body|:root)((?:\.[\w-]+)*)(?![\w-])/);
      if (!m) { out.push(scope + ' ' + sel); return; }
      var other = m[1].split('.').filter(function (c) { return (c === 'enfant' || c === 'adulte') && c !== aud; });
      if (!other.length) { out.push(scope + sel.slice(m[0].length)); }
    });
    return out.join(', ');
  }
  function rulesToText(rules, scope, aud) {
    var out = '';
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (r.type === 1) {
        var sel = scopeSelector(r.selectorText, scope, aud);
        if (sel) { out += sel + ' { ' + r.style.cssText + ' }\n'; }
      } else if (r.type === 4) { out += '@media ' + r.media.mediaText + ' {\n' + rulesToText(r.cssRules, scope, aud) + '}\n'; }
      else { out += r.cssText + '\n'; }
    }
    return out;
  }
  function scopeCss(text, scope, aud) {
    var st = document.createElement('style');
    st.media = 'not all';
    st.textContent = text;
    document.head.appendChild(st);
    var out = '';
    try { out = rulesToText(st.sheet.cssRules, scope, aud); } catch (e) { warnings.push('Style de page ignoré : ' + e.message); }
    document.head.removeChild(st);
    return out;
  }

  /* Documents mixtes : les feuilles de style de chaque public (base, thème, contenu, dans l'ordre habituel des pages)
     sont limitées aux sections de ce public, pour que adultes et enfants gardent chacun leur apparence. */
  function injectThemes() {
    return Promise.all(['adulte', 'enfant'].map(function (aud) {
      return Promise.all(['css/amana-base.css', 'css/theme-' + aud + '.css', 'css/amana-content.css'].map(getText)).then(function (css) {
        var st = document.createElement('style');
        st.setAttribute('data-bk-theme', aud);
        st.textContent = css.map(function (t) { return scopeCss(t, '[data-th="' + aud + '"]', aud); }).join('\n');
        document.head.appendChild(st);
      });
    }));
  }

  function prefixList(value, prefix) {
    return value.split(/\s+/).filter(Boolean).map(function (v) { return prefix + v; }).join(' ');
  }

  function makeSection(item) {
    var n = ++counter, page = item.page, id = 'bk' + n, prefix = id + '-';
    var sec = document.createElement('section');
    sec.id = id;
    sec.className = 'bk-page bk-' + item.kind;
    sec.setAttribute('data-bk', id);
    if (mixed) { sec.setAttribute('data-th', page.pub === 'Enfants' ? 'enfant' : 'adulte'); }
    sec.setAttribute('data-source', page.path + (item.part ? '#' + item.part : ''));
    var nodes = item.part ? partNodes(page, item.part) : [].slice.call(page.box.childNodes);
    nodes.forEach(function (nd) { sec.appendChild(document.importNode(nd, true)); });

    /* identifiants : préfixés, pour éviter les collisions entre pages (ex. #partie-a présent sur 28 pages) */
    [].forEach.call(sec.querySelectorAll('[id]'), function (e) {
      reg.ids[page.path + '#' + e.id] = prefix + e.id;
      e.id = prefix + e.id;
    });
    ['for', 'aria-labelledby', 'aria-describedby', 'headers'].forEach(function (attr) {
      [].forEach.call(sec.querySelectorAll('[' + attr + ']'), function (e) { e.setAttribute(attr, prefixList(e.getAttribute(attr), prefix)); });
    });
    if (!reg.first[page.path]) { reg.first[page.path] = id; }

    /* liens : résolus après assemblage de tout le livre (les cibles peuvent venir plus tard) */
    [].forEach.call(sec.querySelectorAll('a[href]'), function (a) {
      var k = keyOf(a.getAttribute('href'), pageUrl(page));
      if (k) { a.setAttribute('data-bk-path', k.path); a.setAttribute('data-bk-hash', k.hash); }
      else { a.setAttribute('data-bk-path', ''); }
      a.setAttribute('href', '#');
    });
    [].forEach.call(sec.querySelectorAll('img[src]'), function (img) { img.src = new URL(img.getAttribute('src'), pageUrl(page)).href; });

    page.styles.forEach(function (css) {
      var st = document.createElement('style');
      st.setAttribute('data-bk-style', id);
      st.textContent = scopeCss(css, '[data-bk="' + id + '"]');
      document.head.appendChild(st);
    });
    return sec;
  }

  function resolveLinks(root) {
    [].forEach.call(root.querySelectorAll('a[data-bk-path]'), function (a) {
      var path = a.getAttribute('data-bk-path'), hash = a.getAttribute('data-bk-hash');
      var target = path ? ((hash && reg.ids[path + '#' + hash]) || reg.first[path]) : '';
      if (target) {
        a.setAttribute('href', '#' + target);
        a.removeAttribute('data-bk-path');
        a.removeAttribute('data-bk-hash');
      } else { unwrap(a); }
    });
  }

  /* ================= Couverture, sommaire, séparateurs ================= */

  function listFr(parts) {
    return parts.length < 2 ? parts.join('') : parts.slice(0, -1).join(', ') + ' et ' + parts[parts.length - 1];
  }

  function buildCover(spec) {
    var s = document.createElement('section');
    s.className = 'bk-cover';
    s.innerHTML = '<img class="bk-logo" src="images/amana-logo.jpg" alt="Logo de l’association AMANA">' +
      '<p class="bk-assoc">AMANA — Cours d’arabe</p><h1></h1>' + (spec.sub ? '<p class="bk-sous"></p>' : '') +
      '<p class="bk-public"></p><p class="bk-note"></p>';
    s.querySelector('h1').textContent = spec.title;
    if (spec.sub) { s.querySelector('.bk-sous').innerHTML = spec.sub; }
    s.querySelector('.bk-public').textContent = spec.pub;
    s.querySelector('.bk-note').textContent = spec.note;
    return s;
  }

  function entryLabel(sec, item) {
    var h1 = sec.querySelector('h1'), label = document.createElement('span');
    if (h1) {
      var c = h1.cloneNode(true);
      [].forEach.call(c.querySelectorAll('[id]'), function (x) { x.removeAttribute('id'); });
      label.innerHTML = c.innerHTML;
    } else { label.textContent = item.page.base; }
    if (item.part) { label.appendChild(document.createTextNode(' — partie ' + item.part.replace(/^partie-/, '').toUpperCase())); }
    return label;
  }

  function buildToc(entries) {
    var s = document.createElement('section');
    s.className = 'bk-toc';
    s.innerHTML = '<h1>Sommaire</h1>';
    var ol = null;
    function openList(heading) {
      if (heading) { var h = document.createElement('h2'); h.textContent = heading; s.appendChild(h); }
      ol = document.createElement('ol');
      s.appendChild(ol);
    }
    entries.forEach(function (e) {
      if (e.divider) { openList(e.divider); return; }
      if (!ol) { openList(null); }
      var li = document.createElement('li'), a = document.createElement('a');
      a.href = '#' + e.id;
      if (LIBELLES[e.kind]) {
        var t = document.createElement('span');
        t.className = 'bk-type';
        t.textContent = LIBELLES[e.kind];
        a.appendChild(t);
        a.appendChild(document.createTextNode(' '));
      }
      a.appendChild(e.label);
      li.appendChild(a);
      ol.appendChild(li);
    });
    return s;
  }

  function buildDivider(item) {
    var s = document.createElement('section');
    s.className = 'bk-divider';
    var h = document.createElement('h1');
    h.textContent = item.divider;
    s.appendChild(h);
    if (item.note) { var p = document.createElement('p'); p.textContent = item.note; s.appendChild(p); }
    return s;
  }

  /* ================= Programme principal ================= */

  function main() {
    if (!valid) { fail('Livre inconnu : paramètres invalides.'); return Promise.resolve(); }
    if (!mixed) { document.body.classList.add(theme); } // document mixte : thème appliqué section par section

    if (book.tranche) { document.body.classList.add('tranche-' + book.tranche); }
    setStatus('Lecture de l’index…');

    return getText('index.html').then(function (html) {
      var idx = new DOMParser().parseFromString(html, 'text/html');
      var pages = [], seen = {}, level = { title: book.niveau, sub: '' };
      [].forEach.call(idx.querySelectorAll('a[data-p]'), function (a) {
        var p = (isDoc ? classifyDoc : classify)(a.getAttribute('data-p'));
        if (!p || seen[p.path]) { return; }
        seen[p.path] = true;
        pages.push(p);
        var lv = a.closest('details.lv'), sm = lv && lv.querySelector(':scope > summary');
        if (sm && level.sub === '' && level.title === book.niveau) {
          var c = sm.cloneNode(true);
          [].forEach.call(c.querySelectorAll('small'), remove);
          var txt = c.innerHTML.trim(), cut = txt.indexOf(' — ');
          level = cut === -1 ? { title: norm(c.textContent), sub: '' } : { title: norm(txt.slice(0, cut)), sub: txt.slice(cut + 3) };
        }
      });
      if (isDoc ? !pages.length : !pages.some(function (p) { return p.cat === 'cours'; })) { throw new Error('Aucune page trouvée pour ce livre (' + bookKey + ').'); }
      el.nom.textContent = level.title + ' — ' + (mixed ? 'Adultes et enfants' : book.pub + (book.tranche ? ' ' + book.tranche.replace('-', '–') + ' ans' : ''));
      document.title = 'AMANA — ' + el.nom.textContent;
      return pool(pages, 8, function (p) {
        return getText(p.path).then(function (h) { prepare(p, h); });
      }).then(function () { return { pages: pages, level: level }; });
    }).then(function (ctx) {
      return (mixed ? injectThemes() : Promise.resolve()).then(function () { return ctx; });
    }).then(function (ctx) {
      setStatus('Assemblage du livre…');
      var pl = isDoc ? planDoc(ctx.pages) : plan(ctx.pages), frag = document.createDocumentFragment(), entries = [], sources = [];
      var lastCours = null;
      pl.seq.forEach(function (item) {
        if (item.divider) { lastCours = null; frag.appendChild(buildDivider(item)); entries.push({ divider: item.divider }); return; }
        var sec = makeSection(item);
        frag.appendChild(sec);
        sources.push(sec.getAttribute('data-source'));
        var label = entryLabel(sec, item);
        if (item.kind === 'cours') { lastCours = label; }
        entries.push({ id: sec.id, kind: item.kind, label: label, cours: item.kind === 'exercices' ? lastCours : null });
      });
      /* Sommaire : des exercices qui portent tous le même titre (ex. « Exercices Pratiques ») se distinguent par leur cours. */
      var titles = {};
      entries.forEach(function (e) { if (e.kind === 'exercices') { e.titre = norm(e.label.textContent); titles[e.titre] = (titles[e.titre] || 0) + 1; } });
      entries.forEach(function (e) {
        if (e.kind === 'exercices' && e.cours && titles[e.titre] > 1) { e.label.appendChild(document.createTextNode(' — ' + norm(e.cours.textContent))); }
      });
      var spec;
      if (isDoc) {
        spec = { title: ctx.level.title, sub: '', pub: mixed ? 'Adultes et enfants' : book.pub, note: docDef.note };
      } else {
        var contenu = ['cours'];
        if (pl.by.textes.length) { contenu.push('textes de lecture'); }
        contenu.push('exercices');
        if (pl.by.revisions.length) { contenu.push('révisions'); }
        if (pl.by.vocabulaire.length) { contenu.push('vocabulaire'); }
        spec = {
          title: ctx.level.title, sub: ctx.level.sub,
          pub: book.pub + (book.tranche ? ' · ' + book.tranche.replace('-', '–') + ' ans' : ''),
          note: 'Livre de l’élève : ' + listFr(contenu) + '.'
        };
      }
      var cover = buildCover(spec), toc = buildToc(entries);
      el.host.appendChild(cover);
      el.host.appendChild(toc);
      el.host.appendChild(frag);
      resolveLinks(el.host);
      window.__livre = { cle: bookKey, sections: sources.length, sources: sources, warnings: warnings };

      var ready = [document.fonts && document.fonts.ready].concat([].map.call(el.host.querySelectorAll('img'), function (img) {
        return img.complete ? null : new Promise(function (r) { img.addEventListener('load', r); img.addEventListener('error', r); });
      }));
      return Promise.all(ready).then(function () {
        setStatus(sources.length + ' pages assemblées' + (warnings.length ? ' — ' + warnings.join(' ') : '') + '.');
        el.bouton.disabled = false;
        el.bouton.addEventListener('click', function () { window.print(); });
        document.body.setAttribute('data-livre', 'pret');
      });
    }).catch(function (e) {
      var file = location.protocol === 'file:';
      fail(file ? 'Ouvrez le site avec « sh serve.sh » (http://localhost:8000/) : ce livre ne peut pas être assemblé depuis un fichier local.'
        : 'Le livre n’a pas pu être assemblé : ' + e.message);
    });
  }

  main();
}());
