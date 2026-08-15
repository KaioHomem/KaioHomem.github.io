/* ===================================================
   FERRAMENTAS BR — SHARED SHELL
   Renders the header/footer every page has in common and
   exposes the input helpers the calculators reuse.
   =================================================== */

(function () {
  'use strict';

  var FERRAMENTAS = [
    { id: 'salario-liquido', arquivo: 'salario-liquido.html', nome: 'Salário líquido' },
    { id: 'rescisao',        arquivo: 'rescisao.html',        nome: 'Rescisão' },
    { id: 'decimo-terceiro', arquivo: 'decimo-terceiro.html', nome: '13º salário' },
    { id: 'ferias',          arquivo: 'ferias.html',          nome: 'Férias' },
    { id: 'juros-compostos', arquivo: 'juros-compostos.html', nome: 'Juros compostos' },
    { id: 'financiamento',   arquivo: 'financiamento.html',   nome: 'Financiamento' }
  ];

  var atual = document.body.getAttribute('data-ferramenta') || '';

  // The shell is reused by pages that live at the site root (the privacy
  // policy), so links have to be built relative to where we actually are.
  var emSubpasta = /\/(ferramentas|painel)\//.test(window.location.pathname);
  var paraFerramentas = emSubpasta ? '' : 'ferramentas/';
  var paraRaiz = emSubpasta ? '../' : '';

  /* ---------- SHELL ---------- */
  function montarTopo() {
    var alvo = document.getElementById('topo');
    if (!alvo) return;

    var links = FERRAMENTAS.map(function (f) {
      var ativo = f.id === atual ? ' class="ativo"' : '';
      return '<a href="' + f.arquivo + '"' + ativo + '>' + f.nome + '</a>';
    }).join('');

    alvo.innerHTML =
      '<div class="wrap topo-inner">' +
        '<a href="index.html" class="marca">ferramentas<span>.</span></a>' +
        '<nav aria-label="Ferramentas">' + links + '</nav>' +
      '</div>';
  }

  function montarRodape() {
    var alvo = document.getElementById('rodape');
    if (!alvo) return;

    var tabelas = window.FerramentasBR ? window.FerramentasBR.TABELAS : { ano: '', atualizadoEm: '' };

    alvo.innerHTML =
      '<div class="wrap">' +
        '<div class="rodape-links">' +
          FERRAMENTAS.map(function (f) {
            return '<a href="' + paraFerramentas + f.arquivo + '">' + f.nome + '</a>';
          }).join('') +
          '<a href="' + paraRaiz + 'index.html">Sobre o autor</a>' +
          '<a href="' + paraRaiz + 'privacidade.html">Privacidade</a>' +
          '<a href="#" id="rever-cookies">Cookies</a>' +
        '</div>' +
        '<p>Cálculos baseados nas tabelas oficiais de ' + tabelas.ano +
        ' (INSS, IRRF e Lei 15.270/2025). Última revisão das tabelas: ' +
        tabelas.atualizadoEm + '.</p>' +
        '<p>As ferramentas são estimativas para orientação pessoal e não substituem ' +
        'o cálculo do seu empregador, contador ou sindicato. Valores reais podem variar ' +
        'por acordo coletivo, benefícios e verbas específicas do seu contrato.</p>' +
        '<p>Feito por <a href="' + paraRaiz + 'index.html">Kaio Felipe</a> · ' +
        '<a href="https://github.com/KaioHomem/KaioHomem.github.io">código aberto no GitHub</a></p>' +
      '</div>';

    var rever = document.getElementById('rever-cookies');
    if (rever) {
      rever.addEventListener('click', function (e) {
        e.preventDefault();
        if (window.Consentimento) {
          if (window.Consentimento.precisaDeConsentimento()) {
            window.Consentimento.reabrir();
          } else {
            alert('Este site ainda não usa cookies — a publicidade está desativada. ' +
                  'Quando for ativada, o aviso de consentimento aparece automaticamente.');
          }
        }
      });
    }
  }

  /* ---------- INPUT HELPERS ---------- */
  /**
   * Parse a number the way a Brazilian would type it.
   * Accepts "3.500,50", "3500,50", "3500.50" and "3500".
   */
  function paraNumero(texto) {
    if (typeof texto === 'number') return isFinite(texto) ? texto : 0;

    var s = String(texto == null ? '' : texto).trim().replace(/[^\d,.-]/g, '');
    if (!s) return 0;

    if (s.indexOf(',') > -1) {
      // Comma present: it is the decimal separator, dots are thousands.
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      var partes = s.split('.');
      if (partes.length > 2) {
        s = partes.join('');                       // 1.234.567
      } else if (partes.length === 2 && partes[1].length === 3) {
        s = partes.join('');                       // 3.500 → 3500
      }
    }

    var n = parseFloat(s);
    return isFinite(n) ? n : 0;
  }

  function valorDe(id) {
    var el = document.getElementById(id);
    return el ? paraNumero(el.value) : 0;
  }

  function inteiroDe(id) {
    var el = document.getElementById(id);
    if (!el) return 0;
    var n = parseInt(paraNumero(el.value), 10);
    return isFinite(n) ? n : 0;
  }

  function textoDe(id) {
    var el = document.getElementById(id);
    return el ? el.value : '';
  }

  function marcadoDe(id) {
    var el = document.getElementById(id);
    return el ? !!el.checked : false;
  }

  /** Show a result block and bring it into view without yanking the page. */
  function mostrarResultado(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.add('visivel');

    var reduzirMovimento = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var topo = el.getBoundingClientRect().top;
    if (topo > window.innerHeight * 0.9) {
      el.scrollIntoView({ behavior: reduzirMovimento ? 'auto' : 'smooth', block: 'start' });
    }
  }

  /** Recalculate on Enter anywhere in the form. */
  function ligarEnter(formId, aoCalcular) {
    var form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        aoCalcular();
      }
    });
  }

  /** Build one row of a breakdown list. */
  function linha(rotulo, valor, opcoes) {
    var o = opcoes || {};
    var F = window.FerramentasBR;
    var classes = 'linha' + (o.total ? ' total' : '');
    var classeValor = 'val' + (o.tipo ? ' ' + o.tipo : '');
    var sub = o.sub ? '<span class="sub">' + o.sub + '</span>' : '';
    var texto = o.bruto !== undefined ? o.bruto : F.brl(valor);

    return '<div class="' + classes + '">' +
             '<span class="rot">' + rotulo + sub + '</span>' +
             '<span class="' + classeValor + '">' + texto + '</span>' +
           '</div>';
  }

  function grupo(titulo) {
    return '<div class="linha grupo"><span class="rot">' + titulo + '</span><span></span></div>';
  }

  window.App = {
    paraNumero: paraNumero,
    valorDe: valorDe,
    inteiroDe: inteiroDe,
    textoDe: textoDe,
    marcadoDe: marcadoDe,
    mostrarResultado: mostrarResultado,
    ligarEnter: ligarEnter,
    linha: linha,
    grupo: grupo
  };

  function iniciar() {
    montarTopo();
    montarRodape();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
