/* ===================================================
   POSTS PARA O INSTAGRAM
   Uso: node marketing/gerar-posts.js
        CHROMIUM_PATH=... node marketing/gerar-posts.js

   Gera os cartões dos carrosséis em marketing/posts/ no
   formato 1080x1350 (4:5, o que mais aparece no feed).

   Todo número vem do nucleo.js, calculado na hora — nada
   é digitado à mão. É o mesmo motor das calculadoras e do
   produto, então um post nunca pode contradizer o site.
   Quando a tabela do INSS mudar em janeiro, basta rodar
   de novo: os posts se corrigem sozinhos, em vez de
   envelhecerem em silêncio numa pasta de imagens.

   Precisa do Playwright: npm install
   =================================================== */

'use strict';

var fs = require('fs');
var path = require('path');
var chromium = require('playwright').chromium;

var F = require('../ferramentas/nucleo.js');
var SAIDA = path.join(__dirname, 'posts');
var SITE = 'kaiohomem.github.io/ferramentas';

var brl = F.brl;
function pct(n) { return F.pct(n, 0); }

/* ---------- OS NÚMEROS ---------- */
var SALARIO = 3000;

var custoNormal = F.custoFuncionario({
  salario: SALARIO, regime: 'normal', rat: 0.02, fap: 1, terceiros: 0.058
});
var custoSimples = F.custoFuncionario({ salario: SALARIO, regime: 'simples' });

var demissao = F.custoDemissao({
  salario: SALARIO, tipo: 'sem-justa-causa', diasTrabalhadosNoMes: 15,
  anosCompletos: 2, mesesPara13: 8, mesesParaFerias: 8, saldoFGTS: 7000,
  regime: 'normal', rat: 0.02, fap: 1, terceiros: 0.058
});

// O erro do 13º: calcular INSS e IRRF sobre a soma do salário com o 13º,
// em vez de duas bases separadas.
var S13 = 6200;
var d13 = F.decimoTerceiro({ salario: S13, meses: 12 });
var mes13 = F.salarioLiquido({ bruto: S13 });
var certo13 = F.round2(d13.totalDescontos + mes13.inss.valor + mes13.irrf.valor);
var inssErr = F.calcularINSS(S13 * 2);
var irrfErr = F.calcularIRRF({ bruto: S13 * 2, inss: inssErr.valor });
var errado13 = F.round2(inssErr.valor + irrfErr.valor);
var perda13 = F.round2(errado13 - certo13);

