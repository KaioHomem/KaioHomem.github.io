/* ===================================================
   GERADOR DA DEMONSTRAÇÃO
   Uso: node produtos/gerar-demo.js
        node produtos/gerar-demo.js --verificar

   Escreve produtos/demo.html a partir do produto base,
   REMOVENDO o que é capacidade paga.

   >>> Por que remover, e não desligar por flag.

   A versão anterior deste arquivo trocava uma linha —
   `var DEMO=null` por `var DEMO={limite:2}` — e não tirava
   nada. A demo era o produto inteiro com um teto por cima,
   e devolver a linha ao original entregava o produto de
   R$ 97 completo. Foi medido: não havia um único
   identificador ou frase do base ausente da demo.

   Trava que se desfaz num editor de texto não é trava, é
   encenação. Agora o 13º e as férias — a capacidade que o
   base vende além do que a demo mostra — saem do arquivo.
   Não há o que reativar porque não há o que esteja
   desligado.

   O que continua: folha mensal completa, com as mesmas
   contas, o mesmo layout e o mesmo holerite. A demo
   demonstra; ela só não faz tudo.

   Ver .harness/CONSTITUTION.md, C3 e C10.
   =================================================== */

'use strict';

var fs = require('fs');
var path = require('path');

var DIR = __dirname;
var ORIGEM = path.join(DIR, 'folha-simples-fc86aa480de7f81c.html');
var DESTINO = path.join(DIR, 'demo.html');

var LIMITE = 2;

/* ---------- AS REGIÕES PAGAS ----------

   O produto base marca com sentinelas tudo que existe só por causa do
   13º e das férias: as opções do seletor, as seis funções de cálculo,
   render e recibo, os dois despachos, as DUAS listas brancas de modo, os
   campos e os dois ramos do aviso.

   A contagem esperada é o que impede o erro silencioso. Se alguém
   apagar uma sentinela ao editar o produto, o número muda e este
   gerador recusa — em vez de publicar uma demo com capacidade paga
   dentro.                                                            */
var ABRE = '/*«PAGO»*/';
var FECHA = '/*«/PAGO»*/';
var REGIOES_ESPERADAS = 18;

var origem = fs.readFileSync(ORIGEM, 'utf8');

var abertas = origem.split(ABRE).length - 1;
var fechadas = origem.split(FECHA).length - 1;

if (abertas !== fechadas) {
  console.error('Sentinelas desbalanceadas no produto: ' + abertas + ' aberturas ' +
                'para ' + fechadas + ' fechamentos.');
  console.error('Alguém editou o produto e deixou uma região pela metade.');
  process.exit(1);
}

if (abertas !== REGIOES_ESPERADAS) {
  console.error('O produto tem ' + abertas + ' regiões pagas marcadas; ' +
                'este gerador espera ' + REGIOES_ESPERADAS + '.');
  console.error('\nSe a mudança foi deliberada, atualize REGIOES_ESPERADAS aqui.');
  console.error('Se não foi, uma capacidade paga acabou de deixar de ser removida\n' +
                'da demonstração — e ninguém teria percebido sem esta conta.');
  process.exit(1);
}

/* Remove cada região, incluindo as sentinelas. Não-guloso: uma região
   termina no PRIMEIRO fechamento, não no último do arquivo. */
var demo = origem;
var corte = new RegExp(
  ABRE.replace(/[*/]/g, '\\$&') + '[\\s\\S]*?' + FECHA.replace(/[*/]/g, '\\$&'), 'g');
demo = demo.replace(corte, '');

if (demo.indexOf(ABRE) !== -1 || demo.indexOf(FECHA) !== -1) {
  console.error('Sobrou sentinela na demo depois do corte. O recorte falhou.');
  process.exit(1);
}

/* ---------- O QUE A DEMO GANHA ----------

   O limite de funcionários e a marca d'água continuam. Eles nunca foram
   a proteção — são higiene: impedem que alguém confunda a demonstração
   com o produto e saia usando o holerite como recibo de verdade.     */
var GANCHO = 'var DEMO=null; /* gancho-demo */';
if (demo.indexOf(GANCHO) === -1) {
  console.error('Não achei o gancho da demo no produto:\n  ' + GANCHO);
  process.exit(1);
}
demo = demo.replace(GANCHO, 'var DEMO={limite:' + LIMITE + '};');

// A demo é uma página pública do site: precisa ser encontrável pelo
// comprador e ignorada pelo Google, que já indexa a página de venda.
demo = demo.replace(
  '<title>',
  '<meta name="robots" content="noindex, nofollow">\n<title>Demonstração — '
);

// Uma faixa fixa no topo, para ninguém confundir a demo com o produto
// nem sair achando que comprou. O texto diz o que falta, porque agora
// falta de verdade — não é um limite que se remove.
var FAIXA =
  '<div class="faixa-demo naoimprime"><p>' +
    '<strong>Você está na demonstração.</strong> Ela faz a folha mensal de até ' +
    LIMITE + ' funcionários. O 13º salário e as férias estão na versão completa. ' +
    '<a href="folha-de-pagamento.html">Ver o programa completo</a>' +
  '</p></div>\n';

var ESTILO_FAIXA =
  '.faixa-demo{background:var(--bg3);border-bottom:1px solid var(--bd);color:var(--tx);' +
  'padding:.7rem 1rem;font-size:var(--t-micro)}' +
  '.faixa-demo p{max-width:var(--medida);margin:0 auto;text-align:center}' +
  '.faixa-demo a{color:var(--ac);font-weight:600;white-space:nowrap}' +
  '.faixa-demo strong{color:var(--tx)}\n';

demo = demo.replace('.marca{font-weight:700', ESTILO_FAIXA + '.marca{font-weight:700');
demo = demo.replace('<body>', '<body>\n\n' + FAIXA);

/* ---------- ESCREVER OU CONFERIR ---------- */

if (process.argv.indexOf('--verificar') !== -1) {
  var noDisco = fs.existsSync(DESTINO) ? fs.readFileSync(DESTINO, 'utf8') : '';
  if (noDisco !== demo) {
    console.error('A demo no disco não é a que seria gerada agora.');
    console.error('Rode: node produtos/gerar-demo.js');
    process.exit(1);
  }
  console.log('A demo está em dia com o produto.');
} else {
  fs.writeFileSync(DESTINO, demo, 'utf8');
  console.log('produtos/demo.html gerado.');
  console.log(REGIOES_ESPERADAS + ' regiões pagas removidas — ' +
              'não desligadas, removidas.');
}
