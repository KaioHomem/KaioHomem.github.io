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

/* ---------- 13TH SALARY ---------- */
console.log('\nDÉCIMO TERCEIRO');

(function () {
  var r = F.decimoTerceiro({ salario: 3000, meses: 12 });
  eq('12 meses → 13º integral igual ao salário', r.bruto, 3000);
  eq('primeira parcela é metade do bruto, sem desconto', r.primeiraParcela, 1500);
  eq('INSS incide sobre o 13º cheio', r.inss.valor, 248.60);
  verdadeiro('R$ 3.000 de 13º é isento de IRRF', r.irrf.isento);
  eq('líquido = bruto - descontos', r.liquido, 2751.40);
  eq('segunda parcela absorve todos os descontos', r.segundaParcela, 1251.40);
  eq('as duas parcelas somam o líquido', r.primeiraParcela + r.segundaParcela, r.liquido);
  eq('FGTS de 8% também incide sobre o 13º', r.fgts, 240);
})();

(function () {
  var r = F.decimoTerceiro({ salario: 3000, meses: 6 });
  eq('6 meses → metade do 13º', r.bruto, 1500);
  verdadeiro('proporcional não é marcado como integral', r.integral === false);
  eq('parcelas do proporcional fecham', r.primeiraParcela + r.segundaParcela, r.liquido);
})();

// The bonus is taxed on its own base — never stacked onto the month's pay.
(function () {
  var isolado = F.decimoTerceiro({ salario: 6000, meses: 12 });
  var mensal = F.salarioLiquido({ bruto: 6000 });
  eq('13º usa a mesma base isolada de um salário igual', isolado.inss.valor, mensal.inss.valor);
})();

eq('sem meses trabalhados não há 13º', F.decimoTerceiro({ salario: 3000, meses: 0 }).bruto, 0);

/* ---------- VACATION ---------- */
console.log('\nFÉRIAS');

(function () {
  var r = F.ferias({ salario: 3000, dias: 30, diasVendidos: 0 });
  eq('30 dias de férias = um salário', r.valorFerias, 3000);
  eq('adicional de um terço', r.terco, 1000);
  eq('base tributável = férias + 1/3', r.baseTributavel, 4000);
  eq('INSS sobre férias mais o terço', r.inss.valor, 368.60);
  verdadeiro('R$ 4.000 de férias fica isento de IRRF', r.irrf.isento);
  eq('líquido de férias cheias', r.liquido, 3631.40);
})();

(function () {
  var r = F.ferias({ salario: 3000, dias: 30, diasVendidos: 10 });
  eq('vendendo 10 dias, goza 20', r.diasGozados, 20);
  eq('abono de 10 dias', r.abono, 1000);
  eq('abono também recebe um terço', r.tercoAbono, 333.33);
  eq('base tributável cai (abono é isento)', r.baseTributavel, 2666.67);
  verdadeiro('abono fica fora da base do INSS', r.inss.valor < 368.60);
  eq('líquido soma o abono isento',
    r.baseTributavel - r.totalDescontos + r.totalAbono, r.liquido);
})();

eq('venda de dias é limitada a um terço do período',
  F.ferias({ salario: 3000, dias: 30, diasVendidos: 25 }).diasVendidos, 10, 0);

eq('férias parciais de 15 dias', F.ferias({ salario: 3000, dias: 15 }).valorFerias, 1500);

(function () {
  var com = F.ferias({ salario: 3000, dias: 30, adiantar13: true });
  var sem = F.ferias({ salario: 3000, dias: 30 });
  eq('adiantar o 13º soma meio salário', com.liquido - sem.liquido, 1500);
})();

/* ---------- UNEMPLOYMENT BENEFIT ---------- */
console.log('\nSEGURO-DESEMPREGO');

// Both bracket boundaries are exact in the official table — if an edit
// breaks either, the published table was transcribed wrong.
eq('fim da faixa 1 casa com a base da faixa 2',
  F.seguroDesemprego({ media: 2222.17, mesesTrabalhados: 24, solicitacao: 1 }).valorParcela, 1777.74);
eq('fim da faixa 2 casa exatamente com o teto',
  F.seguroDesemprego({ media: 3703.99, mesesTrabalhados: 24, solicitacao: 1 }).valorParcela, 2518.65);

eq('faixa 2 → base + 50% do excedente',
  F.seguroDesemprego({ media: 3000, mesesTrabalhados: 24, solicitacao: 1 }).valorParcela, 2166.66);
eq('acima da faixa 2 trava no teto',
  F.seguroDesemprego({ media: 9000, mesesTrabalhados: 24, solicitacao: 1 }).valorParcela, 2518.65);

