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
while ((m = re.exec(bloco[1])) !== null) PAGINAS.push('ferramentas/' + m[1]);

// As páginas que não são calculadora não têm menu com link ativo nem
// botão #calcular, mas têm tudo o mais: erro de JavaScript, transbordo
// horizontal, rolagem sozinha e contraste. Ficavam de fora do gate — e
// duas delas são a página de venda e a demonstração, que é onde o
// dinheiro entra.
var EXTRAS = [
  'index.html',
  'privacidade.html',
  'painel/index.html',
  'ferramentas/index.html',
  'produtos/folha-de-pagamento.html',
  'produtos/demo.html',
  'produtos/obrigado.html',
  // O arquivo que o comprador baixa. É o produto: se algo aqui quebrar,
  // quebrou na mão de quem pagou.
  'produtos/folha-simples-fc86aa480de7f81c.html'
];

var problemas = [];
var checagens = 0;

function exigir(condicao, mensagem) {
  checagens++;
  if (!condicao) problemas.push(mensagem);
}

// Telefone estreito: é onde os dois defeitos apareceram, e é de onde vem
// a maior parte do tráfego de busca no Brasil.
var TELA = { width: 390, height: 844 };

// Contraste com os pixels pintados. Duas etapas dentro da página:
// primeiro marca os elementos que têm texto próprio, depois recorta cada
// um com el.screenshot() — que o Playwright rola e alinha sozinho — e lê
// a moda dos pixels como fundo.
//
// A captura é por elemento e não de página inteira de propósito:
// fullPage redimensiona a janela, o layout reflui e os retângulos
// deixam de bater com a imagem. Isso já mediu fundo onde não havia
// texto nenhum e reprovou um h2 branco como se fosse cinza de borda.
async function medirContraste(page) {
  // Espera a animação de entrada terminar. Sem isto a medição pega o
  // meio do fade: o herói do index.html tem `animation: hero-in`, e a
  // 400ms o botão azul com texto escuro aparecia como 2,00:1 porque
  // ainda estava meio transparente. Animação infinita (ponto pulsando)
  // nunca resolve, daí o limite de 2s.
  await page.evaluate(function () {
    return Promise.race([
      Promise.all(document.getAnimations().map(function (a) {
        return a.finished.catch(function () {});
      })),
      new Promise(function (r) { setTimeout(r, 2000); })
    ]);
  });

  await page.evaluate(function () {
    function cor(s) {
      var n = (s.match(/[\d.]+/g) || []).map(Number);
      return [n[0] || 0, n[1] || 0, n[2] || 0, n.length > 3 ? n[3] : 1];
    }
    function sobre(f, t) {
      var a = f[3];
      return [0, 1, 2].map(function (i) { return Math.round(f[i] * a + t[i] * (1 - a)); });
    }
    function contraste(a, b) {
      function canal(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
      function lum(p) { return 0.2126 * canal(p[0]) + 0.7152 * canal(p[1]) + 0.0722 * canal(p[2]); }
      var la = lum(a), lb = lum(b);
      return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
    }

    window.__marcar = function () {
      var lista = [];
      document.querySelectorAll('p,li,span,h1,h2,h3,h4,a,label,td,th,strong,em,small,button,summary')
        .forEach(function (el, i) {
          var proprio = Array.prototype.filter.call(el.childNodes, function (n) { return n.nodeType === 3; })
            .map(function (n) { return n.textContent.trim(); }).join('').trim();
          if (proprio.length < 2) return;
          var cs = getComputedStyle(el);
          if (cs.visibility === 'hidden' || cs.display === 'none') return;
          var r = el.getBoundingClientRect();
          if (r.width < 4 || r.height < 4) return;

          // Opacidade acumulada: opacity num ancestral apaga o texto
          // junto com o cartão, e é assim que um cinza que passa na
          // tabela de cores reprova na tela.
          var op = 1;
          for (var n = el; n && n !== document.documentElement; n = n.parentElement) {
            op *= parseFloat(getComputedStyle(n).opacity);
          }
          if (op < 0.05) return;

          var px = parseFloat(cs.fontSize);
          var grande = px >= 24 || (px >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
          var min = grande ? 3 : 4.5;

          // Duas rotas, e a diferença é de minutos. Quando o fundo é
          // cor sólida em toda a cadeia — sem gradiente, sem
          // backdrop-filter, sem filter, sem mix-blend-mode e sem
          // opacity em ancestral — a composição analítica dá
          // exatamente o que o navegador vai pintar, e a captura não
          // acrescenta nada: o veredito sai daqui mesmo. Fora dessa
          // condição a conta analítica erra, e aí sim vale o recorte.
          //
          // A rota barata resolve quase tudo: eram ~2.100 capturas nas
          // dezenove páginas, mais de nove minutos.
          var simples = op === 1;
          var camadas = [], n2 = el;
          while (simples && n2 && n2 !== document.documentElement) {
            var cs2 = getComputedStyle(n2);
            // getPropertyValue, não a propriedade camelCase: no Chromium
            // `cs.webkitBackdropFilter` é undefined, e `undefined !== 'none'`
            // mandava TODO elemento para a rota cara. O gate continuava
            // certo, só que cinco vezes mais lento.
            var wk = cs2.getPropertyValue('-webkit-backdrop-filter');
            if (cs2.backgroundImage !== 'none' ||
                cs2.backdropFilter !== 'none' || (wk && wk !== 'none') ||
                cs2.filter !== 'none' || cs2.mixBlendMode !== 'normal') { simples = false; break; }
            var cb = cor(cs2.backgroundColor);
            if (cb[3] > 0) { camadas.push(cb); if (cb[3] === 1) break; }
            n2 = n2.parentElement;
          }
          if (simples && camadas.length) {
            var base = cor(getComputedStyle(document.documentElement).backgroundColor);
            var fundo = base[3] === 1 ? base.slice(0, 3) : [255, 255, 255];
            for (var j = camadas.length - 1; j >= 0; j--) fundo = sobre(camadas[j], fundo);
            var ct = cor(cs.color);
            var v = contraste(sobre(ct, fundo), fundo);
            if (v < min - 0.01) {
              lista.push({ pronto: v.toFixed(2) + ':1 (precisa ' + min + ') ' +
                Math.round(px) + 'px "' + proprio.slice(0, 30) + '"' });
            }
            return;
          }

          el.setAttribute('data-contraste', 'c' + i);
          lista.push({ id: 'c' + i, px: Math.round(px), min: min,
            cor: cs.color, op: op, txt: proprio.slice(0, 30) });
        });
      return lista;
    };
    // O fundo sai da MOLDURA do recorte — as duas primeiras e duas
    // últimas linhas e colunas —, não do quadro inteiro. Num fundo com
    // gradiente cada coluna tem uma cor levemente diferente, então
    // nenhuma cor de fundo se repete muito e a moda do quadro inteiro
    // acaba sendo a cor sólida do próprio texto: contraste 1,00:1 num
    // título branco perfeitamente legível. Na moldura quase nunca há
    // glifo, e num gradiente ela ainda cobre os dois extremos.
    window.__moda = async function (b64) {
      var img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      var c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      var x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(img, 0, 0);
      var d = x.getImageData(0, 0, c.width, c.height).data;
      // A moldura começa 2px para dentro: o retângulo do elemento é
      // arredondado para cima e o recorte pega uma tira de 1px do que
      // está atrás. Num botão de 106x40 essa tira sozinha era a moda —
      // 298 pixels do cartão contra 248 do azul do botão — e um botão
      // azul com texto escuro aparecia como 1,09:1.
      var h = {}, dentro = 2, grossura = 2;
      function por(px, py) {
        if (px < 0 || py < 0 || px >= c.width || py >= c.height) return;
        var i = (py * c.width + px) * 4;
        var k = d[i] + ',' + d[i + 1] + ',' + d[i + 2];
        h[k] = (h[k] || 0) + 1;
      }
      for (var px = dentro; px < c.width - dentro; px++) {
        for (var b1 = 0; b1 < grossura; b1++) {
          por(px, dentro + b1);
          por(px, c.height - 1 - dentro - b1);
        }
      }
      for (var py = dentro; py < c.height - dentro; py++) {
        for (var b2 = 0; b2 < grossura; b2++) {
          por(dentro + b2, py);
          por(c.width - 1 - dentro - b2, py);
        }
      }
      var melhorK = null, melhorN = 0;
      for (var k2 in h) { if (h[k2] > melhorN) { melhorN = h[k2]; melhorK = k2; } }
      return melhorK ? melhorK.split(',').map(Number) : null;
    };
  });

  var lista = await page.evaluate(function () { return window.__marcar(); });

  function canal(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function lum(p) { return 0.2126 * canal(p[0]) + 0.7152 * canal(p[1]) + 0.0722 * canal(p[2]); }

  var fora = [];
  for (var i = 0; i < lista.length; i++) {
    var c = lista[i];
    if (c.pronto) { fora.push(c.pronto); if (fora.length >= 4) break; continue; }
    var el = await page.$('[data-contraste="' + c.id + '"]');
    if (!el) continue;
    var b64;
    try { b64 = (await el.screenshot({ timeout: 5000 })).toString('base64'); }
    catch (e) { continue; }
    var fundo = await page.evaluate(function (b) { return window.__moda(b); }, b64);
    if (!fundo) continue;

    var m = (c.cor.match(/[\d.]+/g) || []).map(Number);
    var alfa = (m.length > 3 ? m[3] : 1) * c.op;
    var texto = [0, 1, 2].map(function (j) {
      return Math.round(m[j] * alfa + fundo[j] * (1 - alfa));
    });

    var L1 = lum(texto), L2 = lum(fundo);
    var razao = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    if (razao < c.min - 0.01) {
      fora.push(razao.toFixed(2) + ':1 (precisa ' + c.min + ') ' + c.px + 'px "' + c.txt + '"');
    }
    if (fora.length >= 4) break;
  }
  return fora;
}


(async function () {
  // CHROMIUM_PATH existe para ambientes que já têm o navegador em outro
  // lugar e não podem baixar o que o Playwright espera. Na CI a variável
  // não é definida e o caminho padrão vale.
  var browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
  );

  var TODAS = PAGINAS.concat(EXTRAS);

  for (var i = 0; i < TODAS.length; i++) {
    var arquivo = TODAS[i];
    var calculadora = i < PAGINAS.length;
    var page = await browser.newPage({ viewport: TELA, locale: 'pt-BR' });

    var erros = [];
    page.on('pageerror', function (e) { erros.push(e.message); });

    await page.goto('file://' + path.join(RAIZ, arquivo));
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
    if (calculadora) {
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
    }

    // Contraste medido nos PIXELS que o navegador pintou, não num modelo
    // de composição escrito à mão. A versão anterior subia a árvore
    // somando backgroundColor: acertava fundo semitransparente e errava
    // gradiente, backdrop-filter e opacity em ancestral — três coisas que
    // esta página usa.
    //
    // Agora o fundo vem da moda dos pixels do recorte do elemento (o
    // gradiente já está pintado ali) e a cor do texto vem do
    // getComputedStyle composta com a opacidade acumulada dos ancestrais.
    // Ler a cor do texto do pixel também seria possível, mas em texto de
    // 12px o antisserrilhado come a haste e o número sai menor do que a
    // WCAG define — a WCAG fala das cores declaradas, não das pintadas.
    //
    // Foi este medidor que achou o `opacity: 0.75` nos cartões travados
    // do painel: selo a 3,55:1 e nota a 3,71:1, com as cores declaradas
    // passando folgado. Quem mais precisava ler aquele cartão era
    // justamente quem ainda não tinha conectado nada.
    var reprovados = await medirContraste(page);

    exigir(reprovados.length === 0,
      arquivo + ': texto abaixo do contraste mínimo da WCAG AA — ' + reprovados.join(' | '));

    if (calculadora) {
      // E o botão precisa calcular de verdade.
      await page.click('#calcular');
      await page.waitForTimeout(600);
      var depois = await page.textContent('#resultado');
      exigir(depois && depois.trim().length > 0, arquivo + ': o botão Calcular não produziu resultado.');
      exigir(erros.length === 0, arquivo + ' quebrou ao calcular: ' + erros.join(' | '));

      // Aí sim a rolagem é bem-vinda: houve clique.
      var aposClique = await page.evaluate(function () { return window.scrollY; });
      exigir(aposClique > 0, arquivo + ': o resultado não foi trazido para a tela após o clique.');
    }

    await page.close();
  }

  await browser.close();

  console.log('\n' + '-'.repeat(52));
  if (problemas.length === 0) {
    console.log(checagens + ' checagens de navegador passaram em ' + TODAS.length + ' páginas.');
    process.exit(0);
  }
  console.error(problemas.length + ' problema(s) no navegador:\n');
  problemas.forEach(function (p) { console.error('  - ' + p); });
  process.exit(1);
})();
