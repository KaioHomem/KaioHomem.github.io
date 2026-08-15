/* ===================================================
   CONSISTENCY CHECK
   Run: node ferramentas/verificar-consistencia.js
   Exit code 1 on any inconsistency (CI gate).

   The list of calculators lives in four places that have
   to agree: the nav in app.js, the cards on the hub, the
   sitemap, and the pages themselves. Nothing enforced
   that agreement, so adding a tool and forgetting one
   spot produced a page that exists but is unreachable —
   invisible to users and to search engines alike.

   This turns that class of mistake into a failed build.
   =================================================== */

'use strict';

var fs = require('fs');
var path = require('path');

var DIR = __dirname;
var RAIZ = path.join(DIR, '..');

var problemas = [];
var checagens = 0;

function exigir(condicao, mensagem) {
  checagens++;
  if (!condicao) problemas.push(mensagem);
}

function ler(arquivo) {
  return fs.readFileSync(arquivo, 'utf8');
}

/* ---------- SOURCE OF TRUTH: the nav list in app.js ---------- */
var app = ler(path.join(DIR, 'app.js'));
var bloco = app.match(/var FERRAMENTAS = \[([\s\S]*?)\];/);
if (!bloco) {
  console.error('Não encontrei a lista FERRAMENTAS em app.js.');
  process.exit(1);
}

var ferramentas = [];
var re = /\{\s*id:\s*'([^']+)'\s*,\s*arquivo:\s*'([^']+)'\s*,\s*nome:\s*'([^']+)'/g;
var m;
while ((m = re.exec(bloco[1])) !== null) {
  ferramentas.push({ id: m[1], arquivo: m[2], nome: m[3] });
}

exigir(ferramentas.length > 0, 'A lista FERRAMENTAS ficou vazia.');
console.log('Ferramentas declaradas em app.js: ' + ferramentas.length);
ferramentas.forEach(function (f) { console.log('  - ' + f.nome + ' (' + f.arquivo + ')'); });

var hub = ler(path.join(DIR, 'index.html'));
var sitemap = ler(path.join(DIR, 'gerar-sitemap.js'));

/* ---------- PER-TOOL CHECKS ---------- */
ferramentas.forEach(function (f) {
  var caminho = path.join(DIR, f.arquivo);

  if (!fs.existsSync(caminho)) {
    exigir(false, f.arquivo + ' está na navegação mas o arquivo não existe.');
    return;
  }
  checagens++;

  var pagina = ler(caminho);

  exigir(
    pagina.indexOf('data-ferramenta="' + f.id + '"') > -1,
    f.arquivo + ' não declara data-ferramenta="' + f.id + '" — o link ativo e os blocos de afiliado dependem disso.'
  );

  exigir(
    hub.indexOf('href="' + f.arquivo + '"') > -1,
    f.arquivo + ' não aparece no hub (ferramentas/index.html). A página existiria sem caminho até ela.'
  );

  exigir(
    sitemap.indexOf("'ferramentas/" + f.arquivo + "'") > -1,
    f.arquivo + ' está fora do gerar-sitemap.js — o Google não vai descobrir a página.'
  );

  // The consent gate only works if it is defined before monetizacao.js runs.
  var posConsent = pagina.indexOf('consentimento.js');
  var posMonet = pagina.indexOf('monetizacao.js');
  exigir(
    posConsent > -1 && posMonet > -1 && posConsent < posMonet,
    f.arquivo + ': consentimento.js precisa vir antes de monetizacao.js, senão o portão de cookies não segura o AdSense.'
  );

  // Pages that rank need the basics; a missing canonical splits ranking
  // between duplicate URLs.
  exigir(
    pagina.indexOf('rel="canonical"') > -1,
    f.arquivo + ' está sem link canonical.'
  );
  exigir(
    /<meta name="description" content="[^"]{50,}"/.test(pagina),
    f.arquivo + ' está sem meta description utilizável (mínimo de 50 caracteres).'
  );
  exigir(
    (pagina.match(/<h1[\s>]/g) || []).length === 1,
    f.arquivo + ' precisa de exatamente um <h1>.'
  );
  exigir(
    pagina.indexOf('"@type": "WebApplication"') > -1,
    f.arquivo + ' está sem o JSON-LD de WebApplication.'
  );
});

