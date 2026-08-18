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

[DIR, path.join(RAIZ, 'painel'), path.join(RAIZ, 'produtos')].forEach(function (pasta) {
  if (!fs.existsSync(pasta)) return;
  fs.readdirSync(pasta)
    .filter(function (n) { return /\.(js|html|json)$/.test(n); })
    .forEach(function (n) { varrer(path.join(pasta, n)); });
});

/* ---------- CURRENCY COMPARED AS TEXT ---------- */
// Intl.NumberFormat('pt-BR') separates the symbol with a NON-BREAKING
// space (U+00A0), so brl(0) is "R$\u00a00,00" and never equals the
// "R$ 0,00" anyone types into a comparison. The test silently returns
// false forever, which is the worst kind of failure: no error, no alarm,
// just a branch that never runs.
//
// This shipped once — the holerite dropped zeroed rows by comparing the
// formatted string, so every payslip carried a dead "Outros descontos
// R$ 0,00" line. Compare the number instead.
var CIFRAO_LITERAL = /[=!]==?\s*(['"])R\$[^'"]*\1|(['"])R\$[^'"]*\2\s*[=!]==?/;

function varrerCifrao(arquivo) {
  var achados = [];
  ler(arquivo).split('\n').forEach(function (linha, i) {
    // Comentários que explicam a armadilha citam a comparação de propósito.
    // Um gate que dispara na própria documentação ensina todo mundo a
    // ignorar o gate.
    var t = linha.trim();
    if (t.indexOf('//') === 0 || t.indexOf('*') === 0 || t.indexOf('/*') === 0) return;
    if (CIFRAO_LITERAL.test(linha)) achados.push(i + 1);
  });

  // Uma checagem por arquivo, não por linha: contar linha a linha inflaria
  // o total em trinta vezes e transformaria o número final em ruído.
  exigir(
    achados.length === 0,
    'COMPARAÇÃO COM MOEDA FORMATADA em ' + path.relative(RAIZ, arquivo) +
    ', linha(s) ' + achados.join(', ') +
    '. Intl usa espaço não separável (U+00A0), então a comparação nunca casa. ' +
    'Compare o número, não o texto.'
  );
}

[DIR, path.join(RAIZ, 'painel'), path.join(RAIZ, 'produtos')].forEach(function (pasta) {
  if (!fs.existsSync(pasta)) return;
  fs.readdirSync(pasta)
    .filter(function (n) { return /\.(js|html)$/.test(n); })
    .forEach(function (n) { varrerCifrao(path.join(pasta, n)); });
});

/* ---------- O PRODUTO NÃO PODE TER SAÍDA DE REDE ---------- */
// A frase que vende o Folha Simples é que a folha não sai do computador
// do comprador. Isso está garantido por CSP, e CSP some fácil: basta
// alguém mexer no <head> sem saber o que aquela linha faz.
//
// Verificado no navegador de verdade em vez de só aqui: fetch, XHR e
// imagem remota, os três bloqueados. Este gate protege a diretiva.
(function () {
  var produto = path.join(RAIZ, 'produtos', 'folha-simples-fc86aa480de7f81c.html');
  if (!fs.existsSync(produto)) return;

  [produto, path.join(RAIZ, 'produtos', 'demo.html')].forEach(function (arquivo) {
    if (!fs.existsSync(arquivo)) return;
    var html = ler(arquivo);
    var rel = path.relative(RAIZ, arquivo);

    // Só o conteúdo da meta tag conta. Procurar as diretivas em qualquer
    // lugar do arquivo fazia o gate casar com o comentário que explica a
    // CSP logo acima dela — passava verde com a diretiva removida, que é
    // o pior defeito possível num gate: confiança falsa.
    var meta = html.match(
      /<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]*content=["']([\s\S]*?)["']\s*>/i);

    exigir(
      !!meta,
      rel + ' não tem meta tag de CSP. Sem ela, "os salários não saem do seu ' +
      'computador" volta a ser promessa em vez de garantia do navegador.'
    );
    if (!meta) return;

    var politica = meta[1];
    [['default-src', 'sem ele, todo canal não listado fica liberado'],
     ['connect-src', 'é o que impede exfiltração da folha por fetch ou XHR'],
     ['form-action', 'formulário é canal de saída como outro qualquer']
    ].forEach(function (d) {
      exigir(
        new RegExp(d[0] + "\\s+'none'").test(politica),
        rel + ": a CSP perdeu " + d[0] + " 'none' — " + d[1] + '.'
      );
    });
  });
})();

/* ---------- SUPERFÍCIE DE DEPENDÊNCIAS ---------- */
// O site publicado não carrega uma linha de JavaScript vinda do npm: as
// calculadoras e o produto são código próprio. Essa é a propriedade de
// segurança que mais importa aqui — não há cadeia de suprimentos para
// comprometer.
//
// O playwright existe só para os gates rodarem, e nunca chega ao
// navegador de um visitante. Se alguém algum dia adicionar uma
// dependência de produção, isso muda a superfície de ataque do site e
// tem de ser decisão consciente, não um `npm install` distraído.
(function () {
  var pkgPath = path.join(RAIZ, 'package.json');
  if (!fs.existsSync(pkgPath)) return;

  var pkg = JSON.parse(ler(pkgPath));
  var producao = Object.keys(pkg.dependencies || {});

  exigir(
    producao.length === 0,
    'O site ganhou dependência de produção: ' + producao.join(', ') + '. ' +
    'Um site estático que serve código de terceiros herda a cadeia de ' +
    'suprimentos dele. Se for intencional, ajuste esta checagem junto.'
  );

  exigir(
    fs.existsSync(path.join(RAIZ, 'package-lock.json')),
    'Falta o package-lock.json. Sem ele a CI resolve versões novas a cada ' +
    'execução e o npm audit não roda.'
  );
})();

/* ---------- RESULT ---------- */
console.log('\n' + '-'.repeat(52));
if (problemas.length === 0) {
  console.log(checagens + ' checagens de consistência passaram.');
  process.exit(0);
}

console.error(problemas.length + ' problema(s) de consistência:\n');
problemas.forEach(function (p) { console.error('  - ' + p); });
process.exit(1);
