/* ===================================================
   HARNESS STATUS — onde o trabalho parou
   Uso: node ferramentas/harness-status.js
        npm run harness:status

   Primeira coisa que uma sessão nova roda. Recalcula o
   que é mutável — branch, HEAD, working tree — em vez de
   confiar no que algum handoff escreveu ontem.

   >>> Somente leitura. Não escreve arquivo, não chama rede,
       não pede credencial. Pode ser rodado sem medo em
       qualquer estado do repositório.
   =================================================== */

'use strict';

var fs = require('fs');
var path = require('path');
var execSync = require('child_process').execSync;

var RAIZ = path.join(__dirname, '..');

function git(cmd, seFalhar) {
  try {
    return execSync('git ' + cmd, {
      cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch (e) {
    return seFalhar === undefined ? '(indisponível)' : seFalhar;
  }
}

function ler(relativo) {
  var completo = path.join(RAIZ, relativo);
  return fs.existsSync(completo) ? fs.readFileSync(completo, 'utf8') : null;
}

/* ---------- GIT ---------- */

var sujo = git('status --porcelain', '');
var linhas = sujo ? sujo.split('\n') : [];

console.log('');
console.log('Repositório  ' + RAIZ);
console.log('Branch       ' + git('rev-parse --abbrev-ref HEAD'));
console.log('HEAD         ' + git('rev-parse --short HEAD') + '  ' +
            git('log -1 --format=%s').slice(0, 60));
console.log('Upstream     ' + git('rev-parse --abbrev-ref --symbolic-full-name @{u}',
                                  '(sem upstream)'));

var frente = git('rev-list --count @{u}..HEAD', '?');
var atras = git('rev-list --count HEAD..@{u}', '?');
if (frente !== '?' ) {
  console.log('Divergência  ' + frente + ' à frente, ' + atras + ' atrás do upstream');
}

console.log('Working tree ' + (linhas.length ? 'SUJO (' + linhas.length + ')' : 'limpo'));
linhas.slice(0, 12).forEach(function (l) { console.log('             ' + l); });
if (linhas.length > 12) console.log('             ... e mais ' + (linhas.length - 12));

/* ---------- HARNESS ---------- */

var bruto = ler('.harness/work-items.json');
if (!bruto) {
  console.log('\n.harness/work-items.json não existe. O Harness não está instalado.');
  process.exit(0);
}

var fila;
try {
  fila = JSON.parse(bruto);
} catch (e) {
  console.log('\n.harness/work-items.json não é JSON válido: ' + e.message);
  console.log('Rode `npm run harness:check` para o diagnóstico.');
  process.exit(0);
}

var itens = fila.items || [];
function porStatus(s) { return itens.filter(function (i) { return i.status === s; }); }

console.log('');
console.log('Missão       ' + (fila.mission || '(não declarada)'));

var atual = itens.filter(function (i) { return i.id === fila.current; })[0];
console.log('Item atual   ' + (atual ? atual.id + ' — ' + atual.title +
                                       '  [' + atual.status + ']'
                                     : '(nenhum)'));

['in_progress', 'ready', 'blocked_technical', 'blocked_human', 'done'].forEach(function (s) {
  var lista = porStatus(s);
  if (!lista.length) return;
  console.log('');
  console.log(s.toUpperCase() + ' (' + lista.length + ')');
  lista.forEach(function (i) {
    console.log('  ' + i.id.padEnd(14) + '[' + i.authority_class + '] ' + i.title);
    // O motivo do bloqueio importa mais que o bloqueio: sem ele, a
    // sessão seguinte tenta de novo e esbarra na mesma parede.
    if (i.blocker) console.log('  ' + ' '.repeat(14) + '↳ ' + i.blocker);
  });
});

var backlog = fila.backlog || [];
if (backlog.length) {
  console.log('');
  console.log('FUTURO (' + backlog.length + ') — fora desta missão, não executar');
  backlog.forEach(function (b) { console.log('  ' + b.id); });
}

console.log('');
console.log('Verify       npm run verificar');
console.log('Entrada      HARNESS.md');
console.log('');
