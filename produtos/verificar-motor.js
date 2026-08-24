/* ===================================================
   PORTÃO — o motor do produto vs. o motor testado

   folha-simples-fc86aa480de7f81c.html precisa ser um arquivo único que
   roda offline, então ele carrega uma cópia das tabelas
   fiscais em vez de importar nucleo.js.

   Duplicação silenciosa é a forma mais fácil de vender
   um produto que calcula errado: alguém atualiza a
   tabela do IRRF em janeiro num lugar e esquece o outro,
   e ninguém percebe até o cliente reclamar.

   Este script compara os dois motores salário a salário
   e falha se divergirem em um único centavo.

   Rodar: node produtos/verificar-motor.js
   =================================================== */

'use strict';

var fs = require('fs');
var path = require('path');

var RAIZ = path.join(__dirname, '..');
var html = fs.readFileSync(path.join(__dirname, 'folha-simples-fc86aa480de7f81c.html'), 'utf8');

var ini = html.indexOf('var TABELAS = {');
var fim = html.indexOf('/* ---------- FORMATO E ENTRADA ---------- */');

if (ini === -1 || fim === -1 || fim < ini) {
  console.error('Não encontrei o bloco do motor fiscal em folha-simples-fc86aa480de7f81c.html.');
  console.error('Se o arquivo foi reestruturado, ajuste os marcadores aqui.');
  process.exit(1);
}

var embutido = {};
new Function('exports', html.slice(ini, fim) +
  '\nexports.calcINSS=calcINSS;exports.calcIRRF=calcIRRF;exports.folhaDe=folhaDe;' +
  'exports.decimoTerceiroDe=decimoTerceiroDe;exports.feriasDe=feriasDe;'
)(embutido);

// O build completo carrega o mesmo motor mais o módulo de rescisão. Ele
// é gerado a partir do base, então o que vale conferir aqui é só o que
// o módulo acrescenta — o resto já foi comparado acima, no base.
var htmlCompleto = fs.readFileSync(
  path.join(__dirname, 'folha-simples-completo-fc86aa480de7f81c.html'), 'utf8');

var iniC = htmlCompleto.indexOf('var TABELAS = {');
var fimC = htmlCompleto.indexOf('/* ---------- FORMATO E ENTRADA ---------- */');
if (iniC === -1 || fimC === -1 || fimC < iniC) {
  console.error('Não encontrei o bloco do motor no build completo.');
  console.error('Rode: node produtos/gerar-completo.js');
  process.exit(1);
}

var completo = {};
new Function('exports', htmlCompleto.slice(iniC, fimC) +
  '\nexports.rescisaoDe=rescisaoDe;exports.custoDemissaoDe=custoDemissaoDe;'
)(completo);

var nucleo = require(path.join(RAIZ, 'ferramentas', 'nucleo.js'));

var divergencias = [];
var comparados = 0;

// Varre a faixa inteira que importa para folha, de meio salário mínimo
// até bem acima do teto do INSS, com e sem dependentes.
for (var sal = 500; sal <= 25000; sal += 37) {
  [0, 2].forEach(function (dep) {
    comparados++;
    var a = embutido.folhaDe({ salario: sal, dependentes: dep, vt: 0, outros: 0 });
    var b = nucleo.salarioLiquido({ bruto: sal, dependentes: dep });

    [['INSS', a.inss, b.inss.valor],
     ['IRRF', a.irrf.valor, b.irrf.valor],
     ['líquido', a.liquido, b.liquido],
     ['FGTS', a.fgts, b.fgtsMensal]
    ].forEach(function (c) {
      if (Math.abs(c[1] - c[2]) > 0.001) {
        divergencias.push(c[0] + ' em R$' + sal + ' com ' + dep + ' dep: ' +
                          'produto=' + c[1] + ' nucleo=' + c[2]);
      }
    });
  });
}

// O 13º tem base tributável própria, e a chance de as duas cópias
// divergirem aqui é maior que na folha mensal: são menos linhas, menos
// olhos e um caminho que só é exercitado em novembro e dezembro.
var comparados13 = 0;
for (var s13 = 500; s13 <= 25000; s13 += 137) {
  [3, 7, 12].forEach(function (meses) {
    [0, 2].forEach(function (dep) {
      comparados13++;
      var a = embutido.decimoTerceiroDe({ salario: s13, meses: meses, dependentes: dep });
      var b = nucleo.decimoTerceiro({ salario: s13, meses: meses, dependentes: dep });

      [['13º bruto', a.bruto, b.bruto],
       ['13º INSS', a.inss, b.inss.valor],
       ['13º IRRF', a.irrf.valor, b.irrf.valor],
       ['13º líquido', a.liquido, b.liquido],
       ['13º 1ª parcela', a.primeira, b.primeiraParcela],
       ['13º 2ª parcela', a.segunda, b.segundaParcela],
       ['13º FGTS', a.fgts, b.fgts]
      ].forEach(function (c) {
        if (Math.abs(c[1] - c[2]) > 0.001) {
          divergencias.push(c[0] + ' em R$' + s13 + ', ' + meses + ' meses, ' + dep +
                            ' dep: produto=' + c[1] + ' nucleo=' + c[2]);
        }
      });
    });
  });
}

