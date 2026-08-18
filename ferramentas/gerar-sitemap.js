/* ===================================================
   SITEMAP GENERATOR
   Run: node ferramentas/gerar-sitemap.js
   Writes sitemap.xml at the repository root.

   Uses each file's own git commit date as <lastmod>, so
   pages that did not change keep their real date instead
   of all claiming to be fresh — search engines discount
   sitemaps where everything updates at once.
   =================================================== */

'use strict';

var fs = require('fs');
var path = require('path');
var execSync = require('child_process').execSync;

var BASE = 'https://kaiohomem.github.io';
var RAIZ = path.join(__dirname, '..');

var PAGINAS = [
  { caminho: 'index.html',                          url: '/',                                   prioridade: '0.8', frequencia: 'monthly' },
  { caminho: 'ferramentas/index.html',              url: '/ferramentas/',                       prioridade: '0.9', frequencia: 'weekly' },
  { caminho: 'produtos/folha-de-pagamento.html', url: '/produtos/folha-de-pagamento.html', prioridade: '0.9', frequencia: 'monthly' },
  { caminho: 'privacidade.html',                    url: '/privacidade.html',                   prioridade: '0.3', frequencia: 'yearly' },
  { caminho: 'ferramentas/salario-liquido.html',    url: '/ferramentas/salario-liquido.html',   prioridade: '1.0', frequencia: 'monthly' },
  { caminho: 'ferramentas/rescisao.html',           url: '/ferramentas/rescisao.html',          prioridade: '1.0', frequencia: 'monthly' },
  { caminho: 'ferramentas/decimo-terceiro.html',    url: '/ferramentas/decimo-terceiro.html',   prioridade: '1.0', frequencia: 'monthly' },
  { caminho: 'ferramentas/ferias.html',             url: '/ferramentas/ferias.html',            prioridade: '1.0', frequencia: 'monthly' },
  { caminho: 'ferramentas/seguro-desemprego.html',  url: '/ferramentas/seguro-desemprego.html', prioridade: '1.0', frequencia: 'monthly' },
  { caminho: 'ferramentas/horas-extras.html',       url: '/ferramentas/horas-extras.html',      prioridade: '0.9', frequencia: 'monthly' },
  { caminho: 'ferramentas/clt-vs-pj.html',          url: '/ferramentas/clt-vs-pj.html',         prioridade: '1.0', frequencia: 'monthly' },
  { caminho: 'ferramentas/juros-compostos.html',    url: '/ferramentas/juros-compostos.html',   prioridade: '0.9', frequencia: 'monthly' },
  { caminho: 'ferramentas/financiamento.html',      url: '/ferramentas/financiamento.html',     prioridade: '0.9', frequencia: 'monthly' }
];

function dataDoArquivo(relativo) {
  try {
    var saida = execSync('git log -1 --format=%cI -- ' + JSON.stringify(relativo), {
      cwd: RAIZ,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
    if (saida) return saida.slice(0, 10);
  } catch (e) {
    /* Not a git checkout, or the file was never committed. */
  }
  return new Date().toISOString().slice(0, 10);
}

var entradas = PAGINAS
  .filter(function (p) {
    var existe = fs.existsSync(path.join(RAIZ, p.caminho));
    if (!existe) console.warn('aviso: ' + p.caminho + ' não existe, fora do sitemap');
    return existe;
  })
  .map(function (p) {
    return '  <url>\n' +
           '    <loc>' + BASE + p.url + '</loc>\n' +
           '    <lastmod>' + dataDoArquivo(p.caminho) + '</lastmod>\n' +
           '    <changefreq>' + p.frequencia + '</changefreq>\n' +
           '    <priority>' + p.prioridade + '</priority>\n' +
           '  </url>';
  });

var xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
          entradas.join('\n') + '\n' +
          '</urlset>\n';

fs.writeFileSync(path.join(RAIZ, 'sitemap.xml'), xml, 'utf8');
console.log('sitemap.xml gerado com ' + entradas.length + ' URLs.');
