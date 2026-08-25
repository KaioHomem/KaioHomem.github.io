/* ===================================================
   TESTES DA ENTREGA
   Uso: node worker/testes.js

   Exercita o Worker com a API do Stripe simulada. Nenhuma
   chamada real, nenhum cartão, nenhum centavo.

   >>> Por que Stripe falso e não a sandbox do Stripe.

   O que está sendo testado aqui é a NOSSA decisão de
   autorizar, não a API deles. Com o Stripe simulado dá
   para produzir de propósito a sessão que ninguém consegue
   produzir de propósito no painel — a paga do produto
   errado, a com metadata trocada, a de outra loja. São
   exatamente essas que decidem se o produto vaza.

   A sandbox continua sendo necessária, mas para outra
   pergunta: se o redirecionamento e o formato do
   session_id são o que a gente espera. Isso é passo de
   migração, e está no ATIVAR-VENDA.md.
   =================================================== */

'use strict';

var fs = require('fs');
var path = require('path');
var publico = require('../ferramentas/publico');

var RAIZ = path.join(__dirname, '..');

var falhas = [];
var feitos = 0;

function ok(nome) { feitos++; console.log('  ok      ' + nome); }
function falhou(nome, detalhe) {
  feitos++;
  falhas.push(nome + '\n      ' + detalhe);
  console.log('  FALHOU  ' + nome);
}

function conferir(nome, condicao, detalhe) {
  if (condicao) ok(nome); else falhou(nome, detalhe);
}

/* ---------- CARREGAR O WORKER ----------

   O Worker é um módulo ES que importa dois .html como texto — coisa
   que o Wrangler resolve no bundle e o Node não. Em vez de montar um
   empacotador só para o teste, o import vira leitura de arquivo e o
   resto do código roda como está escrito.

   O que isto NÃO testa é o empacotamento em si. Essa parte é coberta
   pelo `wrangler deploy --dry-run`, que roda no gate e falha se um
   import não resolver.                                              */
