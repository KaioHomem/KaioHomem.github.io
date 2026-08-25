/* ===================================================
   HARNESS CHECK — o Harness ainda descreve a realidade?
   Uso: node ferramentas/harness-check.js
        npm run harness:check

   Cada regra aqui existe porque impede uma falha concreta
   de recuperação. Estado operacional que mente é pior que
   estado operacional ausente: com nada, a sessão investiga;
   com mentira, ela age errado com confiança.

   >>> Antes de acrescentar regra, pergunte que falha ela
       evita. Sem resposta, não acrescente — este arquivo
       não é para virar framework.
   =================================================== */

'use strict';

var fs = require('fs');
var path = require('path');

var RAIZ = path.join(__dirname, '..');
var problemas = [];
var checagens = 0;

function exigir(condicao, mensagem) {
  checagens++;
  if (!condicao) problemas.push(mensagem);
}

function existe(rel) { return fs.existsSync(path.join(RAIZ, rel)); }

/* ---------- 1. OS ARQUIVOS EXISTEM ----------
   Falha que evita: a sessão nova abre HARNESS.md, ele manda ler a
   Constitution, e o arquivo não está lá. */
var OBRIGATORIOS = [
  'HARNESS.md',
  '.harness/CONSTITUTION.md',
  '.harness/mission.md',
  '.harness/work-items.json',
  '.harness/progress.md',
  '.harness/handoff.md'
];
OBRIGATORIOS.forEach(function (f) {
  exigir(existe(f), 'falta o arquivo obrigatório: ' + f);
});

if (problemas.length) {
  console.error('\nHarness incompleto:\n');
  problemas.forEach(function (p) { console.error('  ' + p); });
  process.exit(1);
}

/* ---------- 2. A FILA É JSON VÁLIDO ----------
   Falha que evita: harness:status morre e a sessão fica sem fila. */
var fila;
try {
  fila = JSON.parse(fs.readFileSync(path.join(RAIZ, '.harness/work-items.json'), 'utf8'));
} catch (e) {
  console.error('\n.harness/work-items.json não é JSON válido: ' + e.message);
  process.exit(1);
}

var itens = fila.items || [];
exigir(Array.isArray(itens) && itens.length > 0, 'a fila não tem nenhum item');

/* ---------- 3. CADA ITEM É UTILIZÁVEL ---------- */
var STATUS = ['ready', 'in_progress', 'blocked_human', 'blocked_technical',
              'done', 'superseded'];
var CLASSES = ['A', 'B', 'C'];
var vistos = {};

itens.forEach(function (i, n) {
  var onde = 'item #' + (n + 1) + (i.id ? ' (' + i.id + ')' : '');

  exigir(!!i.id, onde + ' não tem id');
  if (i.id) {
    // Falha que evita: dois itens com o mesmo id, e `current` apontando
    // para um deles sem ninguém saber qual.
    exigir(!vistos[i.id], 'id duplicado: ' + i.id);
    vistos[i.id] = i;
  }
  exigir(!!i.title, onde + ' não tem título');
  exigir(STATUS.indexOf(i.status) !== -1,
         onde + ' tem status inválido: ' + i.status);
  exigir(CLASSES.indexOf(i.authority_class) !== -1,
         onde + ' tem classe de autoridade inválida: ' + i.authority_class);

  /* Bloqueado sem motivo escrito.
     Falha que evita: a sessão seguinte não sabe por que parou, tenta de
     novo, e esbarra na mesma parede — ou pior, contorna um bloqueio que
     existia por uma razão. */
  if (i.status === 'blocked_human' || i.status === 'blocked_technical') {
    exigir(!!i.blocker, onde + ' está bloqueado e não diz por quê');
  }

  /* Concluído sem prova.
     Falha que evita: `done` por narrativa. Um item fechado precisa dizer
     o que o fecharia e como conferir — senão ninguém consegue
     revalidá-lo depois. */
  if (i.status === 'done') {
    exigir((i.acceptance_criteria || []).length > 0,
           onde + ' está done sem critério de aceitação');
    exigir((i.verification || []).length > 0,
           onde + ' está done sem como verificar');
  }

  /* Referência que não existe.
     Falha que evita: Context Engineering apontando para arquivo
     renomeado. A sessão carrega o vazio e trabalha às cegas. */
  (i.references || []).forEach(function (r) {
    exigir(existe(r), (i.id || onde) + ' referencia arquivo inexistente: ' + r);
  });
  (i.decision_refs || []).forEach(function (r) {
    exigir(existe(r), (i.id || onde) + ' referencia decisão inexistente: ' + r);
  });
});

