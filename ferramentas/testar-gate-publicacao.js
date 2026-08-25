/* ===================================================
   TESTE AO CONTRÁRIO DO GATE DE PUBLICAÇÃO
   Uso: node ferramentas/testar-gate-publicacao.js

   Quebra a condição de propósito, quatro vezes, e exige
   que o gate reprove em cada uma. Se ele passar, o teste
   falha.

   Isto não é zelo: é a regra 2 do projeto. Um gate que
   passa quando não deveria é pior que gate nenhum, porque
   compra confiança sem entregar nada. E este gate em
   particular guarda o arquivo que custa R$ 97 — se ele
   estiver cego, ninguém descobre pelo lado bom.

   >>> Toda alteração é desfeita em `finally`.

   A armadilha 8 do projeto foi exatamente isto ao
   contrário: um teste morreu antes da linha que restaurava
   e deixou lixo no disco, que a execução seguinte leu como
   valor real. Restaurar na última linha não basta — só
   `finally` roda quando o meio explode.
   =================================================== */

'use strict';

var fs = require('fs');
var path = require('path');
var { spawnSync } = require('child_process');
var publico = require('./publico');

var RAIZ = path.join(__dirname, '..');
var DIST = path.join(RAIZ, publico.DIST);
var GATE = path.join(__dirname, 'verificar-publicacao.js');

var falhas = [];
var feitos = 0;

/* Roda o gate e devolve { codigo, saida }. */
function rodarGate() {
  var r = spawnSync(process.execPath, [GATE], { encoding: 'utf8' });
  return { codigo: r.status, saida: (r.stdout || '') + (r.stderr || '') };
}

/* Exige que o gate REPROVE, e que reprove pelo motivo certo.

   Conferir só o código de saída seria fraco: o gate poderia estar
   morrendo por um erro de digitação e o teste comemoraria. O trecho
   esperado prova que ele reprovou pela razão que estamos testando. */
function exigirReprovacao(nome, trechoEsperado) {
  feitos++;
  var r = rodarGate();
  if (r.codigo === 0) {
    falhas.push(nome + ': o gate PASSOU quando deveria reprovar.');
    return;
  }
  if (r.saida.indexOf(trechoEsperado) === -1) {
    falhas.push(nome + ': reprovou, mas não pelo motivo esperado.\n' +
                '      esperava conter: ' + trechoEsperado + '\n' +
                '      saiu: ' + r.saida.trim().split('\n').slice(-3).join(' | '));
    return;
  }
  console.log('  ok      ' + nome);
}

/* Exige que o gate APROVE — o estado limpo, para provar que ele não
   reprova sempre. Um gate que reprova tudo também é inútil, e passa
   despercebido porque "está pegando alguma coisa". */
function exigirAprovacao(nome) {
  feitos++;
  var r = rodarGate();
  if (r.codigo !== 0) {
    falhas.push(nome + ': o gate REPROVOU o build limpo.\n      ' +
                r.saida.trim().split('\n').slice(-3).join(' | '));
    return;
  }
  console.log('  ok      ' + nome);
}

/* ---------- PREPARO ---------- */

console.log('\nTESTE AO CONTRÁRIO DO GATE DE PUBLICAÇÃO\n');

spawnSync(process.execPath, [path.join(__dirname, 'gerar-dist.js')], { encoding: 'utf8' });

var BASE = path.join(RAIZ, publico.PAGOS.base.arquivo);
var COMPLETO = path.join(RAIZ, publico.PAGOS.completo.arquivo);

/* ---------- 0. O ESTADO LIMPO PASSA ---------- */

exigirAprovacao('build limpo passa (o gate não reprova sempre)');

/* ---------- 1. PRODUTO PAGO NO DIST, COM O PRÓPRIO NOME ---------- */

var intruso1 = path.join(DIST, 'produtos', path.basename(BASE));
try {
  fs.copyFileSync(BASE, intruso1);
  exigirReprovacao('pega o produto pago pelo NOME', 'PRODUTO PAGO NO DIST (nome)');
} finally {
  if (fs.existsSync(intruso1)) fs.unlinkSync(intruso1);
}

/* ---------- 2. RENOMEADO ---------- */

// O caso que um glob de nome não pega: mesmo arquivo, nome inocente.
var intruso2 = path.join(DIST, 'produtos', 'guia-do-usuario.html');
try {
  fs.copyFileSync(BASE, intruso2);
  exigirReprovacao('pega o produto RENOMEADO pelo hash do conteúdo',
                   'conteúdo idêntico a');
} finally {
  if (fs.existsSync(intruso2)) fs.unlinkSync(intruso2);
}

/* ---------- 3. COLAGEM PARCIAL DO MÓDULO PAGO ---------- */

// Nem cópia inteira nem nome suspeito: alguém colou parte do módulo de
// rescisão dentro de um script público. Hash não pega, nome não pega.
var vitima = path.join(DIST, 'produtos', 'funil.js');
var original3 = fs.readFileSync(vitima, 'utf8');
try {
  fs.writeFileSync(vitima, original3 + '\nfunction montarTermoRescisao(){}\n', 'utf8');
  exigirReprovacao('pega a COLAGEM PARCIAL do módulo pago', 'MÓDULO PAGO NO DIST');
} finally {
  fs.writeFileSync(vitima, original3, 'utf8');
}

/* ---------- 4. ASSINATURA MORTA ---------- */

// O modo de falhar mais traiçoeiro: alguém renomeia a função no
// produto, a assinatura deixa de existir, e o gate segue rodando e
// nunca mais acha nada. Passa para sempre, por estar cego.
var original4 = fs.readFileSync(COMPLETO, 'utf8');
try {
  fs.writeFileSync(COMPLETO,
    original4.split('montarTermoRescisao').join('montarTermoDesligamento'), 'utf8');
  exigirReprovacao('percebe a própria CEGUEIRA quando a assinatura some',
                   'ASSINATURA MORTA');
} finally {
  fs.writeFileSync(COMPLETO, original4, 'utf8');
}

/* ---------- 5. VOLTOU AO NORMAL ---------- */

exigirAprovacao('tudo restaurado, o gate volta a passar');

/* ---------- RESULTADO ---------- */

console.log('\n' + '-'.repeat(52));
if (falhas.length) {
  console.error('O GATE DE PUBLICAÇÃO NÃO É CONFIÁVEL:\n');
  falhas.forEach(function (f) { console.error('  ' + f); });
  console.error('');
  process.exit(1);
}
console.log(feitos + '/' + feitos + ' testes ao contrário passaram.');
console.log('O gate reprova por nome, por conteúdo, por trecho e por cegueira.');