/* ---------- OS CARROSSÉIS ---------- */
var CARROSSEIS = [
  {
    id: 'custo-funcionario',
    cartoes: [
      { tipo: 'capa', olho: 'contas de patrão',
        titulo: 'Você combinou R$ 3.000 de salário.',
        sub: 'Quanto sai do seu caixa por mês?' },
      { tipo: 'numero', valor: brl(custoNormal.mensal), rotulo: 'por mês, no Lucro Presumido',
        nota: pct(custoNormal.multiplicador - 1) + ' acima do salário combinado' },
      { tipo: 'lista', titulo: 'De onde vem a diferença', itens: [
          ['Salário', brl(SALARIO), ''],
          ['13º (provisão)', brl(custoNormal.provisoes.decimoTerceiro), ''],
          ['Terço de férias (provisão)', brl(custoNormal.provisoes.tercoFerias), ''],
          ['INSS patronal 20%', brl(F.round2(custoNormal.encargos.cpp / 12)), 'neg'],
          ['RAT + terceiros', brl(F.round2((custoNormal.encargos.rat + custoNormal.encargos.terceiros) / 12)), 'neg'],
          ['FGTS 8%', brl(F.round2(custoNormal.fgts.deposito / 12)), 'neg'],
          ['Provisão da multa de 40%', brl(F.round2(custoNormal.fgts.multa / 12)), 'neg']
        ], total: ['Custo real', brl(custoNormal.mensal)] },
      { tipo: 'armadilha', titulo: 'A base não são 12 salários',
        texto: 'São 13,33. Doze meses, mais o 13º, mais o terço de férias. ' +
               'O mês de férias não conta duas vezes: ele substitui um mês que ' +
               'você pagaria de qualquer jeito.' },
      { tipo: 'numero', valor: brl(custoSimples.mensal), rotulo: 'o mesmo salário, no Simples',
        nota: 'anexos I, II, III e V — a parte patronal já está no DAS' },
      { tipo: 'cta', titulo: 'Faça a conta com o seu número',
        texto: 'Calculadora gratuita, sem cadastro.' }
    ]
  },
  {
    id: 'custo-demissao',
    cartoes: [
      { tipo: 'capa', olho: 'antes de decidir',
        titulo: 'Demitir alguém de 2 anos.',
        sub: 'Quanto precisa ter em caixa no dia?' },
      { tipo: 'numero', valor: demissao.emSalarios.toFixed(1).replace('.', ',') + ' salários',
        rotulo: brl(demissao.total) + ' para um salário de ' + brl(SALARIO),
        nota: 'o termo de rescisão mostra ' + brl(demissao.aoTrabalhador) },
      { tipo: 'lista', titulo: 'O que sai do caixa', itens: [
          ['Saldo de salário', brl(demissao.rescisao.proventos.saldoSalario), ''],
          ['Aviso prévio indenizado', brl(demissao.rescisao.proventos.avisoPrevioIndenizado), ''],
          ['13º proporcional', brl(demissao.rescisao.proventos.decimoTerceiroProporcional), ''],
          ['Férias proporcionais + 1/3', brl(F.round2(demissao.rescisao.proventos.feriasProporcionais + demissao.rescisao.proventos.tercoFeriasProporcionais)), ''],
          ['Multa de 40% do FGTS', brl(demissao.multaFGTS), 'neg'],
          ['INSS patronal', brl(demissao.encargos.inssPatronal), 'neg'],
          ['FGTS sobre as verbas', brl(demissao.encargos.fgtsSobreVerbas), 'neg']
        ], total: ['Total', brl(demissao.total)] },
      { tipo: 'armadilha', titulo: 'A multa de 40% é o maior item',
        texto: 'Ela incide sobre tudo que foi depositado de FGTS naquele contrato. ' +
               'Cresce com o tempo de casa, não com o salário — demitir alguém de ' +
               'oito anos custa muito mais que dois de quatro.' },
      { tipo: 'armadilha', titulo: 'O aviso indenizado engana',
        texto: 'Ele paga FGTS (Súmula 305 do TST) mas NÃO paga INSS patronal ' +
               '(STJ, Tema 478). As duas coisas convivem, e é por isso que ' +
               'quase todo mundo erra essa conta — para os dois lados.' },
      { tipo: 'cta', titulo: 'Simule antes de comunicar',
        texto: 'Calculadora gratuita, sem cadastro.' }
    ]
  },
  {
    id: 'erro-13',
    cartoes: [
      { tipo: 'capa', olho: 'dezembro',
        titulo: 'O erro de 13º que o funcionário nunca percebe.',
        sub: 'E que sai do bolso dele.' },
      { tipo: 'armadilha', titulo: 'O 13º não se soma ao salário do mês',
        texto: 'INSS e IRRF do 13º saem de uma base própria. Quem joga tudo numa ' +
               'base só empurra o funcionário para uma faixa em que ele não está.' },
      { tipo: 'comparacao', titulo: 'Salário de ' + brl(S13) + ', dezembro',
        certo: { rotulo: 'Duas bases separadas', valor: brl(certo13) },
        errado: { rotulo: 'Tudo numa base só', valor: brl(errado13) },
        nota: brl(perda13) + ' descontados a mais do funcionário' },
      { tipo: 'lista', titulo: 'Como o 13º é pago', itens: [
          ['1ª parcela — até 30/11', brl(d13.primeiraParcela), ''],
          ['metade do bruto, sem desconto nenhum', '', 'nota'],
          ['2ª parcela — até 20/12', brl(d13.segundaParcela), ''],
          ['a conta inteira cai aqui', '', 'nota']
        ], total: ['Líquido do 13º', brl(d13.liquido)] },
      { tipo: 'cta', titulo: 'Confira o 13º da sua equipe',
        texto: 'Calculadora gratuita, sem cadastro.' }
    ]
  }
];

/* ---------- AS LEGENDAS ---------- */
/* Geradas aqui pelo mesmo motivo das imagens: legenda com número
   digitado à mão envelhece na virada do ano e ninguém percebe. */
