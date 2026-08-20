/* ===================================================
   VERIFICAÇÃO DAS PÁGINAS NO NAVEGADOR
   Uso: node ferramentas/verificar-paginas.js

   Os outros gates leem os arquivos. Este abre as páginas
   num Chromium de verdade, porque há uma classe inteira de
   defeito que só existe em tempo de execução: erro de
   JavaScript que apaga a tela, campo que não responde,
   página que rola sozinha para o lugar errado.

   Foi escrito depois de dois desses. O cálculo automático
   de abertura chamava scrollIntoView e jogava o visitante
   821px abaixo do topo no celular — em todas as dez
   páginas, sem que nenhum gate percebesse.

   Precisa do Playwright: npm ci (ou npm i playwright).
   =================================================== */

'use strict';

var path = require('path');
var chromium = require('playwright').chromium;

var RAIZ = path.join(__dirname, '..');

// A lista vem do app.js, mesma fonte de verdade do menu e do
// verificar-consistencia.js: ferramenta nova entra aqui sozinha.
var app = require('fs').readFileSync(path.join(__dirname, 'app.js'), 'utf8');
var bloco = app.match(/var FERRAMENTAS = \[([\s\S]*?)\];/);
if (!bloco) {
  console.error('Não achei a lista FERRAMENTAS em app.js.');
  process.exit(1);
}

var PAGINAS = [];
var re = /arquivo:\s*'([^']+)'/g;
var m;
while ((m = re.exec(bloco[1])) !== null) PAGINAS.push(m[1]);

var problemas = [];
var checagens = 0;

function exigir(condicao, mensagem) {
  checagens++;
  if (!condicao) problemas.push(mensagem);
}

// Telefone estreito: é onde os dois defeitos apareceram, e é de onde vem
// a maior parte do tráfego de busca no Brasil.
var TELA = { width: 390, height: 844 };