/* ---------- REVERSE CHECK: orphan pages ---------- */
var declarados = ferramentas.map(function (f) { return f.arquivo; });
var ignorar = ['index.html'];

fs.readdirSync(DIR)
  .filter(function (nome) {
    return /\.html$/.test(nome) && ignorar.indexOf(nome) === -1;
  })
  .forEach(function (nome) {
    exigir(
      declarados.indexOf(nome) > -1,
      nome + ' existe em ferramentas/ mas não está na navegação — página órfã.'
    );
  });

/* ---------- SITE-WIDE ---------- */
exigir(fs.existsSync(path.join(RAIZ, 'privacidade.html')),
  'privacidade.html não existe — o AdSense exige política de privacidade para aprovar o site.');
exigir(fs.existsSync(path.join(RAIZ, 'robots.txt')), 'robots.txt não existe.');
exigir(fs.existsSync(path.join(RAIZ, 'sitemap.xml')), 'sitemap.xml não existe — rode gerar-sitemap.js.');

if (fs.existsSync(path.join(RAIZ, 'sitemap.xml'))) {
  var xml = ler(path.join(RAIZ, 'sitemap.xml'));
  ferramentas.forEach(function (f) {
    exigir(
      xml.indexOf('/ferramentas/' + f.arquivo) > -1,
      f.arquivo + ' não está no sitemap.xml gerado. Rode: node ferramentas/gerar-sitemap.js'
    );
  });
}

/* ---------- SECRETS ---------- */
// This repository is public and git history is forever, so a committed
// secret is a leaked secret. Publisher ids and OAuth *client* ids are
// deliberately not checked: they are public by design, and flagging them
// would fire on correct configuration and train everyone to ignore the
// alarm. Only genuinely secret shapes are matched here.
var SEGREDOS = [
  { nome: 'token do GitHub',        padrao: /\b(ghp|gho|ghu|ghs)_[A-Za-z0-9]{30,}\b/ },
  { nome: 'token fine-grained do GitHub', padrao: /\bgithub_pat_[A-Za-z0-9_]{30,}\b/ },
  { nome: 'client secret do Google', padrao: /\bGOCSPX-[A-Za-z0-9_-]{10,}\b/ },
  { nome: 'chave de API do Google',  padrao: /\bAIza[A-Za-z0-9_-]{30,}\b/ },
  { nome: 'chave privada',           padrao: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ }
];

function varrer(arquivo) {
  var conteudo = ler(arquivo);
  SEGREDOS.forEach(function (s) {
    exigir(
      !s.padrao.test(conteudo),
      'POSSÍVEL SEGREDO EXPOSTO: ' + s.nome + ' em ' + path.relative(RAIZ, arquivo) +
      '. O repositório é público — troque a credencial antes de qualquer coisa.'
    );
  });
}

[DIR, path.join(RAIZ, 'painel')].forEach(function (pasta) {
  if (!fs.existsSync(pasta)) return;
  fs.readdirSync(pasta)
    .filter(function (n) { return /\.(js|html|json)$/.test(n); })
    .forEach(function (n) { varrer(path.join(pasta, n)); });
});

/* ---------- RESULT ---------- */
console.log('\n' + '-'.repeat(52));
if (problemas.length === 0) {
  console.log(checagens + ' checagens de consistência passaram.');
  process.exit(0);
}

console.error(problemas.length + ' problema(s) de consistência:\n');
problemas.forEach(function (p) { console.error('  - ' + p); });
process.exit(1);
