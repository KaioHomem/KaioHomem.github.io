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
    { id: 'seguro-desemprego', arquivo: 'seguro-desemprego.html', nome: 'Seguro-desemprego' },
    { id: 'horas-extras',    arquivo: 'horas-extras.html',    nome: 'Horas extras' },
    { id: 'clt-vs-pj',       arquivo: 'clt-vs-pj.html',       nome: 'CLT vs PJ' },
    { id: 'custo-funcionario', arquivo: 'custo-funcionario.html', nome: 'Custo de funcionário' },
    { id: 'custo-demissao',  arquivo: 'custo-demissao.html',  nome: 'Custo de demissão' },
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

    // No celular o menu vira uma faixa rolável, e a partir da oitava
    // ferramenta o link da página atual nasce fora da tela: o visitante
    // não vê onde está.
    //
    // Aqui a faixa é movida direto pelo scrollLeft, e não por
    // scrollIntoView: mesmo com block:'nearest' o scrollIntoView subiu a
    // cadeia de ancestrais e rolou o documento inteiro — no financiamento
    // a página abria 821px abaixo do topo. Mexer só no contêiner não tem
    // como mover a página.
    var nav = alvo.querySelector('nav');
    var ativo = nav && nav.querySelector('a.ativo');
    if (nav && ativo && nav.scrollWidth > nav.clientWidth) {
      nav.scrollLeft = Math.max(
        0,
        ativo.offsetLeft - (nav.clientWidth - ativo.offsetWidth) / 2
      );
    }
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

  /* ---------- RELATED TOOLS ---------- */
  /**
   * Cross-links between calculators.
   *
   * These are the pairs a real visitor actually needs next — someone
   * calculating severance wants the unemployment benefit, not compound
   * interest. Internal links also spread crawl and ranking signal across
   * pages instead of leaving each one isolated.
   */
  var RELACIONADAS = {
    'salario-liquido':   ['decimo-terceiro', 'ferias', 'horas-extras'],
    'rescisao':          ['seguro-desemprego', 'ferias', 'decimo-terceiro'],
    'decimo-terceiro':   ['salario-liquido', 'ferias', 'rescisao'],
    'ferias':            ['decimo-terceiro', 'salario-liquido', 'rescisao'],
    'seguro-desemprego': ['rescisao', 'salario-liquido', 'clt-vs-pj'],
    'horas-extras':      ['salario-liquido', 'decimo-terceiro', 'ferias'],
    'clt-vs-pj':         ['salario-liquido', 'rescisao', 'seguro-desemprego'],
    'juros-compostos':   ['financiamento', 'salario-liquido'],
    'financiamento':     ['juros-compostos', 'salario-liquido']
  };

  var DESCRICOES = {
    'salario-liquido':   'Quanto realmente cai na conta.',
    'rescisao':          'Verba por verba, com a multa do FGTS.',
    'decimo-terceiro':   'As duas parcelas e por que a segunda é menor.',
    'ferias':            'Com o terço e a conta de vender dias.',
    'seguro-desemprego': 'Valor da parcela e quantas você recebe.',
    'horas-extras':      'Com o DSR que costuma faltar no holerite.',
    'clt-vs-pj':         'Quanto faturar como PJ para empatar.',
    'juros-compostos':   'O efeito dos aportes ao longo do tempo.',
    'financiamento':     'Price e SAC lado a lado.'
  };

  function acharFerramenta(id) {
    for (var i = 0; i < FERRAMENTAS.length; i++) {
      if (FERRAMENTAS[i].id === id) return FERRAMENTAS[i];
    }
    return null;
  }

  function montarRelacionadas() {
    if (!atual) return;

    var ids = RELACIONADAS[atual];
    if (!ids || !ids.length) return;

    var principal = document.querySelector('main');
    if (!principal) return;

    var cartoes = ids.map(function (id) {
      var f = acharFerramenta(id);
      if (!f) return '';
      return '<a class="item-ferramenta" href="' + paraFerramentas + f.arquivo + '">' +
               '<h3>' + f.nome + '</h3>' +
               '<p>' + (DESCRICOES[id] || '') + '</p>' +
               '<span class="seta">Abrir →</span>' +
             '</a>';
    }).join('');

    if (!cartoes) return;

    var secao = document.createElement('section');
    secao.className = 'relacionadas';
    secao.innerHTML = '<h2>Continue a conta</h2>' +
                      '<div class="lista-ferramentas">' + cartoes + '</div>';

    // Sits after the article, before the closing ad slot.
    var ultimoAnuncio = principal.querySelector('.espaco-anuncio[data-slot="rodape"]');
    if (ultimoAnuncio) principal.insertBefore(secao, ultimoAnuncio);
    else principal.appendChild(secao);
  }

  /* ---------- PRODUCT CTA ---------- */
  /**
   * Only on the pages whose visitors plausibly run a payroll for other
   * people. Someone checking their own net salary is not a buyer, and
   * putting an ad in front of them is noise that costs trust.
   */
  var PRODUTO = {
    paginas: ['salario-liquido', 'decimo-terceiro', 'ferias', 'clt-vs-pj'],
    titulo: 'Você calcula a folha de outras pessoas?',
    texto: 'O Folha Simples faz esta mesma conta para vários funcionários de uma vez e ' +
           'imprime o holerite de cada um. Roda offline — os salários não saem do seu computador.',
    rotulo: 'Ver o Folha Simples'
  };

  function montarProduto() {
    if (PRODUTO.paginas.indexOf(atual) === -1) return;

    var principal = document.querySelector('main');
    if (!principal) return;

    var caminho = (emSubpasta ? '../' : '') + 'produtos/folha-de-pagamento.html';
    var secao = document.createElement('aside');
    secao.className = 'produto-cta';
    secao.innerHTML =
      '<div class="produto-rot">Ferramenta paga</div>' +
      '<h3>' + PRODUTO.titulo + '</h3>' +
      '<p>' + PRODUTO.texto + '</p>' +
      '<a href="' + caminho + '">' + PRODUTO.rotulo + ' →</a>';

    var anuncio = principal.querySelector('.espaco-anuncio[data-slot="rodape"]');
    if (anuncio) principal.insertBefore(secao, anuncio);
    else principal.appendChild(secao);
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

    // Toda página roda um cálculo sozinha ao abrir, para o visitante já
    // ver um exemplo pronto. Rolar nesse primeiro cálculo o jogava para
    // além do título e do formulário, direto num resultado de valores
    // padrão que ele não pediu — no celular, um salto de 821px logo na
    // chegada. Só a partir do segundo cálculo houve um clique.
    var primeiro = !el.getAttribute('data-ja-mostrado');
    el.setAttribute('data-ja-mostrado', '1');
    if (primeiro) return;

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
    montarRelacionadas();
    montarProduto();
    montarRodape();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
