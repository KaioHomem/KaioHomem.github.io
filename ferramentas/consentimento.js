/* ===================================================
   LGPD — CONSENT GATE

   This is a real gate, not a decorative banner: no
   third-party script that sets cookies is loaded until
   the visitor accepts. monetizacao.js asks this module
   before touching AdSense.

   The banner only appears when there is actually
   something to consent to. With monetization off, the
   site sets no third-party cookies, so asking would be
   noise — and consent theatre is worse than no banner.
   =================================================== */

(function () {
  'use strict';

  var CHAVE = 'consentimento.v1';
  var ouvintes = [];

  function ler() {
    try {
      return localStorage.getItem(CHAVE);
    } catch (e) {
      return null;
    }
  }

  function gravar(valor) {
    try {
      localStorage.setItem(CHAVE, valor);
    } catch (e) {
      /* Private browsing with storage disabled — treat as "no consent". */
    }
    ouvintes.forEach(function (fn) {
      try { fn(valor); } catch (e) {}
    });
  }

  /**
   * Does anything on this page actually need consent?
   * Google Fonts is loaded from a Google domain but sets no cookie, so it
   * is disclosed in the privacy policy rather than gated here.
   */
  function precisaDeConsentimento() {
    var m = window.MONETIZACAO || {};
    var adsAtivo = !!(m.adsense && m.adsense.ativo && m.adsense.cliente);
    var analiseAtiva = !!window.GA4_ATIVO;
    return adsAtivo || analiseAtiva;
  }

  var API = {
    estado: function () {
      var v = ler();
      return v === 'aceito' || v === 'recusado' ? v : null;
    },
    aceito: function () {
      return ler() === 'aceito';
    },
    decidido: function () {
      return API.estado() !== null;
    },
    aceitar: function () {
      gravar('aceito');
      esconderBanner();
    },
    recusar: function () {
      gravar('recusado');
      esconderBanner();
    },
    /** Called by monetizacao.js so ads can load the moment consent lands. */
    aoDecidir: function (fn) {
      ouvintes.push(fn);
    },
    /** Footer link: let the visitor change their mind. */
    reabrir: function () {
      try { localStorage.removeItem(CHAVE); } catch (e) {}
      mostrarBanner();
    },
    precisaDeConsentimento: precisaDeConsentimento
  };

  /* ---------- UI ---------- */
  function esconderBanner() {
    var el = document.getElementById('banner-consentimento');
    if (el) el.remove();
  }

  function mostrarBanner() {
    if (document.getElementById('banner-consentimento')) return;

    var caminhoPolitica = window.location.pathname.indexOf('/ferramentas/') > -1 ||
                          window.location.pathname.indexOf('/painel/') > -1
      ? '../privacidade.html'
      : 'privacidade.html';

    var banner = document.createElement('div');
    banner.id = 'banner-consentimento';
    banner.className = 'consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Aviso de cookies');

    banner.innerHTML =
      '<div class="consent-inner">' +
        '<div class="consent-texto">' +
          '<strong>Este site usa cookies de publicidade.</strong> ' +
          'Os cálculos que você faz continuam só no seu navegador — isso não muda. ' +
          'O que depende da sua escolha são os cookies do Google usados para exibir anúncios. ' +
          '<a href="' + caminhoPolitica + '">Ler a política de privacidade</a>.' +
        '</div>' +
        '<div class="consent-botoes">' +
          '<button type="button" class="btn btn-vazado" id="consent-recusar">Recusar</button>' +
          '<button type="button" class="btn" id="consent-aceitar">Aceitar</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(banner);

    document.getElementById('consent-aceitar').addEventListener('click', API.aceitar);
    document.getElementById('consent-recusar').addEventListener('click', API.recusar);
  }

  function iniciar() {
    if (!precisaDeConsentimento()) return;
    if (API.decidido()) return;
    mostrarBanner();
  }

  window.Consentimento = API;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
