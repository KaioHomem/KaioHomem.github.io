/* ===================================================
   FERRAMENTAS BR — TEST SUITE
   Run: node ferramentas/testes.js
   Exit code 1 on any failure (used as a CI gate).

   These assertions pin the fiscal maths to independently
   verifiable reference points. If a table is edited and a
   reference no longer holds, CI fails loudly instead of
   silently shipping wrong numbers to users.
   =================================================== */

'use strict';

var F = require('./nucleo.js');

var falhas = 0;
var total = 0;

function eq(descricao, obtido, esperado, tolerancia) {
  total++;
  var tol = tolerancia === undefined ? 0.01 : tolerancia;
  var ok = Math.abs(obtido - esperado) <= tol;
  if (!ok) {
    falhas++;
    console.error('  FALHOU  ' + descricao);
    console.error('          esperado: ' + esperado + '   obtido: ' + obtido);
  } else {
    console.log('  ok      ' + descricao);
  }
}

function verdadeiro(descricao, valor) {
  total++;
  if (!valor) {
    falhas++;
    console.error('  FALHOU  ' + descricao);
  } else {
    console.log('  ok      ' + descricao);
  }
}

console.log('\nTABELAS ' + F.TABELAS.ano + ' (atualizado em ' + F.TABELAS.atualizadoEm + ')\n');

/* ---------- INSS ---------- */
console.log('INSS');

// The four brackets summed at the ceiling must reproduce the published
// maximum contribution of R$ 988,09.
eq('teto do INSS desconta R$ 988,09', F.calcularINSS(8475.55).valor, 988.09);
eq('acima do teto não aumenta o desconto', F.calcularINSS(50000).valor, 988.09);
eq('salário mínimo (1.621,00) → 7,5%', F.calcularINSS(1621.00).valor, 121.58);
eq('R$ 3.000 → progressivo', F.calcularINSS(3000).valor, 248.60);
eq('R$ 5.000 → progressivo', F.calcularINSS(5000).valor, 501.51);
eq('salário zero → sem desconto', F.calcularINSS(0).valor, 0);
verdadeiro('marca quando bate o teto', F.calcularINSS(9000).teto === true);

// Bracket continuity: the contribution must be monotonic, never jumping.
(function () {
  var anterior = -1;
  var monotonico = true;
  for (var s = 0; s <= 9000; s += 25) {
    var v = F.calcularINSS(s).valor;
    if (v < anterior - 0.001) monotonico = false;
    anterior = v;
  }
  verdadeiro('INSS é monotônico (sem degraus que puniriam aumento)', monotonico);
})();

/* ---------- IRRF ---------- */
console.log('\nIRRF');

// The 2026 reform: exempt up to R$ 5.000, phasing out at R$ 7.350.
eq('redutor zera exatamente em R$ 7.350', F.calcularRedutor(7350), 0);
eq('redutor em R$ 5.000 = R$ 312,90', F.calcularRedutor(5000), 312.90);
eq('redutor não se aplica acima de R$ 7.350', F.calcularRedutor(8000), 0);

verdadeiro('R$ 3.000 é isento', F.salarioLiquido({ bruto: 3000 }).irrf.isento);
verdadeiro('R$ 5.000 é isento (promessa central da Lei 15.270/2025)',
  F.salarioLiquido({ bruto: 5000 }).irrf.isento);
verdadeiro('R$ 5.500 paga algum IRRF, mas reduzido',
  F.salarioLiquido({ bruto: 5500 }).irrf.valor > 0);

// At R$ 7.350 the redutor is spent; tax equals the plain table result.
eq('R$ 7.350 → IRRF cheio pela tabela', F.salarioLiquido({ bruto: 7350 }).irrf.valor, 884.13);

verdadeiro('escolhe o desconto simplificado quando é melhor',
  F.salarioLiquido({ bruto: 5000 }).irrf.usouDescontoSimplificado === true);
verdadeiro('dependentes nunca aumentam o imposto',
  F.salarioLiquido({ bruto: 9000, dependentes: 3 }).irrf.valor <=
  F.salarioLiquido({ bruto: 9000, dependentes: 0 }).irrf.valor);
