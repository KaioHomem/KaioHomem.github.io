/* ===================================================
   DETECTOR DE DESIGN (impeccable)
   Uso: node ferramentas/verificar-design.js

   Roda o detector do impeccable sobre todas as páginas
   publicadas, num Chromium de verdade. Ele pega uma classe
   de defeito que os outros gates não pegam: tarja colorida
   na lateral do cartão, fonte batida, linha longa demais,
   caixa-alta em texto corrido, hierarquia de títulos que
   pula nível, escada de tipos achatada.

   Não substitui o verificar-paginas.js: o contraste de lá é
   medido com o pixel pintado e a opacidade acumulada dos
   ancestrais, e é mais preciso que o daqui — o detector lê a
   parada de um gradiente sem aplicar o alfa e acusa 1,0:1 em
   texto que mede 6,9:1. Por isso os dois rodam.

   Precisa de puppeteer (devDependency) e de um Chromium.
   Em ambiente sem download, aponte PUPPETEER_EXECUTABLE_PATH
   para um navegador já instalado.
   =================================================== */

'use strict';

var path = require('path');
var fs = require('fs');
var { execFileSync } = require('child_process');

var RAIZ = path.join(__dirname, '..');
var DETECTOR = path.join(RAIZ, '.claude', 'skills', 'impeccable', 'scripts', 'detect.mjs');

if (!fs.existsSync(DETECTOR)) {
  console.error('Não achei o detector em ' + DETECTOR + '.');
  console.error('Ele vem do pacote impeccable: as skills estão em .claude/skills/.');
  process.exit(1);
}

// Mesma fonte de verdade do menu, do verificar-consistencia.js e do
// verificar-paginas.js: calculadora nova entra aqui sozinha.
var app = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
var bloco = app.match(/var FERRAMENTAS = \[([\s\S]*?)\];/);
if (!bloco) {
  console.error('Não achei a lista FERRAMENTAS em app.js.');
  process.exit(1);
}

var PAGINAS = [];
var re = /arquivo:\s*'([^']+)'/g;
var m;
while ((m = re.exec(bloco[1])) !== null) PAGINAS.push('ferramentas/' + m[1]);

PAGINAS = PAGINAS.concat([
  'index.html',
  'privacidade.html',
  'painel/index.html',
  'ferramentas/index.html',
  'produtos/folha-de-pagamento.html',
  'produtos/demo.html',
  'produtos/obrigado.html'
]);

var achados = [];

// Uma chamada só com todas as URLs: o detector aceita vários alvos e
// reaproveita o navegador. Uma chamada por página abria dezoito
// Chromiums e o gate estourava dez minutos sozinho.
var urls = PAGINAS.map(function (p) { return 'file://' + path.join(RAIZ, p); });

var saida;
try {
  saida = execFileSync('node', [DETECTOR, '--no-advisory', '--json'].concat(urls), {
    cwd: RAIZ,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    env: Object.assign({}, process.env, { CI: '1' })
  });
} catch (e) {
  // O detector sai com código != 0 quando acha algo: a saída ainda é o JSON.
  saida = (e.stdout || '').toString();
  if (!saida.trim()) {
    console.error('Detector falhou:\n' + (e.stderr || e.message));
    process.exit(1);
  }
}

var lista;
try { lista = JSON.parse(saida); }
catch (e) { console.error('Saída ilegível do detector.'); process.exit(1); }

lista.forEach(function (f) {
  var url = String(f.file || '');
  var pagina = url.indexOf(RAIZ) >= 0 ? url.slice(url.indexOf(RAIZ) + RAIZ.length + 1) : url;
  achados.push({ pagina: pagina, regra: f.antipattern, trecho: f.snippet });
});

console.log('\n----------------------------------------------------');
if (achados.length === 0) {
  console.log(PAGINAS.length + ' páginas passaram no detector de design.');
  process.exit(0);
}

console.log(achados.length + ' antipadrão(ões) de design:\n');
achados.forEach(function (a) {
  console.log('  - ' + a.pagina + '  [' + a.regra + '] ' + a.trecho);
});
process.exit(1);