(function () {
  var r = F.seguroDesemprego({ media: 2000, mesesTrabalhados: 24, solicitacao: 1 });
  eq('parcela nunca fica abaixo do salário mínimo', r.valorParcela, 1621.00);
  verdadeiro('sinaliza quando subiu para o piso', r.ajustadoAoPiso === true);
})();

(function () {
  var r = F.seguroDesemprego({ salarios: [3000, 3000, 3000], mesesTrabalhados: 24, solicitacao: 1 });
  eq('média de três salários iguais é o próprio salário', r.media, 3000);
  eq('5 parcelas com 24 meses na 1ª solicitação', r.numeroParcelas, 5, 0);
  eq('total = parcela × número de parcelas', r.total, 10833.30);
})();

eq('média de salários diferentes',
  F.seguroDesemprego({ salarios: [2000, 3000, 4000], mesesTrabalhados: 24 }).media, 3000);

// Months worked and claim count interact — the usual source of confusion.
eq('1ª solicitação com 12 meses → 4 parcelas',
  F.seguroDesemprego({ media: 3000, mesesTrabalhados: 12, solicitacao: 1 }).numeroParcelas, 4, 0);
eq('2ª solicitação com 9 meses → 3 parcelas',
  F.seguroDesemprego({ media: 3000, mesesTrabalhados: 9, solicitacao: 2 }).numeroParcelas, 3, 0);
eq('2ª solicitação com 24 meses → 5 parcelas',
  F.seguroDesemprego({ media: 3000, mesesTrabalhados: 24, solicitacao: 2 }).numeroParcelas, 5, 0);
eq('3ª solicitação com 6 meses → 3 parcelas',
  F.seguroDesemprego({ media: 3000, mesesTrabalhados: 6, solicitacao: 3 }).numeroParcelas, 3, 0);

verdadeiro('1ª solicitação com 10 meses não dá direito',
  F.seguroDesemprego({ media: 3000, mesesTrabalhados: 10, solicitacao: 1 }).elegivel === false);
verdadeiro('3ª solicitação com 10 meses dá direito',
  F.seguroDesemprego({ media: 3000, mesesTrabalhados: 10, solicitacao: 3 }).elegivel === true);
eq('sem direito, não há valor a receber',
  F.seguroDesemprego({ media: 3000, mesesTrabalhados: 3, solicitacao: 1 }).total, 0);

/* ---------- OVERTIME ---------- */
console.log('\nHORAS EXTRAS');

(function () {
  var r = F.horasExtras({ salario: 3000, jornadaMensal: 220, horas50: 10, horas100: 5 });
  eq('valor da hora = salário / jornada', r.valorHora, 13.64);
  eq('10 horas com adicional de 50%', r.valor50, 204.60);
  eq('5 horas com adicional de 100%', r.valor100, 136.40);
  eq('DSR reflete as extras no descanso', r.dsr, 68.20);
  eq('total das extras', r.total, 409.20);
  eq('salário do mês com as extras', r.salarioComExtras, 3409.20);
})();

(function () {
  var r = F.horasExtras({ salario: 3000, horas50: 10, horas100: 5, calcularDSR: false });
  eq('sem DSR o reflexo some', r.dsr, 0);
  eq('total cai para as extras puras', r.total, 341.00);
})();

(function () {
  var r = F.horasExtras({ salario: 3000, horasNoturnas: 10, calcularDSR: false });
  eq('adicional noturno paga só os 20%', r.valorNoturno, 27.28);
  eq('hora noturna reduzida: 10h valem 11,43h', r.horasNoturnasEquivalentes, 11.43);
  eq('sem marcar a hora reduzida, ela não é paga', r.valorHoraReduzida, 0);
})();

eq('com hora noturna reduzida, paga a diferença',
  F.horasExtras({ salario: 3000, horasNoturnas: 10, horaNoturnaReduzida: true, calcularDSR: false })
    .valorHoraReduzida, 19.51);

eq('jornada de 200h encarece a hora',
  F.horasExtras({ salario: 3000, jornadaMensal: 200 }).valorHora, 15.00);

verdadeiro('hora de 100% vale mais que a de 50%',
  F.horasExtras({ salario: 3000, horas100: 1 }).valor100 >
  F.horasExtras({ salario: 3000, horas50: 1 }).valor50);

eq('sem horas lançadas não há o que pagar',
  F.horasExtras({ salario: 3000 }).total, 0);

/* ---------- SIMPLES NACIONAL ---------- */
console.log('\nSIMPLES NACIONAL');