eq('IRRF nunca é negativo', F.salarioLiquido({ bruto: 2000 }).irrf.valor, 0);

/* ---------- NET SALARY ---------- */
console.log('\nSALÁRIO LÍQUIDO');

(function () {
  var r = F.salarioLiquido({ bruto: 5000 });
  eq('R$ 5.000 → líquido R$ 4.498,49', r.liquido, 4498.49);
  eq('R$ 5.000 → FGTS mensal R$ 400', r.fgtsMensal, 400);
  eq('componentes fecham com o total',
    r.inss.valor + r.irrf.valor + r.pensao + r.outrosDescontos, r.totalDescontos);
  eq('bruto - descontos = líquido', r.bruto - r.totalDescontos, r.liquido);
})();

(function () {
  var r = F.salarioLiquido({ bruto: 12000, dependentes: 2, outrosDescontos: 300 });
  verdadeiro('salário alto: líquido menor que bruto', r.liquido < r.bruto);
  eq('outros descontos entram no total', r.outrosDescontos, 300);
  eq('bruto - descontos = líquido (caso alto)', r.bruto - r.totalDescontos, r.liquido);
})();

// Nobody should ever take home less by earning more.
(function () {
  var anterior = -1;
  var monotonico = true;
  for (var s = 1000; s <= 20000; s += 50) {
    var liq = F.salarioLiquido({ bruto: s }).liquido;
    if (liq < anterior - 0.001) monotonico = false;
    anterior = liq;
  }
  verdadeiro('líquido cresce sempre que o bruto cresce', monotonico);
})();

/* ---------- TERMINATION ---------- */
console.log('\nRESCISÃO');

(function () {
  var r = F.rescisao({
    salario: 3000, tipo: 'sem-justa-causa', diasTrabalhadosNoMes: 15,
    anosCompletos: 2, mesesPara13: 6, mesesParaFerias: 6, saldoFGTS: 10000
  });
  eq('aviso prévio: 30 + 3/ano completo = 36 dias', r.diasAviso, 36);
  eq('saldo de salário de 15 dias', r.proventos.saldoSalario, 1500);
  eq('13º proporcional 6/12', r.proventos.decimoTerceiroProporcional, 1500);
  eq('férias proporcionais 6/12', r.proventos.feriasProporcionais, 1500);
  eq('1/3 sobre as férias proporcionais', r.proventos.tercoFeriasProporcionais, 500);
  eq('multa de 40% do FGTS', r.proventos.multaFGTS, 4000);
  eq('saca 100% do FGTS', r.fgtsSacavel, 10000);
  verdadeiro('dá direito a seguro-desemprego', r.temSeguroDesemprego === true);
  eq('líquido = proventos - descontos', r.totalProventos - r.totalDescontos, r.liquido);
})();

(function () {
  var r = F.rescisao({
    salario: 3000, tipo: 'pedido-demissao', diasTrabalhadosNoMes: 30,
    anosCompletos: 2, mesesPara13: 6, mesesParaFerias: 6, saldoFGTS: 10000
  });
  eq('pedido de demissão: sem multa de FGTS', r.proventos.multaFGTS, 0);
  eq('pedido de demissão: não saca FGTS', r.fgtsSacavel, 0);
  eq('pedido de demissão: sem aviso indenizado', r.proventos.avisoPrevioIndenizado, 0);
  verdadeiro('pedido de demissão: sem seguro-desemprego', r.temSeguroDesemprego === false);
})();

(function () {
  var r = F.rescisao({
    salario: 3000, tipo: 'acordo', diasTrabalhadosNoMes: 30,
    anosCompletos: 0, mesesPara13: 12, mesesParaFerias: 12, saldoFGTS: 10000
  });
  eq('acordo: multa de 20%', r.proventos.multaFGTS, 2000);
  eq('acordo: saca 80% do FGTS', r.fgtsSacavel, 8000);
  eq('acordo: metade do aviso prévio', r.proventos.avisoPrevioIndenizado, 1500);
})();

