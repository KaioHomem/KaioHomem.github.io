/* ===================================================
   AUDIT AGENT
   Run: node ferramentas/auditoria.js
   Exit code 1 when something is actually broken.

   Runs without a browser and without network access, so
   it is cheap enough to gate every push. It checks the
   things that silently rot on a static site: links that
   stop resolving, pages that get heavy, images without
   alt text, and assets referenced but missing.
   =================================================== */

'use strict';

var fs = require('fs');
var path = require('path');

var RAIZ = path.join(__dirname, '..');

// A calculator page is mostly text; anything approaching this is a
// regression, not a feature. Mobile users in Brazil are the audience.
// Budgets are per page, because that is what a visitor downloads. Summing
// every file in the repository would count scripts nobody's browser ever
// requests and produce an alarm that is simply wrong.
var ORCAMENTO = {
  html: 60 * 1024,
  cssPorPagina: 60 * 1024,
  jsPorPagina: 90 * 1024
};

var problemas = [];
var avisos = [];
var checagens = 0;

function falha(msg) { problemas.push(msg); }
function aviso(msg) { avisos.push(msg); }

function paginasHtml(dir, encontradas) {
  encontradas = encontradas || [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entrada) {
    if (entrada.name === '.git' || entrada.name === 'node_modules') return;
    var completo = path.join(dir, entrada.name);
    if (entrada.isDirectory()) paginasHtml(completo, encontradas);
    else if (/\.html$/.test(entrada.name)) encontradas.push(completo);
  });
  return encontradas;
}

var paginas = paginasHtml(RAIZ);
var pesosPorPagina = [];
console.log('Páginas encontradas: ' + paginas.length + '\n');

