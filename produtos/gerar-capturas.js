/* ===================================================
   CAPTURAS DA TELA DO PRODUTO
   Uso: npm i playwright && node produtos/gerar-capturas.js

   Não roda na CI e o Playwright não é dependência do
   repositório: isto é uma ferramenta de bancada, usada
   quando a interface do produto muda e as imagens da
   página de venda ficam desatualizadas.

   Gera PNG. Converta para WebP antes de publicar — o PNG
   sai com ~400KB e a página de venda não deve carregar
   isso em quem está no 4G.
   =================================================== */

'use strict';

var path = require('path');
var chromium = require('playwright').chromium;

var RAIZ = path.join(__dirname, '..');
var PROD = 'file://' + path.join(RAIZ, 'produtos/folha-simples-fc86aa480de7f81c.html');
var SAIDA = path.join(RAIZ, 'produtos');

// Empresa e pessoas fictícias. A captura vira documento público, e usar
// folha real numa imagem de um produto cujo argumento é que o salário não
// sai do computador seria indefensável.
var EQUIPE = [
  { nome: 'Ana Beatriz Souza', cargo: 'Vendedora',       salario: '2.400,00', dep: '1', vt: '132,00', outros: '0,00'   },
  { nome: 'Carlos Menezes',    cargo: 'Estoquista',      salario: '1.980,00', dep: '0', vt: '110,00', outros: '0,00'   },
  { nome: 'Juliana Prado',     cargo: 'Gerente de loja', salario: '6.200,00', dep: '2', vt: '0,00',   outros: '250,00' },
  { nome: 'Rafael Lima',       cargo: 'Auxiliar admin.', salario: '2.100,00', dep: '0', vt: '118,00', outros: '0,00'   }
];

(async function () {
  // O idioma dos widgets nativos (<input type="month">) vem do LANG do
  // processo, não do `locale` do contexto. Sem isto a captura sai com
  // "August 2026" numa tela de um produto em português.
  // CHROMIUM_PATH, igual ao verificar-paginas.js: ambientes que já têm o
  // navegador em outro lugar e não podem baixar o que o Playwright espera.
  var opcoes = {
    args: ['--lang=pt-BR', '--accept-lang=pt-BR'],
    env: Object.assign({}, process.env, { LANG: 'pt_BR.UTF-8', LANGUAGE: 'pt_BR' })
  };
  if (process.env.CHROMIUM_PATH) opcoes.executablePath = process.env.CHROMIUM_PATH;
  var browser = await chromium.launch(opcoes);

  var page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo'
  });

  await page.goto(PROD);
  await page.fill('#empNome', 'Mercearia Bom Preço LTDA');
  await page.fill('#empCnpj', '12.345.678/0001-90');
  await page.fill('#competencia', '2026-08');

  for (var i = 0; i < EQUIPE.length; i++) {
    var f = EQUIPE[i];
    await page.fill('#fNome', f.nome);
    await page.fill('#fCargo', f.cargo);
    await page.fill('#fSalario', f.salario);
    await page.fill('#fDep', f.dep);
    await page.fill('#fVt', f.vt);
    await page.fill('#fOutros', f.outros);
    await page.click('#btAdd');
  }
  await page.waitForTimeout(400);

  console.log('resumo:', (await page.textContent('#resumo')).replace(/\s+/g, ' ').trim());
  await page.locator('main').screenshot({ path: path.join(SAIDA, 'tela-folha.png') });

  // O herói da página de venda: os quatro números do resumo e as
  // primeiras linhas da tabela, que é o que responde "o que este
  // programa faz" numa olhada. O recorte é ancorado nos elementos, não
  // num número mágico — quando o produto muda de altura, o corte
  // acompanha em vez de virar a tela vazia do formulário.
  var caixa = await page.evaluate(function () {
    var r = document.querySelector('#resumo').getBoundingClientRect();
    return { x: 0, y: r.top + window.scrollY - 12, largura: document.body.clientWidth };
  });
  await page.screenshot({
    path: path.join(SAIDA, 'tela-heroi.png'),
    clip: { x: caixa.x, y: caixa.y, width: caixa.largura,
            height: Math.round(caixa.largura / 2.13) },
    fullPage: true
  });

  // O 13º é o argumento que a página de venda passou a fazer, então
  // precisa de imagem própria: dizer que calcula e não mostrar é o mesmo
  // problema que a página tinha antes de ter qualquer captura.
  await page.selectOption('#modo', 'decimo');
  await page.waitForTimeout(400);
  console.log('13º:', (await page.textContent('#resumo')).replace(/\s+/g, ' ').trim());
  await page.locator('main').screenshot({ path: path.join(SAIDA, 'tela-decimo.png') });
  await page.selectOption('#modo', 'mensal');
  await page.waitForTimeout(300);

  // Os holerites só existem no DOM na hora de imprimir, e o CSS de
  // impressão esconde o resto da página.
  await page.click('#btImprimir');
  await page.waitForTimeout(300);
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(200);

  // Um holerite legível vende melhor que quatro miniaturas. O da Juliana
  // é o único com IRRF e "outros descontos" preenchidos, então mostra as
  // duas colunas de verdade.
  var holerite = page.locator('#holerite .hol').nth(2);
  (await holerite.locator('tbody tr').allTextContents())
    .forEach(function (l) { console.log('   ', l.replace(/\s+/g, ' ').trim()); });

  await holerite.screenshot({ path: path.join(SAIDA, 'tela-holerite.png') });
  await browser.close();
})();