(function () {
  var r = F.rescisao({
    salario: 3000, tipo: 'justa-causa', diasTrabalhadosNoMes: 10,
    anosCompletos: 3, mesesPara13: 8, mesesParaFerias: 8, saldoFGTS: 10000
  });
  eq('justa causa: sem 13º proporcional', r.proventos.decimoTerceiroProporcional, 0);
  eq('justa causa: sem férias proporcionais', r.proventos.feriasProporcionais, 0);
  eq('justa causa: sem multa de FGTS', r.proventos.multaFGTS, 0);
  eq('justa causa: mantém saldo de salário', r.proventos.saldoSalario, 1000);
})();

eq('aviso prévio limitado a 90 dias',
  F.rescisao({ salario: 3000, tipo: 'sem-justa-causa', anosCompletos: 30 }).diasAviso, 90);

/* ---------- COMPOUND INTEREST ---------- */
console.log('\nJUROS COMPOSTOS');

eq('R$ 1.000 a 1% a.m. por 12 meses',
  F.jurosCompostos({ inicial: 1000, aporteMensal: 0, meses: 12, taxaMensal: 0.01 }).montante,
  1126.83);
eq('sem taxa, montante = total investido',
  F.jurosCompostos({ inicial: 100, aporteMensal: 100, meses: 10, taxaMensal: 0 }).montante,
  1100);

(function () {
  var r = F.jurosCompostos({ inicial: 1000, aporteMensal: 500, meses: 24, taxaMensal: 0.008 });
  eq('total investido = inicial + aportes', r.totalInvestido, 1000 + 500 * 24);
  eq('juros = montante - investido', r.montante - r.totalInvestido, r.totalJuros);
  eq('série tem meses+1 pontos', r.evolucao.length, 25, 0);
})();

eq('12% a.a. ≈ 0,9489% a.m.', F.anualParaMensal(0.12) * 100, 0.9489, 0.0001);

/* ---------- FINANCING ---------- */
console.log('\nFINANCIAMENTO');

(function () {
  var r = F.financiamento({ valor: 100000, entrada: 0, meses: 12, taxaMensal: 0.01 });
  eq('Price: parcela fixa de R$ 8.884,88', r.price.primeira, 8884.88);
  eq('Price: primeira e última parcela são iguais', r.price.primeira, r.price.ultima);
  eq('Price: saldo final zera', r.price.parcelas[11].saldo, 0);
  eq('SAC: amortização constante', r.sac.parcelas[0].amortizacao, 100000 / 12);
  verdadeiro('SAC: parcelas decrescem', r.sac.ultima < r.sac.primeira);
  eq('SAC: saldo final zera', r.sac.parcelas[11].saldo, 0);
  verdadeiro('SAC paga menos juros que Price', r.sac.totalJuros < r.price.totalJuros);
  eq('Price: total pago = principal + juros', r.principal + r.price.totalJuros, r.price.totalPago);
})();

(function () {
  var r = F.financiamento({ valor: 300000, entrada: 60000, meses: 360, taxaMensal: 0.009 });
  eq('entrada abate o principal', r.principal, 240000);
  eq('Price gera 360 parcelas', r.price.parcelas.length, 360, 0);
  verdadeiro('juros de longo prazo superam o principal', r.price.totalJuros > r.principal);
})();

eq('sem juros, Price = principal dividido pelo prazo',
  F.financiamento({ valor: 1200, entrada: 0, meses: 12, taxaMensal: 0 }).price.primeira, 100);

verdadeiro('entrada cobrindo tudo não gera parcelas',
  F.financiamento({ valor: 1000, entrada: 1000, meses: 12, taxaMensal: 0.01 }).price.parcelas.length === 0);

/* ---------- RESULT ---------- */
console.log('\n' + '-'.repeat(52));
if (falhas === 0) {
  console.log(total + '/' + total + ' verificações passaram.');
  process.exit(0);
} else {
  console.error(falhas + ' de ' + total + ' verificações FALHARAM.');
  process.exit(1);
}