/* ---------- LINKS AND ASSETS ---------- */
paginas.forEach(function (pagina) {
  var html = fs.readFileSync(pagina, 'utf8');
  var relativo = path.relative(RAIZ, pagina);
  var pastaDaPagina = path.dirname(pagina);

  // Every local href/src must resolve to a file that exists.
  var refs = [];
  var re = /(?:href|src)="([^"#][^"]*)"/g;
  var m;
  while ((m = re.exec(html)) !== null) refs.push(m[1]);

  refs.forEach(function (ref) {
    if (/^(https?:|mailto:|tel:|data:|#|\/\/)/.test(ref)) return;
    checagens++;

    var alvo = path.resolve(pastaDaPagina, ref.split('#')[0].split('?')[0]);
    if (!fs.existsSync(alvo)) {
      falha(relativo + ' aponta para "' + ref + '", que não existe.');
    }
  });

  // Mixed content breaks the padlock and gets blocked by the browser.
  checagens++;
  var http = html.match(/(?:href|src)="http:\/\/[^"]+"/g);
  if (http) {
    falha(relativo + ' carrega recurso por http:// — o site é https e o navegador bloqueia: ' + http[0]);
  }

  // Images need alt text; screen readers and search engines both read it.
  var imgs = html.match(/<img\b[^>]*>/g) || [];
  imgs.forEach(function (img) {
    checagens++;
    if (!/\balt=/.test(img)) {
      falha(relativo + ' tem <img> sem alt: ' + img.slice(0, 80));
    }
  });

  // External links that open a new tab need rel="noopener".
  var externos = html.match(/<a\b[^>]*target="_blank"[^>]*>/g) || [];
  externos.forEach(function (a) {
    checagens++;
    if (!/rel="[^"]*noopener/.test(a)) {
      falha(relativo + ' abre link em nova aba sem rel="noopener": ' + a.slice(0, 80));
    }
  });

  // Page weight.
  checagens++;
  var tamanho = Buffer.byteLength(html, 'utf8');
  if (tamanho > ORCAMENTO.html) {
    aviso(relativo + ' pesa ' + Math.round(tamanho / 1024) + 'KB — acima do orçamento de ' +
          Math.round(ORCAMENTO.html / 1024) + 'KB.');
  }

  // Language and viewport: cheap to forget, expensive on mobile ranking.
  checagens++;
  if (!/<html[^>]+lang=/.test(html)) falha(relativo + ' está sem lang no <html>.');
  checagens++;
  if (!/name="viewport"/.test(html)) falha(relativo + ' está sem meta viewport.');

  // Weight of what this page actually pulls down.
  function pesoDosRecursos(regex) {
    var total = 0;
    var achado;
    while ((achado = regex.exec(html)) !== null) {
      var ref = achado[1];
      if (/^(https?:|\/\/|data:)/.test(ref)) continue;
      var arquivo = path.resolve(pastaDaPagina, ref.split('?')[0]);
      if (fs.existsSync(arquivo)) total += fs.statSync(arquivo).size;
    }
    return total;
  }

  checagens++;
  var pesoJs = pesoDosRecursos(/<script[^>]+src="([^"]+)"/g);
  if (pesoJs > ORCAMENTO.jsPorPagina) {
    aviso(relativo + ' baixa ' + Math.round(pesoJs / 1024) + 'KB de JavaScript — acima de ' +
          Math.round(ORCAMENTO.jsPorPagina / 1024) + 'KB.');
  }

  checagens++;
  var pesoCss = pesoDosRecursos(/<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"/g);
  if (pesoCss > ORCAMENTO.cssPorPagina) {
    aviso(relativo + ' baixa ' + Math.round(pesoCss / 1024) + 'KB de CSS — acima de ' +
          Math.round(ORCAMENTO.cssPorPagina / 1024) + 'KB.');
  }

  pesosPorPagina.push({ pagina: relativo, js: pesoJs, css: pesoCss, html: tamanho });
});

/* ---------- WEIGHT REPORT ---------- */
// Report the worst page, not an average: the slowest page is the one that
// loses the visitor.
var maisPesada = pesosPorPagina.slice().sort(function (a, b) {
  return (b.js + b.css + b.html) - (a.js + a.css + a.html);
})[0];

if (maisPesada) {
  var totalPior = maisPesada.js + maisPesada.css + maisPesada.html;
  console.log('Página mais pesada: ' + maisPesada.pagina +
              ' — ' + Math.round(totalPior / 1024) + 'KB' +
              ' (HTML ' + Math.round(maisPesada.html / 1024) +
              ' + CSS ' + Math.round(maisPesada.css / 1024) +
              ' + JS ' + Math.round(maisPesada.js / 1024) + ')');
}

/* ---------- SITEMAP vs REALITY ---------- */
var caminhoSitemap = path.join(RAIZ, 'sitemap.xml');
if (fs.existsSync(caminhoSitemap)) {
  var xml = fs.readFileSync(caminhoSitemap, 'utf8');
  var urls = [];
  var reUrl = /<loc>https:\/\/kaiohomem\.github\.io\/([^<]*)<\/loc>/g;
  var u;
  while ((u = reUrl.exec(xml)) !== null) urls.push(u[1]);

  urls.forEach(function (rel) {
    checagens++;
    var arquivo = rel === '' ? 'index.html' : (rel.slice(-1) === '/' ? rel + 'index.html' : rel);
    if (!fs.existsSync(path.join(RAIZ, arquivo))) {
      falha('sitemap.xml lista /' + rel + ', mas ' + arquivo + ' não existe. ' +
            'URL no sitemap que dá 404 derruba a confiança do Google no arquivo inteiro.');
    }
  });
}

/* ---------- RESULT ---------- */
console.log('\n' + '-'.repeat(52));

if (avisos.length) {
  console.log('\nAvisos (não quebram o build):');
  avisos.forEach(function (a) { console.log('  ! ' + a); });
}

if (problemas.length === 0) {
  console.log('\n' + checagens + ' checagens de auditoria passaram.');
  process.exit(0);
}

console.error('\n' + problemas.length + ' problema(s):\n');
problemas.forEach(function (p) { console.error('  - ' + p); });
process.exit(1);