var LEGENDAS = {
  'custo-funcionario':
    'Quanto custa, de verdade, um funcionário de ' + brl(SALARIO) + '?\n\n' +
    'No Lucro Presumido: ' + brl(custoNormal.mensal) + ' por mês. ' +
    pct(custoNormal.multiplicador - 1) + ' acima do salário combinado.\n' +
    'No Simples (anexos I, II, III e V): ' + brl(custoSimples.mensal) + '.\n\n' +
    'A diferença é o INSS patronal e as contribuições a terceiros, que no ' +
    'Simples já estão dentro do DAS.\n\n' +
    'E tem uma parte que quase todo mundo erra: a base de encargos não são ' +
    'doze salários, são 13,33. Doze meses, mais o 13º, mais o terço de férias. ' +
    'O mês de férias não conta duas vezes — ele substitui um mês que você ' +
    'pagaria de qualquer jeito.\n\n' +
    'Calculadora gratuita, sem cadastro, no link da bio.\n\n' +
    '#folhadepagamento #departamentopessoal #simplesnacional #rh #contabilidade ' +
    '#pequenoempresario #empreendedorismo #clt',

  'custo-demissao':
    'Demitir alguém com 2 anos de casa custa ' +
    demissao.emSalarios.toFixed(1).replace('.', ',') + ' salários.\n\n' +
    'Num salário de ' + brl(SALARIO) + ', são ' + brl(demissao.total) +
    ' saindo do caixa. O termo de rescisão mostra ' + brl(demissao.aoTrabalhador) +
    ' — o resto são encargos que só a empresa vê.\n\n' +
    'O maior item é a multa de 40% do FGTS: ' + brl(demissao.multaFGTS) + '. ' +
    'Ela incide sobre tudo que foi depositado naquele contrato, então cresce ' +
    'com o tempo de casa, não com o salário.\n\n' +
    'E o detalhe que engana quase todo mundo: o aviso prévio indenizado paga ' +
    'FGTS (Súmula 305 do TST) mas NÃO paga INSS patronal (STJ, Tema 478). ' +
    'As duas coisas convivem.\n\n' +
    'Simule antes de comunicar a decisão. Link na bio.\n\n' +
    '#rescisao #departamentopessoal #fgts #direitotrabalhista #rh ' +
    '#pequenoempresario #contabilidade #clt',

  'erro-13':
    'O erro de 13º que o funcionário nunca percebe — e que sai do bolso dele.\n\n' +
    'O 13º não se soma ao salário do mês. INSS e IRRF saem de uma base própria.\n\n' +
    'Num salário de ' + brl(S13) + ', em dezembro:\n' +
    'Duas bases separadas, como manda a regra: ' + brl(certo13) + ' de desconto.\n' +
    'Tudo numa base só: ' + brl(errado13) + '.\n\n' +
    'Diferença: ' + brl(perda13) + ' descontados a mais de uma pessoa só.\n\n' +
    'A primeira parcela é metade do bruto, sem desconto nenhum, até 30/11. ' +
    'A conta inteira cai na segunda, até 20/12 — por isso ela sempre vem menor.\n\n' +
    'Confira o 13º da sua equipe no link da bio.\n\n' +
    '#13salario #decimoterceiro #folhadepagamento #departamentopessoal #rh ' +
    '#contabilidade #pequenoempresario #clt'
};

var PERFIL =
  '# Perfil\n\n' +
  '**Nome:** Folha Simples\n' +
  '**Usuário sugerido:** @folhasimples\n' +
  '**Categoria:** Software\n\n' +
  '**Bio:**\n' +
  '```\n' +
  'Folha de pagamento sem planilha.\n' +
  'Contas de patrão, com as tabelas de 2026.\n' +
  'Calculadoras gratuitas ↓\n' +
  '```\n\n' +
  '**Link:** https://' + SITE + '\n\n' +
  '---\n\n' +
  '# Como usar isto\n\n' +
  'Um carrossel por semana basta. Publicar os três de uma vez gasta em três ' +
  'dias um conteúdo que renderia um mês, e um perfil novo que posta três vezes ' +
  'no primeiro dia parece automação — que é justamente o que o algoritmo pune.\n\n' +
  'Ordem sugerida: custo de funcionário, depois erro do 13º, depois custo de ' +
  'demissão. O primeiro é o mais amplo; o de demissão é o mais pesado e ' +
  'funciona melhor quando o perfil já tem alguma audiência.\n\n' +
  'Todo número aqui foi calculado pelo mesmo motor das calculadoras do site. ' +
  'Se alguém contestar nos comentários, a conta se defende — e o link leva ' +
  'para a ferramenta onde a pessoa refaz com os números dela.\n\n' +
  '# Para atualizar\n\n' +
  'Quando as tabelas fiscais mudarem, rode `node marketing/gerar-posts.js` de ' +
  'novo. As imagens e as legendas se corrigem sozinhas, porque nenhum número ' +
  'aqui é digitado à mão.\n';

