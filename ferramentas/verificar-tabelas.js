/* ===================================================
   FISCAL TABLE FRESHNESS CHECK
   Run: node ferramentas/verificar-tabelas.js

   The calculators are only trustworthy while the tables
   match the current year. Brazil republishes INSS and
   IRRF parameters every January, so this runs on a
   schedule and raises a flag when the site is about to
   go stale — instead of waiting for a user to notice.

   Writes `precisa_atualizar` to $GITHUB_OUTPUT when run
   inside GitHub Actions. Never fails the build: a stale
   table is a to-do, not a broken deploy.
   =================================================== */

'use strict';

var fs = require('fs');
var F = require('./nucleo.js');

var anoAtual = new Date().getUTCFullYear();
var mesAtual = new Date().getUTCMonth() + 1; // 1-12
var anoTabelas = F.TABELAS.ano;

var motivos = [];

if (anoTabelas < anoAtual) {
  motivos.push(
    'As tabelas do site são de ' + anoTabelas + ', mas já estamos em ' + anoAtual + '. ' +
    'Os valores de INSS e IRRF mudaram em janeiro e os cálculos estão desatualizados.'
  );
} else if (anoTabelas === anoAtual && mesAtual >= 11) {
  motivos.push(
    'Novembro/dezembro é quando o governo publica os parâmetros do ano seguinte. ' +
    'Vale acompanhar para atualizar as tabelas antes da virada do ano.'
  );
}

// A sanity anchor: if this stops holding, someone edited the brackets
// without updating the reference the whole table is checked against.
var descontoNoTeto = F.calcularINSS(F.TABELAS.inss.teto).valor;
var somaDasFaixas = F.TABELAS.inss.faixas.reduce(function (acc, faixa, i) {
  var piso = i === 0 ? 0 : F.TABELAS.inss.faixas[i - 1].ate;
  return acc + (faixa.ate - piso) * faixa.aliquota;
}, 0);

if (Math.abs(descontoNoTeto - somaDasFaixas) > 0.02) {
  motivos.push(
    'Inconsistência interna: o desconto no teto (' + descontoNoTeto +
    ') não bate com a soma das faixas (' + somaDasFaixas.toFixed(2) + ').'
  );
}

console.log('Tabelas do ano: ' + anoTabelas + ' (revisadas em ' + F.TABELAS.atualizadoEm + ')');
console.log('Data de hoje:   ' + anoAtual + '-' + String(mesAtual).padStart(2, '0'));
console.log('Desconto no teto do INSS: R$ ' + descontoNoTeto.toFixed(2));

var precisaAtualizar = motivos.length > 0;

if (precisaAtualizar) {
  console.log('\nATENÇÃO:');
  motivos.forEach(function (m) { console.log('  - ' + m); });
} else {
  console.log('\nTabelas em dia.');
}

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    'precisa_atualizar=' + (precisaAtualizar ? 'true' : 'false') + '\n' +
    'ano_tabelas=' + anoTabelas + '\n' +
    'motivos=' + motivos.join(' | ') + '\n'
  );
}

process.exit(0);
