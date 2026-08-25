/* ===================================================
   TESTE AO CONTRÁRIO DO HARNESS CHECK
   Uso: node ferramentas/testar-harness-check.js

   Corrompe o Harness de propósito e exige que o check
   reprove. C8: gate que não prova os dois sentidos é
   decoração.

   Um Harness que mente é pior que Harness nenhum — sem
   ele a sessão investiga; com ele mentindo, ela age errado
   com confiança. Este teste é o que impede isso.

   >>> Restaura em `finally`. Restaurar na última linha não
       basta: só `finally` roda quando o meio explode.
   =================================================== */

'use strict';

var fs = require('fs');
var path = require('path');
var { spawnSync } = require('child_process');

var RAIZ = path.join(__dirname, '..');
var FILA = path.join(RAIZ, '.harness/work-items.json');
var CHECK = path.join(__dirname, 'harness-check.js');

var falhas = [];
var feitos = 0;

function rodar() {
  var r = spawnSync(process.execPath, [CHECK], { encoding: 'utf8' });
  return { codigo: r.status, saida: (r.stdout || '') + (r.stderr || '') };
}

function exigirReprovacao(nome, trecho) {
  feitos++;
  var r = rodar();
  if (r.codigo === 0) {
    falhas.push(nome + ': PASSOU quando deveria reprovar.');
    return;
  }
  if (r.saida.indexOf(trecho) === -1) {
    falhas.push(nome + ': reprovou pelo motivo errado.\n      esperava: ' + trecho +
                '\n      saiu: ' + r.saida.trim().split('\n').slice(-2).join(' | '));
    return;
  }
  console.log('  ok      ' + nome);
}

function exigirAprovacao(nome) {
  feitos++;
  var r = rodar();
  if (r.codigo !== 0) {
    falhas.push(nome + ': REPROVOU o Harness íntegro.\n      ' +
                r.saida.trim().split('\n').slice(-3).join(' | '));
    return;
  }
  console.log('  ok      ' + nome);
}

/* Corrompe a fila, roda, restaura. */
function comFilaCorrompida(mutar, nome, trecho) {
  var original = fs.readFileSync(FILA, 'utf8');
  try {
    var dados = JSON.parse(original);
    mutar(dados);
    fs.writeFileSync(FILA, JSON.stringify(dados, null, 2), 'utf8');
    exigirReprovacao(nome, trecho);
  } finally {
    fs.writeFileSync(FILA, original, 'utf8');
  }
}

console.log('\nTESTE AO CONTRÁRIO DO HARNESS CHECK\n');

exigirAprovacao('Harness íntegro passa (não reprova sempre)');

/* --- JSON quebrado --- */
(function () {
  var original = fs.readFileSync(FILA, 'utf8');
  try {
    fs.writeFileSync(FILA, original.slice(0, -20), 'utf8');
    exigirReprovacao('pega JSON inválido', 'não é JSON válido');
  } finally {
    fs.writeFileSync(FILA, original, 'utf8');
  }
})();

/* --- arquivo obrigatório sumindo --- */
(function () {
  var alvo = path.join(RAIZ, '.harness/mission.md');
  var original = fs.readFileSync(alvo, 'utf8');
  try {
    fs.unlinkSync(alvo);
    exigirReprovacao('pega arquivo obrigatório ausente', 'falta o arquivo obrigatório');
  } finally {
    fs.writeFileSync(alvo, original, 'utf8');
  }
})();

/* --- id duplicado --- */
comFilaCorrompida(function (d) {
  d.items.push(JSON.parse(JSON.stringify(d.items[0])));
}, 'pega id duplicado', 'id duplicado');

/* --- status inventado --- */
comFilaCorrompida(function (d) {
  d.items[0].status = 'quase-pronto';
}, 'pega status inválido', 'status inválido');

/* --- bloqueado sem dizer por quê --- */
comFilaCorrompida(function (d) {
  var b = d.items.filter(function (i) { return i.status === 'blocked_human'; })[0];
  b.blocker = null;
}, 'pega bloqueio sem motivo escrito', 'bloqueado e não diz por quê');

/* --- concluído sem prova --- */
comFilaCorrompida(function (d) {
  var f = d.items.filter(function (i) { return i.status === 'done'; })[0];
  f.verification = [];
}, 'pega done sem como verificar', 'done sem como verificar');

/* --- referência para arquivo que não existe --- */
comFilaCorrompida(function (d) {
  d.items[0].references.push('ferramentas/isto-nunca-existiu.js');
}, 'pega referência morta', 'referencia arquivo inexistente');

/* --- dependência fantasma --- */
comFilaCorrompida(function (d) {
  d.items[0].dependencies.push('ITEM-QUE-NAO-EXISTE');
}, 'pega dependência inexistente', 'que não existe');

/* --- ciclo --- */
comFilaCorrompida(function (d) {
  d.items[0].dependencies = [d.items[1].id];
  d.items[1].dependencies = [d.items[0].id];
}, 'pega ciclo de dependência', 'ciclo de dependência');

/* --- ponteiro da missão apontando para o vazio --- */
comFilaCorrompida(function (d) {
  d.current = 'ITEM-APAGADO';
}, 'pega current apontando para item inexistente', 'não está na fila');

/* --- Harness entrando no site --- */
(function () {
  var alvo = path.join(RAIZ, 'ferramentas/publico.js');
  var original = fs.readFileSync(alvo, 'utf8');
  try {
    fs.writeFileSync(alvo, original.replace("'index.html',", "'index.html',\n  'HARNESS.md',"), 'utf8');
    exigirReprovacao('pega o Harness entrando no allowlist do site (C13)',
                     'allowlist de publico.js inclui arquivo do Harness');
  } finally {
    fs.writeFileSync(alvo, original, 'utf8');
  }
})();

exigirAprovacao('tudo restaurado, volta a passar');

console.log('\n' + '-'.repeat(52));
if (falhas.length) {
  console.error('O HARNESS CHECK NÃO É CONFIÁVEL:\n');
  falhas.forEach(function (f) { console.error('  ' + f + '\n'); });
  process.exit(1);
}
console.log(feitos + '/' + feitos + ' testes ao contrário do Harness passaram.');
