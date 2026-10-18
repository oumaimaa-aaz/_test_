/* ==========================================================================
   js/cookies.js - consentement aux cookies
   - bannière à la première visite, fenêtre « Personnaliser », bouton rond pour rouvrir
   - Google Analytics 4 et Meta Pixel ne sont chargés QU'APRÈS consentement
   - les identifiants se règlent dans js/config.js (GA_ID, META_PIXEL_ID)
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- réglages ---------- */
  var GA = (typeof GA_ID === 'string' ? GA_ID : '').trim();
  var FB = (typeof META_PIXEL_ID === 'string' ? META_PIXEL_ID : '').trim();
  if (!/^G-[A-Z0-9]{4,20}$/.test(GA)) GA = '';   /* identifiant invalide = outil désactivé */
  if (!/^\d{5,20}$/.test(FB)) FB = '';

  var COOKIE_NAME = 'solutech_consent';
  var COOKIE_DAYS = 365;
  var VERSION = 1;                 /* changez ce nombre pour redemander le consentement à tout le monde */
  var FIRST_VISIT = 'button';      /* 'button' : seul le bouton rond est visible, la fenêtre s'ouvre au clic
                                        'banner' : petite bannière à la 1re visite
                                        'modal'  : fenêtre de préférences ouverte d'office */

  /* registre anonyme des choix dans votre Google Sheet (via l'Apps Script du formulaire) */
  var LOG_URL = (typeof SCRIPT_URL === 'string' && /^https:\/\/script\.google\.com\//.test(SCRIPT_URL)) ? SCRIPT_URL : 'https://script.google.com/macros/s/AKfycbzlj75w4ctlkIJDzV0Egb95pWUNXD1Sjl7gG6PCBRp-g56W2GkDkKdAV1BDhONhPagFsA/exec';
  var LOG = !!LOG_URL && !(typeof CONSENT_LOG !== 'undefined' && CONSENT_LOG === false);

  var RE_GA = /^(_ga|_gid|_gat.*|_ga_.+|_gcl_.+)$/;
  var RE_FB = /^(_fbp|_fbc)$/;

  /* ---------- textes ---------- */
  var T = {
    title: 'Personnaliser les préférences de consentement',
    p1: 'Nous utilisons des cookies pour vous aider à naviguer efficacement et à utiliser certaines fonctionnalités. Vous trouverez le détail de tous les cookies dans chaque catégorie ci-dessous.',
    p2: 'Les cookies classés dans la catégorie « Nécessaires » sont enregistrés dans votre navigateur car ils sont indispensables au fonctionnement des fonctionnalités de base du site.',
    p3: 'Nous utilisons également des cookies tiers qui nous aident à analyser l’utilisation du site, à mémoriser vos préférences et à vous proposer des contenus et des publicités pertinents. Ces cookies ne sont enregistrés dans votre navigateur qu’avec votre consentement préalable.',
    p4: 'Vous pouvez activer ou désactiver tout ou partie de ces cookies, mais la désactivation de certains d’entre eux peut affecter votre expérience de navigation.' +
        (LOG ? ' Votre choix est enregistré de façon anonyme (date et catégories choisies, sans nom ni email) afin de conserver une preuve du consentement.' : ''),
    more: 'Voir plus', less: 'Voir moins',
    always: 'Toujours actifs',
    none: 'Aucun cookie de cette catégorie n’est utilisé pour le moment.',
    provider: 'Fournisseur',
    reject: 'Tout refuser', save: 'Enregistrer mes préférences', accept: 'Tout accepter', custom: 'Personnaliser',
    bannerTitle: 'Votre vie privée compte',
    bannerText: 'Nous utilisons des cookies pour mesurer l’audience du site et améliorer votre expérience. Vous pouvez tout accepter, tout refuser ou choisir catégorie par catégorie.',
    close: 'Fermer', revisit: 'Préférences de consentement'
  };

  var CATS = [
    { id: 'necessary', locked: true, title: 'Nécessaires',
      desc: 'Les cookies nécessaires sont indispensables au fonctionnement des fonctionnalités de base du site, comme la mémorisation de vos choix en matière de cookies. Ils ne stockent aucune donnée personnelle identifiable.',
      cookies: [{ name: COOKIE_NAME, provider: 'Solutech VMIS', duration: '12 mois', purpose: 'Mémorise vos choix de consentement aux cookies.' }] },
    { id: 'functional', title: 'Fonctionnels',
      desc: 'Les cookies fonctionnels permettent d’exécuter certaines fonctionnalités, comme le partage du contenu du site sur les réseaux sociaux, la collecte de retours et d’autres fonctions tierces.',
      cookies: [] },
    { id: 'analytics', title: 'Analytiques',
      desc: 'Les cookies analytiques servent à comprendre comment les visiteurs interagissent avec le site. Ils fournissent des informations sur le nombre de visiteurs, le taux de rebond, la source du trafic, etc.',
      cookies: GA ? [
        { name: '_ga', provider: 'Google Analytics', duration: '2 ans', purpose: 'Identifiant qui permet de distinguer les visiteurs et de calculer les statistiques d’audience.' },
        { name: '_ga_*', provider: 'Google Analytics', duration: '2 ans', purpose: 'Conserve l’état de la session pour Google Analytics 4.' }
      ] : [] },
    { id: 'performance', title: 'Performance',
      desc: 'Les cookies de performance servent à comprendre et analyser les principaux indicateurs de performance du site, ce qui permet d’offrir une meilleure expérience aux visiteurs.',
      cookies: [] },
    { id: 'advertisement', title: 'Publicité',
      desc: 'Les cookies publicitaires servent à proposer aux visiteurs des publicités personnalisées selon les pages consultées et à analyser l’efficacité des campagnes publicitaires.',
      cookies: FB ? [
        { name: '_fbp', provider: 'Meta (Facebook, Instagram)', duration: '3 mois', purpose: 'Identifie le navigateur pour mesurer et optimiser les publicités diffusées via Meta.' }
      ] : [] }
  ];

  /* ---------- cookies du navigateur ---------- */
  function readCookie(name) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }
  function writeCookie(name, value, days) {
    var secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = name + '=' + encodeURIComponent(value) + '; Max-Age=' + (days * 86400) + '; Path=/; SameSite=Lax' + secure;
  }
  function deleteCookie(name) {
    var parts = location.hostname.split('.');
    var variants = [''];
    for (var i = 0; i < parts.length - 1; i++) variants.push('; Domain=.' + parts.slice(i).join('.'));
    variants.forEach(function (d) { document.cookie = name + '=; Max-Age=0; Path=/' + d; });
  }
  function purge(re) {
    document.cookie.split(';').forEach(function (c) {
      var n = c.split('=')[0].trim();
      if (n && re.test(n)) deleteCookie(n);
    });
  }

  /* ---------- mémorisation du choix ---------- */
  function loadConsent() {
    try {
      var o = JSON.parse(readCookie(COOKIE_NAME) || 'null');
      if (o && o.v === VERSION && o.c) {
        return { functional: !!o.c.functional, analytics: !!o.c.analytics, performance: !!o.c.performance, advertisement: !!o.c.advertisement };
      }
    } catch (e) {}
    return null;
  }
  function storeConsent(c) {
    writeCookie(COOKIE_NAME, JSON.stringify({ v: VERSION, t: Date.now(), c: c }), COOKIE_DAYS);
  }
  function all(v) { return { functional: v, analytics: v, performance: v, advertisement: v }; }

  /* ---------- chargement des outils (uniquement après consentement) ---------- */
  var gaLoaded = false, fbLoaded = false;

  function gtag() { window.dataLayer.push(arguments); }   /* doit utiliser « arguments » (exigé par Google) */

  function loadGA(adv) {
    if (!GA) return;
    var g = adv ? 'granted' : 'denied';
    window.dataLayer = window.dataLayer || [];
    if (gaLoaded) { gtag('consent', 'update', { ad_storage: g, ad_user_data: g, ad_personalization: g }); return; }
    gaLoaded = true;
    delete window['ga-disable-' + GA];
    gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' });
    gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: g, ad_user_data: g, ad_personalization: g });
    gtag('js', new Date());
    gtag('config', GA, { allow_google_signals: !!adv, allow_ad_personalization_signals: !!adv });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA);
    document.head.appendChild(s);
  }

  function loadFB() {
    if (!FB || fbLoaded) return;
    fbLoaded = true;
    var n = window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!window._fbq) window._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
    n('init', FB);
    n('track', 'PageView');
  }

  /* envoie le choix au registre (anonyme) ; renvoie une promesse pour pouvoir attendre avant un rechargement */
  function logConsent(c) {
    if (!LOG) return Promise.resolve();
    try {
      var body = JSON.stringify({ _type: 'consent', functional: c.functional, analytics: c.analytics, performance: c.performance, advertisement: c.advertisement, page: location.pathname });
      return fetch(LOG_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: body, keepalive: true }).catch(function () {});
    } catch (e) { return Promise.resolve(); }
  }

  var reloading = false;
  function reloadAfter(wait) {
    if (reloading) return;
    reloading = true;
    var go = function () { location.reload(); };
    (wait || Promise.resolve()).then(go, go);
    setTimeout(go, 1500);            /* sécurité : on ne bloque jamais plus de 1,5 s */
  }

  function applyConsent(c, wait) {
    if (!c.analytics) { if (GA) window['ga-disable-' + GA] = true; purge(RE_GA); }
    if (!c.advertisement) purge(RE_FB);
    /* retrait du consentement alors que l'outil tourne déjà : on recharge la page pour le décharger */
    if ((gaLoaded && !c.analytics) || (fbLoaded && !c.advertisement)) { reloadAfter(wait); return; }
    if (c.analytics) loadGA(c.advertisement);
    if (c.advertisement) loadFB();
  }

  /* ---------- interface ---------- */
  var consent = loadConsent();
  var draft = all(false);
  var root, overlay, banner, modal, wrap, scroller, revisit, lastFocus = null;

  var ICON_CLOSE = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>';
  var ICON_COOKIE = '<svg aria-hidden="true" width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M17.9584 35.708C8.19071 35.708 0.291626 27.785 0.291625 17.9997L0.291625 16.0266L1.6547 16.2999C1.7269 16.3144 1.79254 16.3278 1.85292 16.3402C2.18947 16.4089 2.3624 16.4442 2.59351 16.4442C4.02238 16.4442 5.20017 15.575 5.69593 14.3946L6.08757 13.4621L7.05986 13.7406C7.54336 13.8791 8.01924 13.9464 8.49032 13.9464C11.5129 13.9464 13.9955 11.4616 13.9955 8.42451C13.9955 7.9478 13.9288 7.53472 13.8448 7.02934L13.7178 6.2655L14.3813 5.86637C15.2722 5.33053 15.9147 4.28559 15.9886 3.06722C15.9835 2.70604 15.8823 2.37723 15.7147 1.87315L15.3081 0.650195L16.5717 0.396836C17.0992 0.291083 17.6116 0.291225 18.0046 0.291332L18.0415 0.29134C27.8092 0.29134 35.7083 8.21439 35.7083 17.9997C35.7083 27.7924 27.7187 35.708 17.9584 35.708ZM2.58643 18.7225C2.96219 26.9183 9.69584 33.4297 17.9584 33.4297C26.47 33.4297 33.43 26.5247 33.43 17.9997C33.43 9.53184 26.6494 2.67413 18.2343 2.57079C18.2549 2.73864 18.267 2.91385 18.267 3.09572L18.267 3.1256L18.2655 3.15544C18.1785 4.81232 17.4196 6.35187 16.2006 7.36124C16.2425 7.68459 16.2737 8.03839 16.2737 8.42451C16.2737 12.7145 12.7765 16.2246 8.49032 16.2246C8.1069 16.2246 7.72496 16.1941 7.34497 16.1338C6.35851 17.6674 4.62516 18.7225 2.59351 18.7225C2.59115 18.7225 2.58878 18.7225 2.58643 18.7225Z" fill="white"/><path d="M11.4052 2.5294C11.4052 1.35045 10.4495 0.394729 9.27053 0.394729C8.09159 0.394729 7.13586 1.35045 7.13586 2.5294C7.13586 3.70834 8.09159 4.66406 9.27053 4.66406C10.4495 4.66406 11.4052 3.70834 11.4052 2.5294Z" fill="white"/><path d="M10.2426 9.19713C10.2426 8.33923 9.54712 7.64376 8.68923 7.64376C7.83133 7.64376 7.13586 8.33923 7.13586 9.19713C7.13586 10.055 7.83133 10.7505 8.68923 10.7505C9.54712 10.7505 10.2426 10.055 10.2426 9.19713Z" fill="white"/><path d="M4.12412 10.2803C4.12412 9.39614 3.40733 8.67935 2.52312 8.67935C1.63891 8.67935 0.922119 9.39614 0.922119 10.2803C0.922119 11.1646 1.63891 11.8813 2.52312 11.8813C3.40733 11.8813 4.12412 11.1646 4.12412 10.2803Z" fill="white"/><path d="M16.7148 17.2523L17.7308 19.1024L18.35 20.2155L23.1603 12H26.8752L20.1439 23.4923H16.429L12.9999 17.2523H16.7148Z" fill="white"/><path d="M19.9414 25.7905H16.4725V29.2382H19.9414V25.7905Z" fill="white"/></svg>';

  function catHTML(c) {
    var head = '<button type="button" class="ck-cat-btn" data-ck="exp" aria-expanded="false" aria-controls="ck-d-' + c.id + '"><span class="ck-chev" aria-hidden="true"></span>' + c.title + '</button>' +
      (c.locked ? '<span class="ck-always">' + T.always + '</span>'
                : '<button type="button" class="ck-switch" role="switch" aria-checked="false" aria-label="' + c.title + '" data-ck="sw" data-id="' + c.id + '"></button>');
    var list = c.cookies.length ? c.cookies.map(function (k) {
      return '<div class="ck-ck"><div class="ck-ckh"><b>' + k.name + '</b><span>' + k.duration + '</span></div><p>' + k.purpose + '</p><p class="ck-meta">' + T.provider + ' : ' + k.provider + '</p></div>';
    }).join('') : '<p class="ck-none">' + T.none + '</p>';
    return '<div class="ck-cat"><div class="ck-cat-head">' + head + '</div><p class="ck-desc">' + c.desc + '</p><div class="ck-detail" id="ck-d-' + c.id + '" hidden>' + list + '</div></div>';
  }

  function build() {
    root = document.createElement('div');
    root.className = 'ck-root';
    root.innerHTML =
      '<div class="ck-overlay"></div>' +
      '<section class="ck-banner" role="dialog" aria-modal="false" aria-labelledby="ck-bt">' +
        '<h2 id="ck-bt">' + T.bannerTitle + '</h2><p>' + T.bannerText + '</p>' +
        '<div class="ck-actions">' +
          '<button type="button" class="ck-btn" data-ck="reject">' + T.reject + '</button>' +
          '<button type="button" class="ck-btn" data-ck="accept">' + T.accept + '</button>' +
          '<button type="button" class="ck-btn ck-ghost" data-ck="custom">' + T.custom + '</button>' +
        '</div>' +
      '</section>' +
      '<div class="ck-modal" role="dialog" aria-modal="true" aria-labelledby="ck-title" tabindex="-1">' +
        '<div class="ck-head"><h2 class="ck-title" id="ck-title">' + T.title + '</h2>' +
          '<button type="button" class="ck-close" data-ck="close" aria-label="' + T.close + '">' + ICON_CLOSE + '</button></div>' +
        '<div class="ck-bodywrap"><div class="ck-scroll" tabindex="0">' +
          '<p class="ck-p">' + T.p1 + '</p>' +
          '<p class="ck-p">' + T.p2 + '<span data-ck-dots> …</span> <button type="button" class="ck-more" data-ck="more" aria-expanded="false" aria-controls="ck-extra">' + T.more + '</button></p>' +
          '<div id="ck-extra" hidden><p class="ck-p">' + T.p3 + '</p><p class="ck-p">' + T.p4 + '</p>' +
            '<button type="button" class="ck-more" data-ck="less">' + T.less + '</button></div>' +
          CATS.map(catHTML).join('') +
        '</div></div>' +
        '<div class="ck-foot">' +
          '<button type="button" class="ck-btn" data-ck="reject">' + T.reject + '</button>' +
          '<button type="button" class="ck-btn" data-ck="save">' + T.save + '</button>' +
          '<button type="button" class="ck-btn" data-ck="accept">' + T.accept + '</button>' +
        '</div>' +
      '</div>' +
      '<button type="button" class="ck-revisit" data-ck="open" aria-label="' + T.revisit + '" hidden>' + ICON_COOKIE + '<span class="ck-tip" aria-hidden="true">' + T.revisit + '</span></button>';
    document.body.appendChild(root);
    overlay = root.querySelector('.ck-overlay');
    banner = root.querySelector('.ck-banner');
    modal = root.querySelector('.ck-modal');
    wrap = root.querySelector('.ck-bodywrap');
    scroller = root.querySelector('.ck-scroll');
    revisit = root.querySelector('.ck-revisit');
  }

  function updateFade() {
    wrap.classList.toggle('ck-end', scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4);
  }
  function syncSwitches() {
    root.querySelectorAll('[data-ck="sw"]').forEach(function (b) {
      b.setAttribute('aria-checked', draft[b.dataset.id] ? 'true' : 'false');
    });
  }
  function setExtra(open) {
    root.querySelector('#ck-extra').hidden = !open;
    root.querySelector('[data-ck-dots]').hidden = open;
    var m = root.querySelector('[data-ck="more"]');
    m.hidden = open; m.setAttribute('aria-expanded', open ? 'true' : 'false');
    updateFade();
  }

  function showBanner() { banner.classList.add('ck-on'); revisit.hidden = true; }
  function hideBanner() { banner.classList.remove('ck-on'); }

  function openModal() {
    lastFocus = document.activeElement;
    draft = consent ? { functional: consent.functional, analytics: consent.analytics, performance: consent.performance, advertisement: consent.advertisement } : all(false);
    syncSwitches();
    hideBanner(); revisit.hidden = true;
    overlay.classList.add('ck-on'); modal.classList.add('ck-on');
    document.documentElement.classList.add('ck-lock');
    scroller.scrollTop = 0; updateFade();
    modal.focus({ preventScroll: true });
  }
  function closeModal() {
    overlay.classList.remove('ck-on'); modal.classList.remove('ck-on');
    document.documentElement.classList.remove('ck-lock');
    if (consent || FIRST_VISIT !== 'banner') revisit.hidden = false; else showBanner();
    if (lastFocus && lastFocus.focus && document.contains(lastFocus) && !lastFocus.hidden) lastFocus.focus({ preventScroll: true });
  }
  function decide(c) {
    consent = c;
    storeConsent(c);
    hideBanner();
    overlay.classList.remove('ck-on'); modal.classList.remove('ck-on');
    document.documentElement.classList.remove('ck-lock');
    revisit.hidden = false;
    applyConsent(c, logConsent(c));
  }

  function onClick(e) {
    var opener = e.target.closest('[data-cookie-settings]');
    if (opener) { e.preventDefault(); openModal(); return; }
    var t = e.target.closest('[data-ck]');
    if (!t || !root.contains(t)) return;
    switch (t.dataset.ck) {
      case 'accept': decide(all(true)); break;
      case 'reject': decide(all(false)); break;
      case 'save': decide({ functional: draft.functional, analytics: draft.analytics, performance: draft.performance, advertisement: draft.advertisement }); break;
      case 'custom':
      case 'open': openModal(); break;
      case 'close': closeModal(); break;
      case 'more': setExtra(true); break;
      case 'less': setExtra(false); break;
      case 'sw': draft[t.dataset.id] = !draft[t.dataset.id]; syncSwitches(); break;
      case 'exp':
        var open = t.getAttribute('aria-expanded') !== 'true';
        t.setAttribute('aria-expanded', open ? 'true' : 'false');
        root.querySelector('#' + t.getAttribute('aria-controls')).hidden = !open;
        updateFade();
        break;
    }
  }

  function onKey(e) {
    if (!modal.classList.contains('ck-on')) return;
    if (e.key === 'Escape') { e.preventDefault(); closeModal(); return; }
    if (e.key !== 'Tab') return;
    var f = Array.prototype.filter.call(modal.querySelectorAll('button, [tabindex="0"]'), function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === modal)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function init() {
    build();
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    scroller.addEventListener('scroll', updateFade, { passive: true });
    window.addEventListener('resize', updateFade);
    if (consent) { revisit.hidden = false; applyConsent(consent); return; }
    applyConsent(all(false));          /* sans choix = tout refusé : rien n'est chargé */
    if (FIRST_VISIT === 'banner') showBanner();
    else if (FIRST_VISIT === 'modal') openModal();
    else revisit.hidden = false;       /* 'button' : le visiteur clique quand il le souhaite */
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  /* permet d'ouvrir les préférences depuis n'importe où : SolutechCookies.open() */
  window.SolutechCookies = { open: function () { if (root) openModal(); } };
})();
