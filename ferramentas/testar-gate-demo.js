/* ===================================================
   TESTE AO CONTRÁRIO DO GATE DA DEMONSTRAÇÃO
   Uso: node ferramentas/testar-gate-demo.js

   C8: gate crítico prova nos dois sentidos. Este guarda a
   fronteira entre o que é grátis e o que custa R$ 97 — se
   ele estiver cego, o produto vaza pela demo e ninguém fica
   sabendo.

   Testa também o que NÃO deve reprovar. Um gate que reprova
   demais é abandonado, e gate abandonado não protege nada.

   >>> Restaura em `finally`, sempre.
   =================================================== */

'use strict';

var fs = require('fs');
var path = require('path');
var { spawnSync } = require('child_process');
var publico = require('./publico');

var RAIZ = path.join(__dirname, '..');
var GATE = path.join(__dirname, 'verificar-demo.js');
var DEMO = path.join(RAIZ, 'produtos/demo.html');
var BASE = path.join(RAIZ, publico.PAGOS.base.arquivo);

var falhas = [];
var feitos = 0;

function rodar() {
  var r = spawnSync(process.execPath, [GATE], { encoding: 'utf8' });
  return { codigo: r.status, saida: (r.stdout || '') + (r.stderr || '') };
}

function exigirReprovacao(nome, trecho) {
  feitos++;
  var r = rodar();
  if (r.codigo === 0) { falhas.push(nome + ': PASSOU quando deveria reprovar.'); return; }
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
    falhas.push(nome + ': REPROVOU.\n      ' +
                r.saida.trim().split('\n').slice(-3).join(' | '));
    return;
  }
  console.log('  ok      ' + nome);
}

function mexendoEm(arquivo, mutar, fn) {
  var original = fs.readFileSync(arquivo, 'utf8');
  try {
    fs.writeFileSync(arquivo, mutar(original), 'utf8');
    fn();
  } finally {
    fs.writeFileSync(arquivo, original, 'utf8');
  }
}

console.log('\nTESTE AO CONTRÁRIO DO GATE DA DEMONSTRAÇÃO\n');

spawnSync(process.execPath, [path.join(RAIZ, 'produtos/gerar-demo.js')]);

exigirAprovacao('demo legítima passa (o gate não reprova sempre)');

/* --- 1. capacidade paga injetada de volta --- */
mexendoEm(DEMO, function (s) {
  return s.replace('</script>', 'function decimoTerceiroDe(f){ return {}; }\n</script>');
}, function () {
  exigirReprovacao('pega capacidade paga injetada na demo', 'CAPACIDADE PAGA NA DEMO');
});

/* --- 2. o modo pago recolocado no seletor --- */
mexendoEm(DEMO, function (s) {
  return s.replace('<option value="mensal">',
                   '<option value="decimo">13º salário</option>\n<option value="mensal">');
}, function () {
  exigirReprovacao('pega o modo pago recolocado no seletor', 'CAPACIDADE PAGA NA DEMO');
});

/* --- 3. sintaxe quebrada pelo corte ---
   Foi o defeito real que apareceu construindo isto: uma sentinela mal
   posta gerou `mensal: };` e todos os outros gates continuaram verdes,
   porque nenhum executava o script. */
mexendoEm(DEMO, function (s) {
  return s.replace('var CAMPOS_POR_MODO = {', 'var CAMPOS_POR_MODO = { mensal:');
}, function () {
  exigirReprovacao('pega JavaScript quebrado pelo corte',
                   'A DEMO NÃO É JAVASCRIPT VÁLIDO');
});

/* --- 4. demo esvaziada ---
   Sem esta checagem, apagar o arquivo satisfaria "sem capacidade paga". */
mexendoEm(DEMO, function (s) {
  return s.replace(/function folhaDe\(/, 'function naoFacoNada(');
}, function () {
  exigirReprovacao('pega demo que deixou de demonstrar', 'precisa continuar fazendo a folha');
});

/* --- 5. marca d'água removida --- */
mexendoEm(DEMO, function (s) {
  return s.split('marca-demo').join('marca-neutra');
}, function () {
  exigirReprovacao('pega a marca d\'água removida', 'perdeu a marca');
});

/* --- 6. cegueira: as sentinelas somem do produto ---
   Se alguém apagar as marcações, o gate deixa de ter o que comparar. Ele
   precisa perceber isso em vez de passar por não achar nada. */
mexendoEm(BASE, function (s) {
  return s.split('/*«PAGO»*/').join('').split('/*«/PAGO»*/').join('');
}, function () {
  exigirReprovacao('percebe a própria cegueira quando as marcações somem',
                   'nenhuma região marcada como paga');
});

/* ---------- O QUE NÃO PODE REPROVAR ----------

   A proteção agora é a ausência do código, não o limite nem o flag.
   Mexer neles não devolve capacidade nenhuma — e o gate não deve fingir
   que devolve, senão vira alarme que ninguém escuta.                  */

mexendoEm(DEMO, function (s) {
  return s.replace(/DEMO=\{limite:\d+\}/, 'DEMO={limite:9999}');
}, function () {
  exigirAprovacao('subir o limite para 9999 não devolve 13º nem férias');
});

exigirAprovacao('tudo restaurado, o gate volta a passar');

console.log('\n' + '-'.repeat(52));
if (falhas.length) {
  console.error('O GATE DA DEMO NÃO É CONFIÁVEL:\n');
  falhas.forEach(function (f) { console.error('  ' + f + '\n'); });
  process.exit(1);
}
console.log(feitos + '/' + feitos + ' testes ao contrário da demo passaram.');
console.log('A demo não vira produto por edição — não há o que reativar.');