/* ---------- O DESENHO ---------- */
var CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{background:#010409;font-family:Inter,system-ui,sans-serif}
.cartao{width:1080px;height:1350px;background:#0d1117;color:#e6edf3;
  padding:90px 80px;display:flex;flex-direction:column;position:relative;overflow:hidden}
.cartao::after{content:'';position:absolute;left:0;right:0;top:0;height:8px;
  background:linear-gradient(90deg,#58a6ff,#3fb950)}
.olho{font-family:'JetBrains Mono',monospace;font-size:26px;letter-spacing:.18em;
  text-transform:uppercase;color:#58a6ff;margin-bottom:40px}
h1{font-size:82px;line-height:1.12;font-weight:700;letter-spacing:-.02em}
h2{font-size:60px;line-height:1.15;font-weight:700;margin-bottom:44px;letter-spacing:-.02em}
.sub{font-size:46px;line-height:1.35;color:#8b949e;margin-top:36px;font-weight:300}
.meio{flex:1;display:flex;flex-direction:column;justify-content:center}
.gigante{font-family:'JetBrains Mono',monospace;font-size:132px;font-weight:700;
  color:#3fb950;line-height:1;letter-spacing:-.03em}
.rotulo{font-size:44px;color:#e6edf3;margin-top:34px;line-height:1.3}
.nota{font-size:34px;color:#8b949e;margin-top:26px;line-height:1.4}
.linha{display:flex;justify-content:space-between;align-items:baseline;gap:24px;
  padding:26px 0;border-bottom:1px solid #21262d}
.linha .r{font-size:36px;color:#c9d1d9}
.linha .v{font-family:'JetBrains Mono',monospace;font-size:38px;font-weight:500}
.linha.neg .v{color:#ff7b72}
.linha.nota{border:none;padding:0 0 14px}
.linha.nota .r{font-size:28px;color:#6e7681;font-style:italic}
.linha.total{border-bottom:none;border-top:2px solid #30363d;margin-top:14px;padding-top:30px}
.linha.total .r{font-size:42px;font-weight:700;color:#fff}
.linha.total .v{font-size:48px;font-weight:700;color:#3fb950}
.caixa{background:#161b22;border-left:6px solid #d29922;border-radius:14px;padding:48px}
.caixa p{font-size:42px;line-height:1.45;color:#c9d1d9}
/* Empilhados, não lado a lado: em 920px úteis, dois números de seis
   dígitos em monoespaçada não cabem na mesma linha — o segundo vazava a
   margem. Empilhar também lê melhor no celular, que é onde isto é visto. */
.par{display:flex;flex-direction:column;gap:26px;margin-top:20px}
.lado{background:#161b22;border-radius:14px;padding:40px 44px;border-left:6px solid #3fb950;
  display:flex;align-items:baseline;justify-content:space-between;gap:24px}
.lado.mau{border-left-color:#ff7b72}
.lado .l{font-size:34px;color:#8b949e;line-height:1.3}
.lado .n{font-family:'JetBrains Mono',monospace;font-size:56px;font-weight:700;color:#3fb950;
  white-space:nowrap}
.lado.mau .n{color:#ff7b72}
.destaque-nota{font-size:40px;color:#ff7b72;margin-top:34px;line-height:1.4;font-weight:500}
.rodape{display:flex;justify-content:space-between;align-items:center;
  font-family:'JetBrains Mono',monospace;font-size:30px;color:#6e7681;
  border-top:1px solid #21262d;padding-top:34px;margin-top:56px}
.marca{color:#e6edf3;font-weight:700}
.marca span{color:#58a6ff}
.cta-caixa{background:linear-gradient(135deg,rgba(63,185,80,.16),transparent);
  border:2px solid rgba(63,185,80,.4);border-radius:20px;padding:56px;text-align:center}
.cta-caixa .u{font-family:'JetBrains Mono',monospace;font-size:40px;color:#3fb950;margin-top:32px}
`;

function cartaoHtml(c, idx, total) {
  var corpo = '';

  if (c.tipo === 'capa') {
    corpo = '<div class="olho">' + c.olho + '</div>' +
            '<div class="meio"><h1>' + c.titulo + '</h1>' +
            '<p class="sub">' + c.sub + '</p></div>';
  } else if (c.tipo === 'numero') {
    corpo = '<div class="meio">' +
            '<div class="gigante">' + c.valor + '</div>' +
            '<div class="rotulo">' + c.rotulo + '</div>' +
            '<div class="nota">' + c.nota + '</div></div>';
  } else if (c.tipo === 'lista') {
    corpo = '<h2>' + c.titulo + '</h2><div class="meio"><div>' +
      c.itens.map(function (i) {
        return '<div class="linha ' + i[2] + '"><span class="r">' + i[0] +
               '</span><span class="v">' + i[1] + '</span></div>';
      }).join('') +
      '<div class="linha total"><span class="r">' + c.total[0] +
      '</span><span class="v">' + c.total[1] + '</span></div>' +
      '</div></div>';
  } else if (c.tipo === 'armadilha') {
    corpo = '<h2>' + c.titulo + '</h2>' +
            '<div class="meio"><div class="caixa"><p>' + c.texto + '</p></div></div>';
  } else if (c.tipo === 'comparacao') {
    corpo = '<h2>' + c.titulo + '</h2><div class="meio">' +
            '<div class="par">' +
            '<div class="lado"><span class="l">' + c.certo.rotulo + '</span><span class="n">' + c.certo.valor + '</span></div>' +
            '<div class="lado mau"><span class="l">' + c.errado.rotulo + '</span><span class="n">' + c.errado.valor + '</span></div>' +
            '</div><div class="destaque-nota">' + c.nota + '</div></div>';
  } else if (c.tipo === 'cta') {
    corpo = '<div class="meio"><div class="cta-caixa">' +
            '<h2 style="margin:0">' + c.titulo + '</h2>' +
            '<p class="nota" style="margin-top:24px">' + c.texto + '</p>' +
            '<div class="u">' + SITE + '</div></div></div>';
  }

  return '<div class="cartao">' + corpo +
         '<div class="rodape"><span class="marca">folha<span>simples</span></span>' +
         '<span>' + (idx + 1) + '/' + total + '</span></div></div>';
}

/* ---------- GERAÇÃO ---------- */
(async function () {
  if (!fs.existsSync(SAIDA)) fs.mkdirSync(SAIDA, { recursive: true });

  var opcoes = { args: ['--lang=pt-BR'] };
  if (process.env.CHROMIUM_PATH) opcoes.executablePath = process.env.CHROMIUM_PATH;
  var browser = await chromium.launch(opcoes);
  var page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, locale: 'pt-BR' });

  var gerados = 0;

  for (var i = 0; i < CARROSSEIS.length; i++) {
    var carrossel = CARROSSEIS[i];
    var html = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">' +
      '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&' +
      'family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">' +
      '<style>' + CSS + '</style></head><body>' +
      carrossel.cartoes.map(function (c, j) {
        return cartaoHtml(c, j, carrossel.cartoes.length);
      }).join('') +
      '</body></html>';

    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    var cartoes = page.locator('.cartao');
    var n = await cartoes.count();
    for (var j = 0; j < n; j++) {
      var nome = carrossel.id + '-' + String(j + 1).padStart(2, '0') + '.png';
      await cartoes.nth(j).screenshot({ path: path.join(SAIDA, nome) });
      gerados++;
    }
    console.log(carrossel.id + ': ' + n + ' cartões');
  }

  await browser.close();

  var md = PERFIL + '\n---\n\n# Legendas\n\n' +
    CARROSSEIS.map(function (c) {
      return '## ' + c.id + ' (' + c.cartoes.length + ' cartões)\n\n' +
             '```\n' + LEGENDAS[c.id] + '\n```\n';
    }).join('\n');

  fs.writeFileSync(path.join(__dirname, 'instagram.md'), md, 'utf8');

  console.log('\n' + gerados + ' cartões em marketing/posts/');
  console.log('marketing/instagram.md com perfil e legendas.');
  console.log('Todo número saiu do nucleo.js na hora da geração.');
})();