// Férias: o abono pecuniário não é tributado e o terço dele também não.
// Se alguém puser o abono na base do INSS, é aqui que aparece.
var comparadosFer = 0;
for (var sf = 500; sf <= 25000; sf += 173) {
  [[30, 0], [30, 10], [20, 6], [15, 5], [10, 0]].forEach(function (d) {
    [0, 2].forEach(function (dep) {
      comparadosFer++;
      var a = embutido.feriasDe({ salario: sf, dias: d[0], diasVendidos: d[1], dependentes: dep });
      var b = nucleo.ferias({ salario: sf, dias: d[0], diasVendidos: d[1], dependentes: dep });

      [['férias base', a.base, b.baseTributavel],
       ['férias INSS', a.inss, b.inss.valor],
       ['férias IRRF', a.irrf.valor, b.irrf.valor],
       ['férias abono', a.totalAbono, b.totalAbono],
       ['férias líquido', a.liquido, b.liquido]
      ].forEach(function (c) {
        if (Math.abs(c[1] - c[2]) > 0.001) {
          divergencias.push(c[0] + ' em R$' + sf + ', ' + d[0] + ' dias, ' + d[1] +
                            ' vendidos, ' + dep + ' dep: produto=' + c[1] + ' nucleo=' + c[2]);
        }
      });

      // O FGTS não vem do nucleo (ele não modela a parte do empregador
      // nas férias), então aqui a checagem é contra a regra: 8% sobre as
      // férias gozadas e o terço, nunca sobre o abono.
      if (Math.abs(a.fgts - Math.round(a.base * 8) / 100) > 0.011) {
        divergencias.push('férias FGTS em R$' + sf + ': ' + a.fgts + ' não é 8% de ' + a.base);
      }
    });
  });
}

// ---------- RESCISÃO (só existe no build completo) ----------
//
// Cinco tipos de desligamento, e a diferença entre eles não é de grau: é
// de quais verbas existem. Justa causa apaga 13º e férias proporcionais;
// pedido de demissão pode DESCONTAR trinta dias; acordo paga metade do
// aviso e 20% de multa. Um tipo mal portado passa despercebido na
// leitura e aparece no bolso de alguém.
var comparadosResc = 0;
var TIPOS = ['sem-justa-causa', 'pedido-demissao', 'acordo', 'fim-contrato', 'justa-causa'];

// Anos de casa: 0 e 5 não exercitam nada. O aviso é 30 dias mais 3 por
// ano completo com teto de 90, então só a partir de 20 anos o teto
// existe — abaixo disso dá para trocar o 90 por 120 sem ninguém notar.
// Foi o que aconteceu quando testei ao contrário.
var ANOS = [0, 5, 20, 30];

// Regimes: no Simples não há CPP nem terceiros, e é o caso da maioria
// dos compradores. Comparar só um regime deixaria os outros dois sem
// nenhuma cobertura.
var REGIMES = ['simples', 'simplesIV', 'normal'];

// Comparar com NaN é o jeito silencioso de não comparar nada:
// `Math.abs(undefined - undefined) > 0.011` é false, e o gate passa
// verde sem ter olhado para nada. Foi exatamente assim que uma versão
// errada do custo de demissão sobreviveu ao primeiro teste ao contrário.
function conferir(rotulo, onde, produto, motor) {
  if (!isFinite(produto) || !isFinite(motor)) {
    divergencias.push(rotulo + ' em ' + onde + ': valor não numérico — ' +
      'produto ' + produto + ', motor ' + motor +
      ' (comparação com NaN passa despercebida; isto é um defeito do gate ou do porte)');
    return;
  }
  if (Math.abs(produto - motor) > 0.011) {
    divergencias.push(rotulo + ' em ' + onde + ': produto ' + produto + ', motor ' + motor);
  }
}