function carregarWorker() {
  var fonte = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');

  var base = fs.readFileSync(path.join(RAIZ, publico.PAGOS.base.arquivo), 'utf8');
  var completo = fs.readFileSync(path.join(RAIZ, publico.PAGOS.completo.arquivo), 'utf8');

  fonte = fonte
    .replace(/^import produtoBase.*$/m, 'const produtoBase = __BASE__;')
    .replace(/^import produtoCompleto.*$/m, 'const produtoCompleto = __COMPLETO__;')
    .replace(/^export default \{/m, 'module.exports = {');

  var modulo = { exports: {} };

  // `fetch` entra como indireção, não por valor. Passando `global.fetch`
  // direto, o Worker guardava a função que existia no momento da carga —
  // e trocar o Stripe simulado depois não o alcançava. O teste do Stripe
  // fora do ar passava contra o Stripe são, e passava verde.
  function fetchAtual() { return global.fetch.apply(null, arguments); }

  new Function('module', '__BASE__', '__COMPLETO__', 'fetch', 'Response', 'URL',
               'URLSearchParams', fonte)
    (modulo, base, completo, fetchAtual, global.Response, global.URL,
     global.URLSearchParams);

  return modulo.exports;
}

/* ---------- STRIPE SIMULADO ---------- */

var PRECO_BASE = 'price_teste_base';
var PRECO_COMPLETO = 'price_teste_completo';
var PRECO_OUTRO = 'price_teste_de_outro_produto';

var SESSOES = {
  // pagamento confirmado, produto base, tudo certo
  cs_test_base_paga_a1b2c3d4e5: {
    payment_status: 'paid',
    metadata: { app: 'folha-simples', produto: 'base' },
    line_items: { data: [{ price: { id: PRECO_BASE } }] }
  },
  // pagamento confirmado, build completo
  cs_test_completo_pago_f6g7h8: {
    payment_status: 'paid',
    metadata: { app: 'folha-simples', produto: 'completo' },
    line_items: { data: [{ price: { id: PRECO_COMPLETO } }] }
  },
  // criada mas não paga
  cs_test_nao_paga_i9j0k1l2m3: {
    payment_status: 'unpaid',
    metadata: { app: 'folha-simples', produto: 'base' },
    line_items: { data: [{ price: { id: PRECO_BASE } }] }
  },
  // paga, mas de outro produto qualquer da mesma conta Stripe
  cs_test_outro_produto_n4o5p6: {
    payment_status: 'paid',
    metadata: { app: 'outra-coisa', produto: 'base' },
    line_items: { data: [{ price: { id: PRECO_OUTRO } }] }
  },
  // paga, do Folha Simples, mas com metadata apontando para lugar nenhum
  cs_test_metadata_errada_q7r8: {
    payment_status: 'paid',
    metadata: { app: 'folha-simples', produto: 'premium-inexistente' },
    line_items: { data: [{ price: { id: PRECO_BASE } }] }
  },
  // O ATAQUE QUE IMPORTA: comprou o base de R$ 97 e a metadata foi
  // adulterada para pedir o completo de R$ 164. O preço não acompanha.
  cs_test_base_fingindo_s9t0u1: {
    payment_status: 'paid',
    metadata: { app: 'folha-simples', produto: 'completo' },
    line_items: { data: [{ price: { id: PRECO_BASE } }] }
  }
};

function instalarStripeFalso(opcoes) {
  opcoes = opcoes || {};
  global.fetch = function (url, init) {
    // A chave tem de chegar, sempre. Se um dia o Worker esquecer o
    // cabeçalho, o teste percebe aqui.
    var auth = (init && init.headers && init.headers.Authorization) || '';
    if (!/^Bearer .+/.test(auth)) {
      return Promise.resolve(new Response('{"error":"sem chave"}', { status: 401 }));
    }
    if (opcoes.cair) {
      return Promise.resolve(new Response('{"error":{"message":"acct_123 bloqueada"}}',
                                          { status: 500 }));
    }
    var id = decodeURIComponent(String(url).split('/sessions/')[1].split('?')[0]);
    var sessao = SESSOES[id];
    if (!sessao) {
      return Promise.resolve(new Response('{"error":"no such session"}', { status: 404 }));
    }
    return Promise.resolve(new Response(JSON.stringify(sessao), { status: 200 }));
  };
}

var ENV_OK = {
  STRIPE_SECRET_KEY: 'sk_test_naoeumachavedeverdade',
  PRECOS_BASE: PRECO_BASE,
  PRECOS_COMPLETO: PRECO_COMPLETO
};

function pedir(worker, caminho, sessao, env) {
  var url = 'https://folhasimples.example/api/' + caminho +
            (sessao === null ? '' : '?session_id=' + encodeURIComponent(sessao));
  return worker.fetch(new Request(url), env || ENV_OK);
}

/* ---------- EXECUÇÃO ---------- */

console.log('\nTESTES DA ENTREGA (Stripe simulado, nenhuma cobrança)\n');

instalarStripeFalso();
var worker = carregarWorker();

function corpoJson(r) { return r.json(); }

(async function () {

  /* --- 1. sessão inexistente --- */
  var r = await pedir(worker, 'baixar', 'cs_essa_nunca_existiu_123456');
  conferir('sessão inexistente responde 404', r.status === 404, 'veio ' + r.status);

  /* --- 2. sessão não paga --- */
  r = await pedir(worker, 'baixar', 'cs_test_nao_paga_i9j0k1l2m3');
  var j = await corpoJson(r);
  conferir('sessão não paga é recusada com 402 e motivo claro',
    r.status === 402 && j.motivo === 'nao_pago',
    'veio ' + r.status + ' / ' + j.motivo);

  /* --- 3. sessão paga do produto certo --- */
  r = await pedir(worker, 'baixar', 'cs_test_base_paga_a1b2c3d4e5');
  conferir('sessão paga do base entrega 200', r.status === 200, 'veio ' + r.status);

  var texto = await r.text();
  var baseReal = fs.readFileSync(path.join(RAIZ, publico.PAGOS.base.arquivo), 'utf8');
  conferir('o corpo entregue é o produto base, byte a byte',
    texto === baseReal, 'o corpo não bate com o arquivo do repositório');

  conferir('vem como download, com nome amigável',
    r.headers.get('content-disposition') === 'attachment; filename="folha-simples.html"',
    'veio ' + r.headers.get('content-disposition'));

  conferir('não é cacheado',
    /no-store/.test(r.headers.get('cache-control') || ''),
    'veio ' + r.headers.get('cache-control'));

  /* --- 4. sessão paga de OUTRO produto da mesma conta --- */
  r = await pedir(worker, 'baixar', 'cs_test_outro_produto_n4o5p6');
  j = await corpoJson(r);
  conferir('compra de outro produto da conta não destrava nada',
    r.status === 403 && j.motivo === 'outro_app',
    'veio ' + r.status + ' / ' + j.motivo);

  /* --- 5. metadata incorreta --- */
  r = await pedir(worker, 'baixar', 'cs_test_metadata_errada_q7r8');
  j = await corpoJson(r);
  conferir('metadata apontando para produto inexistente é recusada',
    r.status === 403 && j.motivo === 'produto_desconhecido',
    'veio ' + r.status + ' / ' + j.motivo);

  /* --- 6. comprou o base, tenta levar o completo --- */
  r = await pedir(worker, 'baixar', 'cs_test_base_fingindo_s9t0u1');
  j = await corpoJson(r);
  conferir('quem pagou o base NÃO recebe o completo, mesmo com a metadata trocada',
    r.status === 403 && j.motivo === 'preco_nao_confere',
    'veio ' + r.status + ' / ' + j.motivo);

  /* --- 6b. e o completo legítimo continua funcionando --- */
  r = await pedir(worker, 'baixar', 'cs_test_completo_pago_f6g7h8');
  var textoC = await r.text();
  var completoReal = fs.readFileSync(path.join(RAIZ, publico.PAGOS.completo.arquivo), 'utf8');
  conferir('quem pagou o completo recebe o completo',
    r.status === 200 && textoC === completoReal, 'veio ' + r.status);

  /* --- 6c. o navegador não escolhe o arquivo --- */
  // Se um dia alguém aceitar um parâmetro de produto, este teste cai.
  var url = 'https://folhasimples.example/api/baixar?session_id=cs_test_base_paga_a1b2c3d4e5&produto=completo';
  r = await worker.fetch(new Request(url), ENV_OK);
  var forcado = await r.text();
  conferir('parâmetro ?produto= na URL é ignorado — quem decide é a sessão',
    r.status === 200 && forcado === baseReal,
    'o parâmetro do navegador mudou o arquivo entregue');

  /* --- 7. ausência da chave do Stripe --- */
  r = await pedir(worker, 'baixar', 'cs_test_base_paga_a1b2c3d4e5', { PRECOS_BASE: PRECO_BASE });
  j = await corpoJson(r);
  conferir('sem STRIPE_SECRET_KEY recusa (falha fechada), não entrega',
    r.status === 503 && j.motivo === 'sem_configuracao',
    'veio ' + r.status + ' / ' + j.motivo);

  /* --- 7b. sem lista de preços também falha fechada --- */
  r = await pedir(worker, 'baixar', 'cs_test_base_paga_a1b2c3d4e5',
                  { STRIPE_SECRET_KEY: 'sk_test_x' });
  j = await corpoJson(r);
  conferir('sem lista de preços recusa em vez de liberar sem conferir',
    r.status === 503 && j.motivo === 'sem_precos',
    'veio ' + r.status + ' / ' + j.motivo);

  /* --- 8. entrada malformada --- */
  r = await pedir(worker, 'baixar', null);
  j = await corpoJson(r);
  conferir('sem session_id responde 400', r.status === 400 && j.motivo === 'sem_sessao',
    'veio ' + r.status + ' / ' + j.motivo);

  r = await pedir(worker, 'baixar', 'nao-e-uma-sessao');
  j = await corpoJson(r);
  conferir('session_id fora do formato do Stripe responde 400',
    r.status === 400 && j.motivo === 'sessao_malformada',
    'veio ' + r.status + ' / ' + j.motivo);

  /* --- 9. o endpoint de estado --- */
  r = await pedir(worker, 'status', 'cs_test_base_paga_a1b2c3d4e5');
  j = await corpoJson(r);
  conferir('status confirma o direito sem entregar o arquivo',
    r.status === 200 && j.ok === true && j.arquivo === 'folha-simples.html' &&
    JSON.stringify(j).indexOf('<html') === -1,
    'veio ' + JSON.stringify(j).slice(0, 120));

  /* --- 10. o Stripe fora do ar não vaza detalhe da conta --- */
  instalarStripeFalso({ cair: true });
  r = await pedir(worker, 'baixar', 'cs_test_base_paga_a1b2c3d4e5');
  var bruto = await r.text();
  conferir('erro do Stripe vira 502 sem repassar detalhe da conta',
    r.status === 502 && bruto.indexOf('acct_') === -1,
    'veio ' + r.status + ' / ' + bruto.slice(0, 120));
  instalarStripeFalso();

  /* --- 11. método errado --- */
  r = await worker.fetch(
    new Request('https://folhasimples.example/api/baixar?session_id=cs_test_base_paga_a1b2c3d4e5',
                { method: 'POST' }), ENV_OK);
  conferir('POST no endpoint responde 405', r.status === 405, 'veio ' + r.status);

  /* --- 12. o resto do site vai para os assets --- */
  var pedidoAsset = null;
  var envAssets = Object.assign({}, ENV_OK, {
    ASSETS: { fetch: function (req) { pedidoAsset = req.url; return new Response('site'); } }
  });
  r = await worker.fetch(new Request('https://folhasimples.example/ferramentas/'), envAssets);
  conferir('caminho que não é /api/ é servido pelos Static Assets',
    pedidoAsset === 'https://folhasimples.example/ferramentas/',
    'os assets receberam: ' + pedidoAsset);

  /* --- 13. nenhuma resposta carrega CORS aberto --- */
  // Mesma origem por desenho. Se um dia alguém colar um
  // Access-Control-Allow-Origin: * aqui, isto reprova.
  r = await pedir(worker, 'status', 'cs_test_base_paga_a1b2c3d4e5');
  conferir('nenhuma resposta traz Access-Control-Allow-Origin',
    !r.headers.get('access-control-allow-origin'),
    'veio ' + r.headers.get('access-control-allow-origin'));

  /* ---------- RESULTADO ---------- */

  console.log('\n' + '-'.repeat(52));
  if (falhas.length) {
    console.error('A ENTREGA NÃO ESTÁ CONFIÁVEL:\n');
    falhas.forEach(function (f) { console.error('  ' + f + '\n'); });
    process.exit(1);
  }
  console.log(feitos + '/' + feitos + ' testes da entrega passaram.');
  console.log('Nenhuma cobrança real: a API do Stripe foi simulada.');
})().catch(function (e) {
  console.error('\nO teste explodiu:', e && e.stack || e);
  process.exit(1);
});
