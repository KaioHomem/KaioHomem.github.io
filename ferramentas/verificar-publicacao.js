/* ===================================================
   GATE DE PUBLICAÇÃO — nada pago no dist/
   Uso: node ferramentas/verificar-publicacao.js

   Reprova se o produto pago aparecer no diretório que vai
   para a internet. É o último obstáculo entre um deploy
   distraído e entregar de graça o que custa R$ 97.

   Por que ele precisa existir: até hoje não havia build. A
   raiz do repositório ERA o site, e a única proteção era o
   arquivo ter um hash no nome. Agora existe um passo que
   copia arquivos para dist/ — e passo de cópia é
   exatamente o tipo de coisa que um dia copia demais.

   >>> Três checagens independentes, porque cada uma falha
       de um jeito diferente.

   1. NOME     — pega o caso óbvio: folha-simples*.html no dist/.
                 Não sobrevive a um arquivo renomeado.

   2. CONTEÚDO — pega o arquivo renomeado: compara o hash SHA-256
                 do conteúdo. Uma cópia com outro nome tem o mesmo
                 hash. Não sobrevive a um byte alterado.

   3. TRECHO   — pega a colagem parcial: procura as assinaturas do
                 módulo de rescisão dentro de qualquer arquivo do
                 dist/. Sobrevive a renomear e a editar as bordas.

   Nenhuma das três sozinha basta, e é por isso que são três.
   =================================================== */

'use strict';

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var publico = require('./publico');

var RAIZ = path.join(__dirname, '..');
var DIST = path.join(RAIZ, publico.DIST);

var problemas = [];
var checagens = 0;

function exigir(condicao, mensagem) {
  checagens++;
  if (!condicao) problemas.push(mensagem);
}

if (!fs.existsSync(DIST)) {
  console.error('Não existe dist/. Rode: node ferramentas/gerar-dist.js');
  process.exit(1);
}

/* ---------- INVENTÁRIO DO QUE SERÁ PUBLICADO ---------- */

var arquivos = [];
(function anda(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (e) {
    var completo = path.join(dir, e.name);
    if (e.isDirectory()) anda(completo);
    else arquivos.push(completo);
  });
})(DIST);

if (!arquivos.length) {
  console.error('O dist/ está vazio. Isso não é um build.');
  process.exit(1);
}

/* ---------- 1. POR NOME ---------- */

arquivos.forEach(function (completo) {
  var nome = path.basename(completo);
  exigir(!/^folha-simples.*\.html$/i.test(nome),
    'PRODUTO PAGO NO DIST (nome): ' + path.relative(DIST, completo));
});

/* ---------- 2. POR CONTEÚDO EXATO ---------- */

function sha(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

var hashesPagos = {};
Object.keys(publico.PAGOS).forEach(function (chave) {
  var origem = path.join(RAIZ, publico.PAGOS[chave].arquivo);
  if (!fs.existsSync(origem)) {
    console.error('Não achei o produto declarado em publico.js: ' +
                  publico.PAGOS[chave].arquivo);
    process.exit(1);
  }
  hashesPagos[sha(fs.readFileSync(origem))] = publico.PAGOS[chave].arquivo;
});

arquivos.forEach(function (completo) {
  var h = sha(fs.readFileSync(completo));
  exigir(!hashesPagos[h],
    'PRODUTO PAGO NO DIST (conteúdo idêntico a ' + hashesPagos[h] + ', renomeado para ' +
    path.relative(DIST, completo) + ')');
});

/* ---------- 3. POR TRECHO ---------- */

// Só faz sentido procurar em arquivo de texto. Uma .webp que por acaso
// contenha os bytes de "custoDemissaoDe" seria um falso positivo, e
// falso positivo em gate treina todo mundo a ignorá-lo.
var TEXTO = /\.(html|js|css|json|txt|xml|md|svg)$/i;

arquivos.filter(function (a) { return TEXTO.test(a); }).forEach(function (completo) {
  var conteudo = fs.readFileSync(completo, 'utf8');
  publico.ASSINATURAS.forEach(function (assinatura) {
    exigir(conteudo.indexOf(assinatura) === -1,
      'MÓDULO PAGO NO DIST: "' + assinatura + '" aparece em ' +
      path.relative(DIST, completo));
  });
});

/* ---------- 4. AS ASSINATURAS AINDA EXISTEM? ----------

   Um gate que procura por um trecho que ninguém mais escreve passa
   sempre — e passa por estar cego, não por estar tudo certo. Se
   alguém renomear `montarTermoRescisao`, a busca continua rodando e
   continua não achando nada, para sempre.

   Por isso: cada assinatura precisa existir no produto pago. Se não
   existir, o gate reprova a si mesmo.                             */
var completo = fs.readFileSync(
  path.join(RAIZ, publico.PAGOS.completo.arquivo), 'utf8');

publico.ASSINATURAS.forEach(function (assinatura) {
  exigir(completo.indexOf(assinatura) !== -1,
    'ASSINATURA MORTA: "' + assinatura + '" não existe mais no produto pago. ' +
    'O gate está procurando por algo que ninguém escreve — corrija a lista ' +
    'em publico.js em vez de deixá-lo passar cego.');
});

/* ---------- 5. O SITEMAP E O ROBOTS SÓ FALAM DO PÚBLICO ---------- */

var sitemap = path.join(DIST, 'sitemap.xml');
if (fs.existsSync(sitemap)) {
  var xml = fs.readFileSync(sitemap, 'utf8');
  exigir(xml.indexOf('folha-simples') === -1,
    'O sitemap publicado cita o produto pago.');
  exigir(xml.indexOf('obrigado') === -1,
    'O sitemap publicado cita uma página de entrega, que é noindex.');
}

var robots = path.join(DIST, 'robots.txt');
if (fs.existsSync(robots)) {
  var txt = fs.readFileSync(robots, 'utf8');
  // Disallow anuncia o caminho para quem lê o robots.txt. Enquanto o
  // arquivo era servido, valia a pena tirá-lo da busca; agora que ele
  // não é servido, a linha só ensina onde ele ficava.
  exigir(txt.indexOf('folha-simples') === -1,
    'O robots.txt publicado ainda cita o caminho do produto pago. ' +
    'Ele não é mais servido, então a linha virou só um anúncio de onde procurar.');
}

/* ---------- RESULTADO ---------- */

console.log('\nArquivos no dist/: ' + arquivos.length);

if (problemas.length) {
  console.error('\n' + '-'.repeat(52));
  console.error('VAZAMENTO. O build não pode ir para a internet:\n');
  problemas.forEach(function (p) { console.error('  ' + p); });
  console.error('');
  process.exit(1);
}

console.log('\n' + '-'.repeat(52));
console.log(checagens + ' checagens de publicação passaram. Nada pago no dist/.');