(async function () {
  // CHROMIUM_PATH existe para ambientes que já têm o navegador em outro
  // lugar e não podem baixar o que o Playwright espera. Na CI a variável
  // não é definida e o caminho padrão vale.
  var browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
  );

  for (var i = 0; i < PAGINAS.length; i++) {
    var arquivo = PAGINAS[i];
    var page = await browser.newPage({ viewport: TELA, locale: 'pt-BR' });

    var erros = [];
    page.on('pageerror', function (e) { erros.push(e.message); });

    await page.goto('file://' + path.join(RAIZ, 'ferramentas', arquivo));
    await page.waitForTimeout(400);

    exigir(erros.length === 0, arquivo + ' quebrou no navegador: ' + erros.join(' | '));

    // A página abre com um cálculo de exemplo já feito. Ele não pode
    // rolar a tela: o visitante chegaria depois do título e do
    // formulário, num resultado que não pediu.
    var aoCarregar = await page.evaluate(function () { return window.scrollY; });
    exigir(aoCarregar === 0,
      arquivo + ' rolou ' + aoCarregar + 'px sozinha ao abrir. O cálculo automático ' +
      'não pode mover a tela.');

    // Nada pode transbordar na horizontal num celular.
    var transborda = await page.evaluate(function () {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    exigir(!transborda, arquivo + ' transborda na horizontal em ' + TELA.width + 'px.');

    // O menu virou faixa rolável no celular; o link da página atual tem
    // de estar visível, ou o visitante não sabe onde está.
    var ativo = await page.evaluate(function () {
      var a = document.querySelector('#topo nav a.ativo');
      if (!a) return null;
      var r = a.getBoundingClientRect();
      return { x: r.left, direita: r.right };
    });
    exigir(ativo !== null, arquivo + ' não marcou nenhum link do menu como ativo.');
    if (ativo) {
      exigir(ativo.x >= -1 && ativo.direita <= TELA.width + 1,
        arquivo + ': o link ativo do menu está fora da tela (x=' + Math.round(ativo.x) + ').');
    }

    // Contraste medido no navegador, com as cores computadas de verdade.
    // Nenhum analisador estático acerta isto: as cores vêm de variáveis
    // CSS num arquivo externo, e fundo semitransparente só existe depois
    // de composto com o que está atrás. Ferramenta que lê o HTML sozinha
    // assume fundo branco e acusa dezenas de falhas que não existem.
    var reprovados = await page.evaluate(function () {
      function comp(f, t) { var a = f[3]; return [0,1,2].map(function(i){
        return Math.round(f[i]*a + t[i]*(1-a)); }); }
      function rgba(s) {
        var n = (s.match(/[\d.]+/g) || []).map(Number);
        return [n[0]||0, n[1]||0, n[2]||0, n.length > 3 ? n[3] : 1];
      }
      function fundo(el) {
        var camadas = [], n = el;
        while (n && n !== document.documentElement) {
          var c = rgba(getComputedStyle(n).backgroundColor);
          if (c[3] > 0) { camadas.push(c); if (c[3] === 1) break; }
          n = n.parentElement;
        }
        var raiz = rgba(getComputedStyle(document.documentElement).backgroundColor);
        var base = raiz[3] === 1 ? raiz.slice(0, 3) : [255, 255, 255];
        for (var i = camadas.length - 1; i >= 0; i--) base = comp(camadas[i], base);
        return base;
      }
      function lum(c) {
        var v = c.map(function (x) { x /= 255;
          return x <= 0.03928 ? x/12.92 : Math.pow((x+0.055)/1.055, 2.4); });
        return 0.2126*v[0] + 0.7152*v[1] + 0.0722*v[2];
      }

      var fora = [];
      document.querySelectorAll('p, li, span, h1, h2, h3, a, label, td, th').forEach(function (el) {
        var txt = (el.textContent || '').trim();
        if (!txt || el.offsetParent === null) return;
        var cs = getComputedStyle(el);
        var cor = rgba(cs.color);
        if (cor[3] < 0.9) return;
        var bg = fundo(el);
        var L1 = lum(cor.slice(0,3)), L2 = lum(bg);
        var r = (Math.max(L1,L2) + 0.05) / (Math.min(L1,L2) + 0.05);
        var px = parseFloat(cs.fontSize);
        var grande = px >= 24 || (px >= 18.66 && parseInt(cs.fontWeight,10) >= 700);
        var exigido = grande ? 3 : 4.5;
        if (r < exigido - 0.01) {
          fora.push(r.toFixed(2) + ':1 (precisa ' + exigido + ') ' +
                    Math.round(px) + 'px "' + txt.slice(0, 30) + '"');
        }
      });
      return fora.slice(0, 4);
    });

    exigir(reprovados.length === 0,
      arquivo + ': texto abaixo do contraste mínimo da WCAG AA — ' + reprovados.join(' | '));

    // E o botão precisa calcular de verdade.
    var antes = await page.textContent('#resultado');
    await page.click('#calcular');
    await page.waitForTimeout(600);
    var depois = await page.textContent('#resultado');
    exigir(depois && depois.trim().length > 0, arquivo + ': o botão Calcular não produziu resultado.');
    exigir(erros.length === 0, arquivo + ' quebrou ao calcular: ' + erros.join(' | '));

    // Aí sim a rolagem é bem-vinda: houve clique.
    var aposClique = await page.evaluate(function () { return window.scrollY; });
    exigir(aposClique > 0, arquivo + ': o resultado não foi trazido para a tela após o clique.');

    void antes;
    await page.close();
  }

  await browser.close();

  console.log('\n' + '-'.repeat(52));
  if (problemas.length === 0) {
    console.log(checagens + ' checagens de navegador passaram em ' + PAGINAS.length + ' páginas.');
    process.exit(0);
  }
  console.error(problemas.length + ' problema(s) no navegador:\n');
  problemas.forEach(function (p) { console.error('  - ' + p); });
  process.exit(1);
})();