eq('Anexo III faixa 1 → 6%', F.aliquotaSimples(100000, 'III').efetiva * 100, 6, 0.001);
eq('Anexo III no fim da faixa 1 continua 6%', F.aliquotaSimples(180000, 'III').efetiva * 100, 6, 0.001);
eq('Anexo III em 360k → 8,6%', F.aliquotaSimples(360000, 'III').efetiva * 100, 8.6, 0.001);
eq('Anexo III em 720k → 11,05%', F.aliquotaSimples(720000, 'III').efetiva * 100, 11.05, 0.001);
eq('Anexo V faixa 1 → 15,5%', F.aliquotaSimples(180000, 'V').efetiva * 100, 15.5, 0.001);
eq('Anexo V em 360k → 16,75%', F.aliquotaSimples(360000, 'V').efetiva * 100, 16.75, 0.001);

verdadeiro('Anexo V é sempre mais caro que o III',
  F.aliquotaSimples(300000, 'V').efetiva > F.aliquotaSimples(300000, 'III').efetiva);

// The whole table is designed so the effective rate never jumps at a
// boundary. If a bracket is ever transcribed wrong, this breaks first.
['III', 'V'].forEach(function (anexo) {
  var tabela = anexo === 'V' ? F.TABELAS.simples.anexoV : F.TABELAS.simples.anexoIII;
  tabela.slice(0, -1).forEach(function (faixa) {
    var antes = F.aliquotaSimples(faixa.ate, anexo).efetiva;
    var depois = F.aliquotaSimples(faixa.ate + 1, anexo).efetiva;
    eq('Anexo ' + anexo + ': alíquota é contínua em ' + faixa.ate, depois * 100, antes * 100, 0.001);
  });
});

// Progressivity: paying more revenue never lowers the effective rate.
(function () {
  var anterior = -1;
  var cresce = true;
  for (var r = 10000; r <= 720000; r += 10000) {
    var e = F.aliquotaSimples(r, 'III').efetiva;
    if (e < anterior - 1e-9) cresce = false;
    anterior = e;
  }
  verdadeiro('alíquota efetiva nunca cai quando o faturamento sobe', cresce);
})();

verdadeiro('acima de 720k o modelo se declara incompleto',
  F.aliquotaSimples(1000000, 'III').foraDoModelo === true);
verdadeiro('dentro do modelo não levanta a bandeira',
  F.aliquotaSimples(500000, 'III').foraDoModelo === false);

/* ---------- CLT vs PJ ---------- */
console.log('\nCLT vs PJ');

(function () {
  var r = F.cltVsPj({ salario: 5000, contadorMensal: 200 });

  // The core promise: invoicing the suggested amount really does leave the
  // PJ with the same money as the CLT package. If the solver drifts, this
  // is what catches it.
  eq('faturamento equivalente empata com o pacote CLT',
    r.pj.liquido, r.clt.mensalEquivalente, 0.05);

  verdadeiro('PJ precisa faturar mais que o salário CLT',
    r.pj.faturamentoEquivalente > r.clt.bruto);
  verdadeiro('o prêmio necessário é positivo', r.premioNecessario > 0);
  eq('FGTS acumula sobre 13 salários', r.clt.fgtsAno, F.round2(5000 * 0.08 * 13));
  verdadeiro('13º entra no pacote anual', r.clt.decimoTerceiro > 0);
  verdadeiro('o terço de férias entra como ganho', r.clt.ganhoFerias > 0);
})();

// Benefits are untaxed money and must raise the bar for the PJ side.
verdadeiro('vale-refeição eleva o faturamento necessário',
  F.cltVsPj({ salario: 5000, beneficios: 800, contadorMensal: 200 }).pj.faturamentoEquivalente >
  F.cltVsPj({ salario: 5000, contadorMensal: 0 }).pj.faturamentoEquivalente);

verdadeiro('contador mais caro exige faturar mais',
  F.cltVsPj({ salario: 5000, contadorMensal: 600 }).pj.faturamentoEquivalente >
  F.cltVsPj({ salario: 5000, contadorMensal: 200 }).pj.faturamentoEquivalente);

verdadeiro('cair no Anexo V exige faturar bem mais',
  F.cltVsPj({ salario: 8000, anexo: 'V' }).pj.faturamentoEquivalente >
  F.cltVsPj({ salario: 8000, anexo: 'III' }).pj.faturamentoEquivalente);

(function () {
  var r = F.cltVsPj({ salario: 12000, proLabore: 1621 });
  verdadeiro('pró-labore baixo derruba o Fator R abaixo de 28%', r.pj.perdeAnexoIII === true);
  eq('INSS sobre pró-labore é 11%', r.pj.inssProLabore, F.round2(1621 * 0.11));
})();

verdadeiro('pró-labore alto mantém o Anexo III',
  F.cltVsPj({ salario: 5000, proLabore: 6000 }).pj.perdeAnexoIII === false);

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
