/* ===================================================
   CONSTRUTOR DO DIRETÓRIO PUBLICADO
   Uso: node ferramentas/gerar-dist.js
        node ferramentas/gerar-dist.js --verificar

   Copia para dist/ exatamente o que está no allowlist de
   publico.js, e nada mais. É esse diretório que o Worker
   serve como Static Assets.

   Com --verificar não escreve nada: só confere se o dist/
   no disco bate com o que seria gerado agora. Serve para a
   CI reprovar um build velho.

   >>> Este script apaga e reescreve o dist/ inteiro.

   É de propósito. Um build incremental deixa para trás o
   arquivo que saiu do allowlist ontem — e um arquivo que
   ninguém copiou mais, mas continua sendo servido, é
   exatamente o vazamento que o gate de publicação existe
   para pegar. Começar do zero torna o dist/ uma função pura
   do allowlist.
   =================================================== */

'use strict';

var fs = require('fs');
var path = require('path');
var publico = require('./publico');

var RAIZ = path.join(__dirname, '..');
var DIST = path.join(RAIZ, publico.DIST);
var verificando = process.argv.indexOf('--verificar') !== -1;

/* ---------- RESOLVER O ALLOWLIST EM ARQUIVOS ---------- */

function resolver() {
  var arquivos = [];
  var faltando = [];

  publico.ALLOWLIST.forEach(function (entrada) {
    if (typeof entrada === 'string') {
      if (!fs.existsSync(path.join(RAIZ, entrada))) {
        faltando.push(entrada);
        return;
      }
      arquivos.push(entrada);
      return;
    }

    // { dir: 'ferramentas/', apenas: /\.html$/ }
    var dir = entrada.dir.replace(/\/$/, '');
    var completo = path.join(RAIZ, dir);
    if (!fs.existsSync(completo)) {
      faltando.push(entrada.dir);
      return;
    }
    fs.readdirSync(completo, { withFileTypes: true }).forEach(function (e) {
      if (!e.isFile()) return;
      if (entrada.apenas && !entrada.apenas.test(e.name)) return;
      arquivos.push(dir + '/' + e.name);
    });
  });

  if (faltando.length) {
    console.error('O allowlist aponta para caminhos que não existem:\n  ' +
                  faltando.join('\n  '));
    console.error('\nOu o arquivo foi removido, ou o allowlist está desatualizado.');
    process.exit(1);
  }

  // Sem duplicatas: um caminho pode casar com uma regra de diretório e
  // estar listado à parte, e copiar duas vezes esconde o engano.
  return arquivos.filter(function (a, i) { return arquivos.indexOf(a) === i; }).sort();
}

/* ---------- A TRAVA QUE NÃO DEPENDE DE MIM ACERTAR ----------

   O allowlist é escrito à mão, e mão erra. Se alguém um dia
   adicionar `produtos/folha-simples-*.html` a ele — por engano, por
   copiar e colar, ou porque um glob cresceu — o build obedeceria em
   silêncio.

   Esta checagem roda ANTES de qualquer cópia e é independente do
   allowlist: ela olha a lista de arquivos pagos declarada em
   publico.js e recusa gerar. O gate de publicação também pega isso
   depois, e ter as duas não é redundância: esta impede o arquivo de
   ser escrito, aquela impede que ele passe.                       */
function recusarPagosNoAllowlist(arquivos) {
  var pagos = publico.paginasPagas();
  var intrusos = arquivos.filter(function (a) { return pagos.indexOf(a) !== -1; });
  if (intrusos.length) {
    console.error('O allowlist inclui arquivo pago:\n  ' + intrusos.join('\n  '));
    console.error('\nEsses arquivos nunca podem ser publicados. Build recusado.');
    process.exit(1);
  }
}

/* ---------- ESCREVER ---------- */

function apagar(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function copiar(arquivos) {
  arquivos.forEach(function (relativo) {
    var destino = path.join(DIST, relativo);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.copyFileSync(path.join(RAIZ, relativo), destino);
  });
}

/* ---------- CONFERIR ---------- */

function listarDist() {
  var achados = [];
  (function anda(dir) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir, { withFileTypes: true }).forEach(function (e) {
      var completo = path.join(dir, e.name);
      if (e.isDirectory()) anda(completo);
      else achados.push(path.relative(DIST, completo).split(path.sep).join('/'));
    });
  })(DIST);
  return achados.sort();
}

function conferir(esperados) {
  var noDisco = listarDist();
  var problemas = [];

  esperados.forEach(function (e) {
    if (noDisco.indexOf(e) === -1) problemas.push('falta no dist/: ' + e);
  });
  noDisco.forEach(function (d) {
    if (esperados.indexOf(d) === -1) problemas.push('sobra no dist/: ' + d);
  });

  // Conteúdo, não só presença: um dist/ com os nomes certos e o
  // conteúdo velho é pior que um incompleto, porque parece correto.
  esperados.forEach(function (e) {
    if (noDisco.indexOf(e) === -1) return;
    var origem = fs.readFileSync(path.join(RAIZ, e));
    var copia = fs.readFileSync(path.join(DIST, e));
    if (!origem.equals(copia)) problemas.push('desatualizado no dist/: ' + e);
  });

  return problemas;
}

/* ---------- EXECUÇÃO ---------- */

var arquivos = resolver();
recusarPagosNoAllowlist(arquivos);

if (verificando) {
  var problemas = conferir(arquivos);
  if (problemas.length) {
    console.error('O dist/ não está em dia com o allowlist:\n');
    problemas.forEach(function (p) { console.error('  ' + p); });
    console.error('\nRode: node ferramentas/gerar-dist.js');
    process.exit(1);
  }
  console.log('O dist/ está em dia: ' + arquivos.length + ' arquivos.');
} else {
  apagar(DIST);
  copiar(arquivos);
  console.log('dist/ gerado com ' + arquivos.length + ' arquivos.');
  console.log('Nenhum arquivo pago entrou — conferido antes de copiar.');
}