for (var salR = 1621; salR <= 12000; salR += 421) {
  TIPOS.forEach(function (tipo) {
    [0, 2].forEach(function (dep) {
      ANOS.forEach(function (anos) {
        [false, true].forEach(function (vencidas) {
          REGIMES.forEach(function (regime) {
            comparadosResc++;
            var entrada = {
              salario: salR, tipo: tipo, dependentes: dep,
              diasTrabalhadosNoMes: 17, anosCompletos: anos,
              mesesPara13: 7, mesesParaFerias: 7,
              feriasVencidas: vencidas, saldoFGTS: salR * 2,
              avisoCumprido: false, regime: regime
            };
            var a = completo.rescisaoDe(entrada);
            var b = nucleo.rescisao(entrada);
            var onde = tipo + '/' + regime + ' R$' + salR + ' dep' + dep +
                       ' anos' + anos + (vencidas ? ' venc' : '');

            conferir('rescisão líquido', onde, a.liquido, b.liquido);
            conferir('rescisão proventos', onde, a.totalProventos, b.totalProventos);
            conferir('rescisão descontos', onde, a.totalDescontos, b.totalDescontos);
            conferir('rescisão dias de aviso', onde, a.diasAviso, b.diasAviso);
            conferir('rescisão FGTS sacável', onde, a.fgtsSacavel, b.fgtsSacavel);

            Object.keys(b.proventos).forEach(function (k) {
              conferir('provento ' + k, onde, a.proventos[k], b.proventos[k]);
            });
            Object.keys(b.descontos).forEach(function (k) {
              conferir('desconto ' + k, onde, a.descontos[k], b.descontos[k]);
            });

            if (a.temSeguroDesemprego !== b.temSeguroDesemprego) {
              divergencias.push('rescisão seguro-desemprego em ' + onde + ': produto ' +
                a.temSeguroDesemprego + ', motor ' + b.temSeguroDesemprego);
            }

            // O custo do empregador: o que sai da conta, não o que o
            // funcionário recebe. É onde mora a diferença entre líquido
            // e proventos, e onde o regime decide se há CPP.
            var ca = completo.custoDemissaoDe(entrada);
            var cb = nucleo.custoDemissao(entrada);

            conferir('custo total', onde, ca.total, cb.total);
            conferir('custo ao trabalhador', onde, ca.aoTrabalhador, cb.aoTrabalhador);
            conferir('custo retido do trabalhador', onde, ca.retidoDoTrabalhador, cb.retidoDoTrabalhador);
            conferir('custo multa do FGTS', onde, ca.multaFGTS, cb.multaFGTS);
            conferir('custo em salários', onde, ca.emSalarios, cb.emSalarios);
            Object.keys(cb.encargos).forEach(function (k) {
              conferir('encargo ' + k, onde, ca.encargos[k], cb.encargos[k]);
            });
            if (ca.regime !== cb.regime) {
              divergencias.push('regime em ' + onde + ': produto ' + ca.regime + ', motor ' + cb.regime);
            }
          });
        });
      });
    });
  });
}

// Âncoras absolutas, para o caso de os DOIS motores estarem errados juntos.
var ancoras = [
  ['líquido de R$ 5.000', embutido.folhaDe({ salario: 5000, dependentes: 0 }).liquido, 4498.49],
  ['teto do INSS', embutido.calcINSS(8475.55), 988.09],
  ['INSS no salário mínimo', embutido.calcINSS(1621.00), 121.58]
];

ancoras.forEach(function (a) {
  if (Math.abs(a[1] - a[2]) > 0.001) {
    divergencias.push('âncora "' + a[0] + '": ' + a[1] + ', esperado ' + a[2]);
  }
});

console.log(comparados + ' salários comparados entre o produto e o motor testado.');
console.log(comparados13 + ' cenários de 13º comparados.');
console.log(comparadosFer + ' cenários de férias comparados.');
console.log(comparadosResc + ' cenários de rescisão comparados (5 tipos × 3 regimes × 4 tempos de casa).');
console.log(ancoras.length + ' âncoras absolutas verificadas.');

if (!divergencias.length) {
  console.log('\nOs dois motores são idênticos.');
  process.exit(0);
}

console.error('\n' + divergencias.length + ' DIVERGÊNCIA(S) — o produto calcularia errado:\n');
divergencias.slice(0, 10).forEach(function (d) { console.error('  - ' + d); });
if (divergencias.length > 10) console.error('  ... e mais ' + (divergencias.length - 10));
console.error('\nAtualize as TABELAS em produtos/folha-simples-fc86aa480de7f81c.html para bater com ferramentas/nucleo.js.');
process.exit(1);
