/* ===================================================
   GERADOR DA DEMONSTRAÇÃO
   Uso: node produtos/gerar-demo.js
        node produtos/gerar-demo.js --verificar

   Escreve produtos/demo.html a partir do produto, trocando
   uma linha: o gancho `var DEMO=null`.

   Por que gerar em vez de escrever à mão: a demo carrega o
   mesmo motor fiscal do produto. Duas cópias mantidas
   separadamente divergem — e uma demo que calcula diferente
   do produto é pior que demo nenhuma, porque ensina o
   comprador a desconfiar da conta.

   Com --verificar não escreve nada: compara o arquivo
   commitado com o que seria gerado agora e falha se
   estiverem diferentes. É esse modo que roda na CI.
   =================================================== */

'use strict';

var fs = require('fs');
var path = require('path');

var DIR = __dirname;
var PRODUTO = path.join(DIR, 'folha-simples-fc86aa480de7f81c.html');
var DESTINO = path.join(DIR, 'demo.html');

var LIMITE = 2;

var origem = fs.readFileSync(PRODUTO, 'utf8');

var GANCHO = 'var DEMO=null; /* gancho-demo */';
if (origem.indexOf(GANCHO) === -1) {
  console.error('Não achei o gancho da demo no produto. Alguém mexeu na linha\n' +
                '  ' + GANCHO + '\nSem ela a demo não pode ser gerada.');
  process.exit(1);
}

var demo = origem.replace(GANCHO, 'var DEMO={limite:' + LIMITE + '};');

// A demo é uma página pública do site: precisa ser encontrável pelo
// comprador e ignorada pelo Google, que já indexa a página de venda.
demo = demo.replace(
  '<title>',
  '<meta name="robots" content="noindex, nofollow">\n<title>Demonstração — '
);

// Uma faixa fixa no topo, para ninguém confundir a demo com o produto
// nem sair achando que comprou.
var FAIXA =
  '<div class="faixa-demo naoimprime">' +
    '<strong>Você está na demonstração.</strong> Ela vai até ' + LIMITE +
    ' funcionários e marca os holerites. Todo o resto é igual — o cálculo é o mesmo. ' +
    '<a href="folha-de-pagamento.html">Ver a versão completa →</a>' +
  '</div>';

var ESTILO_FAIXA =
  '.faixa-demo{background:#1f2937;border-bottom:1px solid #374151;color:#e5e7eb;' +
  'padding:.75rem 1rem;font-size:.86rem;text-align:center;line-height:1.5}' +
  '.faixa-demo a{color:#60a5fa;font-weight:600;white-space:nowrap}' +
  '.faixa-demo strong{color:#fff}\n';

demo = demo.replace('.marca{font-weight:700', ESTILO_FAIXA + '.marca{font-weight:700');
demo = demo.replace('<body>', '<body>\n\n' + FAIXA);

if (process.argv.indexOf('--verificar') !== -1) {
  if (!fs.existsSync(DESTINO)) {
    console.error('produtos/demo.html não existe. Rode: node produtos/gerar-demo.js');
    process.exit(1);
  }
  var atual = fs.readFileSync(DESTINO, 'utf8');
  if (atual !== demo) {
    console.error('produtos/demo.html está desatualizado em relação ao produto.\n' +
                  'Rode: node produtos/gerar-demo.js  — e commite o resultado.');
    process.exit(1);
  }
  console.log('A demo está em dia com o produto.');
  process.exit(0);
}

fs.writeFileSync(DESTINO, demo, 'utf8');
console.log('produtos/demo.html gerado — limite de ' + LIMITE + ' funcionários.');