/* ---------- 4. DEPENDÊNCIAS ---------- */
itens.forEach(function (i) {
  (i.dependencies || []).forEach(function (d) {
    exigir(!!vistos[d], (i.id || '?') + ' depende de ' + d + ', que não existe');
  });
});

/* Ciclo simples.
   Falha que evita: dois itens esperando um pelo outro para sempre, e
   nenhum deles nunca fica `ready`. */
(function () {
  var estado = {};
  function anda(id, caminho) {
    if (estado[id] === 'ok') return;
    if (estado[id] === 'andando') {
      problemas.push('ciclo de dependência: ' + caminho.concat(id).join(' → '));
      return;
    }
    estado[id] = 'andando';
    ((vistos[id] || {}).dependencies || []).forEach(function (d) {
      if (vistos[d]) anda(d, caminho.concat(id));
    });
    estado[id] = 'ok';
  }
  checagens++;
  Object.keys(vistos).forEach(function (id) { anda(id, []); });
})();

/* ---------- 5. O PONTEIRO DA MISSÃO ----------
   Falha que evita: `current` apontando para item apagado, e a sessão
   nova começando pelo nada. */
if (fila.current) {
  exigir(!!vistos[fila.current],
         'mission.current aponta para "' + fila.current + '", que não está na fila');
  var atual = vistos[fila.current];
  if (atual) {
    exigir(['ready', 'in_progress'].indexOf(atual.status) !== -1,
           'mission.current aponta para ' + atual.id + ', que está "' + atual.status +
           '" — um item atual precisa estar ready ou in_progress');
  }
}
exigir(!!fila.mission, 'a fila não declara a que missão pertence');

/* ---------- 6. HÁ TRABALHO OU HÁ EXPLICAÇÃO ----------
   Falha que evita: fila sem nada `ready` e sem nada bloqueado — estado
   que parece "acabou" mas normalmente é fila desatualizada. */
var vivos = itens.filter(function (i) {
  return ['ready', 'in_progress'].indexOf(i.status) !== -1;
});
var travados = itens.filter(function (i) {
  return i.status === 'blocked_human' || i.status === 'blocked_technical';
});
exigir(vivos.length > 0 || travados.length > 0,
       'a fila não tem trabalho pronto nem bloqueio registrado — ' +
       'ou a missão acabou e ninguém a fechou, ou a fila envelheceu');

/* ---------- 7. O HARNESS NÃO PODE SER PUBLICADO ----------
   Falha que evita: C13. O allowlist é a defesa, mas nada impedia alguém
   de listar .harness/ nele por engano. */
(function () {
  var publico = require('./publico');
  var texto = JSON.stringify(publico.ALLOWLIST);
  exigir(texto.indexOf('.harness') === -1 && texto.indexOf('HARNESS.md') === -1,
         'o allowlist de publico.js inclui arquivo do Harness — ' +
         'estado operacional não vai para o site (C13)');
})();

/* ---------- RESULTADO ---------- */

if (problemas.length) {
  console.error('\n' + '-'.repeat(52));
  console.error('O HARNESS NÃO DESCREVE A REALIDADE:\n');
  problemas.forEach(function (p) { console.error('  ' + p); });
  console.error('');
  process.exit(1);
}

console.log('\n' + '-'.repeat(52));
console.log(checagens + ' checagens do Harness passaram.');
console.log(itens.length + ' itens na fila: ' + vivos.length + ' vivo(s), ' +
            travados.length + ' bloqueado(s), ' +
            itens.filter(function (i) { return i.status === 'done'; }).length + ' concluído(s).');
