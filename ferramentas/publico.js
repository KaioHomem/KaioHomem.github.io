/* ===================================================
   O QUE É PÚBLICO — fonte única de verdade

   Este arquivo decide o que o visitante pode baixar. Ele é
   lido por três lugares:

     gerar-dist.js ......... constrói o diretório publicado
     verificar-publicacao.js  reprova vazamento
     verificar-paginas.js .. abre as páginas no navegador
     verificar-design.js ... roda o detector

   >>> A lista é um ALLOWLIST, e isso é deliberado.

   Um denylist ("copie tudo menos X") erra por omissão: no dia
   em que alguém põe um arquivo novo no lugar errado, ele é
   publicado porque ninguém lembrou de proibi-lo. Um allowlist
   erra por ausência: o arquivo novo simplesmente não aparece
   no site, alguém percebe, e adiciona aqui. Um erro que
   esconde conteúdo é recuperável; um que publica o produto
   pago, não.
   =================================================== */

'use strict';

var DIST = 'dist';

/* ---------- O QUE ENTRA NO dist/ ---------- */

// Caminhos relativos à raiz do repositório. Diretório termina em '/'
// e leva junto os arquivos que casarem com `apenas`, se houver.
var ALLOWLIST = [
  // --- raiz: portfólio e páginas soltas ---
  'index.html',
  'privacidade.html',
  'style.css',
  'script.js',
  'translations.js',
  'robots.txt',
  'sitemap.xml',

  // --- imagens e documentos da raiz ---
  'foto.png',
  'og-image.png',
  'chatdeconversa-preview.png',
  'portfolio-preview.png',
  'ferramentas-preview.svg',
  'cv-kaio-felipe.pdf',
  'cv-kaio-felipe-en.pdf',
  'cv-kaio-felipe-de.pdf',

  // --- as 11 calculadoras gratuitas e o que elas carregam ---
  // O nucleo.js entra porque as páginas o carregam por <script>: é o
  // motor fiscal e ele É público. O que não entra são os scripts de
  // Node ao lado dele (testes, auditoria, verificar-*, gerar-*), que
  // nunca foram pedidos por nenhum navegador.
  { dir: 'ferramentas/', apenas: /\.html$/ },
  'ferramentas/app.js',
  'ferramentas/tools.css',
  'ferramentas/nucleo.js',
  'ferramentas/consentimento.js',
  'ferramentas/monetizacao.js',
  { dir: 'ferramentas/', apenas: /^pg-[a-z-]+\.js$/ },

  // --- páginas de venda, entrega e demonstração ---
  'produtos/folha-de-pagamento.html',
  'produtos/oferta-rescisao.html',
  'produtos/demo.html',
  'produtos/obrigado.html',
  'produtos/obrigado-completo.html',
  'produtos/pagamento.js',
  'produtos/funil.js',
  'produtos/comparador-rescisao.js',
  'produtos/entrega.js',
  { dir: 'produtos/', apenas: /^tela-[a-z]+\.webp$/ },

  // --- painel interno, servido mas não anunciado ---
  'painel/index.html',
  'painel/painel.css',
  'painel/painel.js',
  'painel/conexoes.js'
];

/* ---------- O QUE NUNCA ENTRA ---------- */

// Os arquivos que se vende. Ficam no repositório porque o gate de
// paridade precisa lê-los, e entram no bundle do Worker como módulo
// de texto — nunca no diretório publicado.
var PAGOS = {
  base: {
    arquivo: 'produtos/folha-simples-fc86aa480de7f81c.html',
    nomeParaOComprador: 'folha-simples.html',
    rotulo: 'Folha Simples'
  },
  completo: {
    arquivo: 'produtos/folha-simples-completo-fc86aa480de7f81c.html',
    nomeParaOComprador: 'folha-simples-completo.html',
    rotulo: 'Folha Simples Completo'
  }
};

/* ---------- ASSINATURAS DO PRODUTO PAGO ----------

   Trechos que só existem no produto pago. O gate de publicação
   reprova se qualquer um aparecer dentro do dist/, mesmo num
   arquivo renomeado.

   >>> LIMITAÇÃO REAL, e ela precisa estar escrita aqui.

   Estas assinaturas identificam o MÓDULO DE RESCISÃO, que é o que
   separa o build completo dos demais. Não existe assinatura que
   separe o PRODUTO BASE da demonstração gratuita — foi medido, e o
   resultado foi zero: nenhum identificador e nenhuma frase do base
   está ausente da demo.

   O motivo é o desenho da demo: `gerar-demo.js` troca uma linha
   (`var DEMO=null` por `var DEMO={limite:2}`) e não remove nada. A
   demo é o produto inteiro com um limite por cima.

   Consequência: para o base, quem protege é a checagem por hash
   exato (um arquivo renomeado tem o mesmo conteúdo), não a busca
   por trecho. E nem o hash protege contra alguém editar a demo de
   volta — isso está registrado em conhecimento/estado-do-negocio.md
   como restrição conhecida, não como defeito novo.

   Se alguém for "melhorar" este gate procurando assinatura do base:
   não existe. Mude a demo primeiro.                              */
var ASSINATURAS = [
  'montarTermoRescisao',
  'preencherPainelRescisao',
  'custoDemissaoDe',
  'ligarPainelRescisao'
];

/* ---------- PÁGINAS QUE OS GATES ABREM ---------- */

// Públicas: conferidas dentro do dist/, que é o que o visitante
// realmente recebe. Testar a origem enquanto se serve o build é a
// mesma classe de defeito que o gate de paridade existe para impedir
// no motor fiscal.
var PAGINAS_PUBLICAS_EXTRAS = [
  'index.html',
  'privacidade.html',
  'painel/index.html',
  'ferramentas/index.html',
  'produtos/folha-de-pagamento.html',
  'produtos/demo.html',
  'produtos/obrigado.html',
  'produtos/obrigado-completo.html',
  'produtos/oferta-rescisao.html'
];

// Pagas: conferidas na origem, porque por desenho não existem no
// dist/. Continuam sendo abertas num navegador de verdade — se algo
// quebrar nelas, quebrou na mão de quem pagou.
function paginasPagas() {
  return [PAGOS.base.arquivo, PAGOS.completo.arquivo];
}

/* Onde cada página está de verdade.

   Página pública vem do dist/, que é o que o visitante recebe. Testar
   a origem enquanto se serve o build deixaria os dois divergirem sem
   ninguém notar — é o mesmo defeito que o gate de paridade impede no
   motor fiscal, num lugar novo.

   Página paga vem da origem, porque por desenho ela não existe no
   dist/. Continua sendo aberta num navegador: se algo quebrar nela,
   quebrou na mão de quem pagou. */
function caminhoDe(raiz, relativo) {
  var path = require('path');
  return paginasPagas().indexOf(relativo) !== -1
    ? path.join(raiz, relativo)
    : path.join(raiz, DIST, relativo);
}

module.exports = {
  ALLOWLIST: ALLOWLIST,
  caminhoDe: caminhoDe,
  PAGOS: PAGOS,
  ASSINATURAS: ASSINATURAS,
  PAGINAS_PUBLICAS_EXTRAS: PAGINAS_PUBLICAS_EXTRAS,
  paginasPagas: paginasPagas,
  DIST: DIST
};
