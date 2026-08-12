/* ===================================================
   FERRAMENTAS BR — MONETIZATION CONFIG

   >>> THIS IS THE ONLY FILE YOU NEED TO EDIT TO TURN
   >>> THE SITE FROM "FREE TOOLS" INTO "TOOLS THAT PAY".

   Nothing here is active by default. While `ativo: false`,
   no third-party script is loaded and no ad space is
   rendered — the pages stay clean and fast.

   ---------------------------------------------------
   HOW TO SWITCH IT ON
   ---------------------------------------------------
   1. AdSense
      - Sign up at adsense.google.com with the site URL.
      - Google reviews the site (usually a few days). It
        needs real content and traffic to be approved —
        which is why the tools ship first and ads later.
      - Once approved, create 3 display units and paste
        the publisher id + slot ids below, then set
        `ativo: true`.

   2. Affiliates
      - Fill `blocos` with real programs and set
        `ativo: true`. Each entry becomes a card under
        the matching tool's result.
      - Only recommend things that actually fit the tool.
        A loan-comparison link under the financing
        calculator earns; a random banner does not.

   Both can run at the same time, or either alone.
   =================================================== */

window.MONETIZACAO = {

  /* ---------- GOOGLE ADSENSE ---------- */
  adsense: {
    ativo: false,

    // Publisher id — looks like 'ca-pub-1234567890123456'
    cliente: '',

    // Ad unit ids — each is a numeric string like '1234567890'
    slots: {
      topo: '',        // above the calculator
      resultado: '',   // right after the result (highest value position)
      rodape: ''       // end of the article text
    }
  },

  /* ---------- AFFILIATE BLOCKS ---------- */
  afiliados: {
    ativo: false,

    // Keyed by tool id (the `data-ferramenta` on each page).
    // `url` must already contain your affiliate tag.
    blocos: {
      'salario-liquido': [
        // {
        //   titulo: 'Conta digital sem tarifa',
        //   descricao: 'Receba o salário e renda automática sobre o saldo.',
        //   url: 'https://exemplo.com/?ref=SEU_ID',
        //   rotulo: 'Abrir conta'
        // }
      ],
      'rescisao': [],
      'juros-compostos': [],
      'financiamento': []
    }
  }
};

/* ===================================================
   LOADER — no need to touch anything below this line.
   =================================================== */
(function () {
  'use strict';

  var cfg = window.MONETIZACAO || {};

  function adsenseConfigurado() {
    return !!(cfg.adsense && cfg.adsense.ativo && cfg.adsense.cliente);
  }

  var scriptPedido = false;
  function carregarScriptAdsense() {
    if (scriptPedido) return;
    scriptPedido = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' +
            encodeURIComponent(cfg.adsense.cliente);
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
  }

  /**
   * Fill one ad container. Containers are plain empty divs in the HTML
   * (`.espaco-anuncio[data-slot="topo"]`), and CSS hides them while empty,
   * so an unconfigured site shows no gaps.
   */
  function montarAnuncio(container) {
    if (!adsenseConfigurado()) return;

    var nome = container.getAttribute('data-slot');
    var slot = cfg.adsense.slots && cfg.adsense.slots[nome];
    if (!slot) return;

    carregarScriptAdsense();

    var rotulo = document.createElement('div');
    rotulo.className = 'rotulo-publicidade';
    rotulo.textContent = 'Publicidade';

    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', cfg.adsense.cliente);
    ins.setAttribute('data-ad-slot', slot);
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');

    container.appendChild(rotulo);
    container.appendChild(ins);

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      /* Blocked by an ad blocker — the page keeps working. */
    }
  }

  /** Render affiliate cards for the current tool. */
  function montarAfiliados(container) {
    if (!cfg.afiliados || !cfg.afiliados.ativo) return;

    var ferramenta = document.body.getAttribute('data-ferramenta');
    var itens = (cfg.afiliados.blocos || {})[ferramenta];
    if (!itens || !itens.length) return;

    var rotulo = document.createElement('div');
    rotulo.className = 'rotulo-publicidade';
    rotulo.textContent = 'Parceiros — links patrocinados';
    container.appendChild(rotulo);

    itens.forEach(function (item) {
      if (!item || !item.url) return;

      var a = document.createElement('a');
      a.className = 'cartao-afiliado';
      a.href = item.url;
      a.target = '_blank';
      // sponsored + nofollow keeps the site compliant with Google's
      // link policy; noopener is the usual security hygiene.
      a.rel = 'sponsored nofollow noopener';

      var tit = document.createElement('span');
      tit.className = 'tit';
      tit.textContent = item.titulo || '';

      var desc = document.createElement('span');
      desc.className = 'desc';
      desc.textContent = item.descricao || '';

      var cta = document.createElement('span');
      cta.className = 'cta';
      cta.textContent = (item.rotulo || 'Ver mais') + ' →';

      a.appendChild(tit);
      a.appendChild(desc);
      a.appendChild(cta);
      container.appendChild(a);
    });
  }

  function iniciar() {
    var anuncios = document.querySelectorAll('.espaco-anuncio');
    for (var i = 0; i < anuncios.length; i++) montarAnuncio(anuncios[i]);

    var blocos = document.querySelectorAll('.bloco-afiliados');
    for (var j = 0; j < blocos.length; j++) montarAfiliados(blocos[j]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
