/* ===================================================
   GERADOR DO BUILD COMPLETO
   Uso: node produtos/gerar-completo.js
        node produtos/gerar-completo.js --verificar

   Escreve produtos/folha-simples-completo-<hash>.html a
   partir do build base, injetando o módulo de rescisão.

   Por que dois arquivos e não um com trava: o comprador
   baixa o HTML e pode abrir num editor. `if (comprou)` é
   uma linha que qualquer pessoa apaga. Quem compra o
   módulo recebe outro arquivo, e o base não contém o
   código do módulo em lugar nenhum.

   Com --verificar não escreve nada: compara o arquivo
   commitado com o que seria gerado agora e falha se
   estiverem diferentes. É esse modo que roda na CI.
   =================================================== */

'use strict';

var fs = require('fs');
var path = require('path');

var DIR = __dirname;
var BASE = path.join(DIR, 'folha-simples-fc86aa480de7f81c.html');
var MODULO = path.join(DIR, 'modulo-rescisao.js');
var MODULO_UI = path.join(DIR, 'modulo-rescisao-ui.js');
var DESTINO = path.join(DIR, 'folha-simples-completo-fc86aa480de7f81c.html');

var base = fs.readFileSync(BASE, 'utf8');
var modulo = fs.readFileSync(MODULO, 'utf8');
var moduloUi = fs.readFileSync(MODULO_UI, 'utf8');

// O cabeçalho de cada módulo explica a arquitetura para quem lê o
// repositório. Dentro do produto só ocuparia espaço, então sai.
var semCabecalho = /^\/\* =+[\s\S]*?=+ \*\/\n\n/;
modulo = modulo.replace(semCabecalho, '');
moduloUi = moduloUi.replace(semCabecalho, '');

function trocar(texto, de, para, oque) {
  if (texto.indexOf(de) === -1) {
    console.error('Não achei o ponto de injeção: ' + oque);
    process.exit(1);
  }
  if (texto.split(de).length > 2) {
    console.error('Ponto de injeção ambíguo (aparece mais de uma vez): ' + oque);
    process.exit(1);
  }
  // Função em vez de string na substituição, e isto não é preciosismo:
  // numa string de substituição o JavaScript trata `$'` como "todo o
  // texto depois do trecho encontrado", `$&` como o próprio trecho, e
  // assim por diante. O módulo de rescisão tem um `.replace('R$','')`
  // no meio — a sequência `$'` está ali dentro — e injetá-lo como
  // string duplicava metade do produto silenciosamente. Com função, o
  // texto entra literal.
  return texto.replace(de, function () { return para; });
}

var completo = base;

// 1) O motor, antes do marcador onde o gate de paridade corta.
var MARCADOR = '/* ---------- FORMATO E ENTRADA ---------- */';
completo = trocar(completo, MARCADOR,
  '/* ---------- RESCISÃO ---------- */\n' + modulo + '\n' + MARCADOR,
  'motor');

// 2) A opção no seletor de modo.
completo = trocar(completo,
  '<option value="ferias">Férias</option>\n/*«/PAGO»*/',
  '<option value="ferias">Férias</option>\n/*«/PAGO»*/        <option value="rescisao">Rescisão</option>\n',
  'opção de modo');

// 3) O painel, entre o cadastro e o resumo. Rescisão é uma pessoa por
//    vez, então ele substitui a tabela em vez de acrescentar colunas.
var ESTILO_COMPARACAO =
'#comparacao{margin:2rem 0}' +
'#comparacao h2{margin-bottom:.4rem}' +
'.p-comparacao{color:var(--t2);margin-bottom:1rem;max-width:var(--medida)}' +
'.linha-atual td{background:var(--bg3)}' +
'.etiq{display:inline-block;font-family:var(--mono);font-size:var(--t-micro);' +
'padding:.1rem .4rem;border-radius:4px;margin-left:.4rem;vertical-align:middle}' +
'.etiq-atual{color:var(--ac);border:1px solid rgba(88,166,255,.45)}' +
'.aviso-comparacao{font-size:var(--t-micro);color:var(--t3);margin:0 0 1rem;' +
'max-width:var(--medida);line-height:1.6}\n';

completo = trocar(completo, 'td.vazio{', ESTILO_COMPARACAO + 'td.vazio{', 'estilo da comparação');

var ESTILO_MARCAR =
'.marcar{display:flex;align-items:center;gap:.5rem;font-weight:400;color:var(--t2);' +
'cursor:pointer;padding:.55rem 0;font-size:var(--t-base)}' +
'.marcar input{width:1.1rem;height:1.1rem;flex:none;margin:0}\n';

// Âncora no token inteiro: procurar por '.vazio{' casa DENTRO de
// 'td.vazio{' e cola o 'td' órfão na regra nova — a contagem passa,
// porque a ocorrência é uma só, e o CSS sai quebrado em silêncio.
completo = trocar(completo, 'td.vazio{', ESTILO_MARCAR + 'td.vazio{', 'estilo do painel');

var PAINEL =
'  <div class="card" id="painelRescisao" style="display:none">\n' +
'    <h2 style="margin-top:0">Rescisão</h2>\n' +
'    <div class="grade">\n' +
'      <div class="campo"><label for="rFuncionario">Funcionário</label>\n' +
'        <select id="rFuncionario" class="entrada"></select></div>\n' +
'      <div class="campo"><label for="rTipo">Motivo do desligamento</label>\n' +
'        <select id="rTipo" class="entrada">\n' +
'          <option value="sem-justa-causa">Dispensa sem justa causa</option>\n' +
'          <option value="pedido-demissao">Pedido de demissão</option>\n' +
'          <option value="acordo">Acordo entre as partes</option>\n' +
'          <option value="fim-contrato">Fim de contrato por prazo determinado</option>\n' +
'          <option value="justa-causa">Dispensa por justa causa</option>\n' +
'        </select></div>\n' +
'      <div class="campo"><label for="rDiasMes">Dias trabalhados no mês</label>\n' +
'        <input id="rDiasMes" type="number" min="0" max="30" value="30"></div>\n' +
'      <div class="campo"><label for="rAnos">Anos completos de casa</label>\n' +
'        <input id="rAnos" type="number" min="0" max="50" value="0">\n' +
'        <span class="dica">O aviso é 30 dias mais 3 por ano, até 90.</span></div>\n' +
'      <div class="campo"><label for="rMeses13">Meses para o 13º</label>\n' +
'        <input id="rMeses13" type="number" min="0" max="12" value="12"></div>\n' +
'      <div class="campo"><label for="rMesesFerias">Meses para as férias</label>\n' +
'        <input id="rMesesFerias" type="number" min="0" max="12" value="12"></div>\n' +
'      <div class="campo"><label for="rFgts">Saldo do FGTS (R$)</label>\n' +
'        <input id="rFgts" inputmode="decimal" placeholder="0,00">\n' +
'        <span class="dica">Saldo na data do pagamento, sem projetar o aviso.</span></div>\n' +
'      <div class="campo"><label for="rRegime">Regime tributário</label>\n' +
'        <select id="rRegime" class="entrada">\n' +
'          <option value="simples">Simples Nacional</option>\n' +
'          <option value="simplesIV">Simples — anexo IV</option>\n' +
'          <option value="normal">Lucro presumido ou real</option>\n' +
'        </select>\n' +
'        <span class="dica">Muda os encargos do empregador, não o que ele recebe.</span></div>\n' +
'      <div class="campo"><label>Férias vencidas</label>\n' +
'        <label for="rVencidas" class="marcar">\n' +
'          <input id="rVencidas" type="checkbox"> Tem um período vencido</label></div>\n' +
'      <div class="campo" id="campoAviso" style="display:none"><label>Aviso prévio</label>\n' +
'        <label for="rAvisoCumprido" class="marcar">\n' +
'          <input id="rAvisoCumprido" type="checkbox" checked> Cumpriu o aviso</label>\n' +
'        <span class="dica">Se não cumprir, o empregador pode descontar 30 dias.</span></div>\n' +
'    </div>\n' +
'  </div>\n\n';

completo = trocar(completo,
  '  <div class="resumo" id="resumo"></div>',
  PAINEL + '  <div class="resumo" id="resumo"></div>',
  'painel de rescisão');

// A comparação entra DEPOIS da tabela de verbas: primeiro o dono vê a
// conta que pediu, depois descobre que existem outras quatro.
completo = trocar(completo,
  '  <div class="aviso" id="avisoGeral"></div>',
  '  <div id="comparacao"></div>\n\n  <div class="aviso" id="avisoGeral"></div>',
  'bloco da comparação');

// 4) A interface, junto das outras funções de render.
completo = trocar(completo,
  'function montarHolerites(){',
  moduloUi + '\nfunction montarHolerites(){',
  'interface');

// 5) Os três despachos por modo.
completo = trocar(completo,
  "  if(modoAtual()==='ferias'){ renderFerias(); return; }\n/*«/PAGO»*/",
  "  if(modoAtual()==='ferias'){ renderFerias(); return; }\n/*«/PAGO»*/" +
  "  if(modoAtual()==='rescisao'){ renderRescisao(); return; }\n",
  'despacho de render');

completo = trocar(completo,
  "  if(modoAtual()==='ferias'){ montarRecibosFerias(); return; }\n/*«/PAGO»*/",
  "  if(modoAtual()==='ferias'){ montarRecibosFerias(); return; }\n/*«/PAGO»*/" +
  "  if(modoAtual()==='rescisao'){ montarTermoRescisao(); return; }\n",
  'despacho de impressão');

// 6) No modo rescisão o cadastro de folha some: os campos dele não têm
//    uso aqui, e deixar dois formulários na tela confunde qual vale.
// A sentinela «/PAGO» fica entre o último campo e o `}`: ela marca onde
// termina o que a demo remove. A âncora precisa incluí-la, senão casa
// nada — e o gerador recusa, que foi como isto apareceu.
completo = trocar(completo,
  "  ferias:  ['campoDias', 'campoVendidos']/*«/PAGO»*/\n};",
  "  ferias:  ['campoDias', 'campoVendidos']/*«/PAGO»*/,\n  rescisao: []\n};",
  'campos por modo');

completo = trocar(completo,
  "function ajustarCampos(){\n  el('avisoGeral').innerHTML = textoAviso();",
  "function ajustarCampos(){\n  el('avisoGeral').innerHTML = textoAviso();\n" +
  "  var ehRescisao = modoAtual()==='rescisao';\n" +
  "  el('painelRescisao').style.display = ehRescisao ? '' : 'none';\n" +
  "  el('btImprimir').textContent = ehRescisao ? 'Imprimir termo' : 'Imprimir holerites';\n" +
  "  if(ehRescisao) preencherPainelRescisao();",
  'exibição do painel');

// 7) O modo novo precisa entrar nas duas listas brancas. Sem isto o
//    seletor mostra "Rescisão", o valor é gravado, e modoAtual()
//    devolve 'mensal' — a tela não muda e nada indica o porquê.
//    A de normalizar() é a que sobrevive ao recarregar a página.
var LISTA = "|| m==='ferias'/*«/PAGO»*/) ? m : 'mensal'";
completo = trocar(completo, LISTA,
  "|| m==='ferias'/*«/PAGO»*/ || m==='rescisao') ? m : 'mensal'",
  'lista branca de modoAtual');

var LISTA_NORM = "|| emp.modo==='ferias'/*«/PAGO»*/) ? emp.modo : 'mensal'";
completo = trocar(completo, LISTA_NORM,
  "|| emp.modo==='ferias'/*«/PAGO»*/ || emp.modo==='rescisao') ? emp.modo : 'mensal'",
  'lista branca de normalizar');

// 8) Ligar os campos do painel, uma vez, na mesma linha em que o
//    produto se inicializa — o DOM já existe ali.
completo = trocar(completo,
  'carregar(); preencher(); ajustarCampos(); render();',
  'carregar(); preencher(); ligarPainelRescisao(); ajustarCampos(); render();',
  'ligação do painel');

// 9) Marca o build no título, para ninguém confundir os dois arquivos.
completo = trocar(completo,
  '<title>Folha Simples',
  '<title>Folha Simples Completo',
  'título');

if (process.argv.indexOf('--verificar') > -1) {
  if (!fs.existsSync(DESTINO)) {
    console.error('O build completo não existe. Rode: node produtos/gerar-completo.js');
    process.exit(1);
  }
  if (fs.readFileSync(DESTINO, 'utf8') !== completo) {
    console.error('O build completo está desatualizado em relação ao base ou ao módulo.');
    console.error('Rode: node produtos/gerar-completo.js');
    process.exit(1);
  }
  console.log('O build completo está em dia com o base e com o módulo.');
  process.exit(0);
}

fs.writeFileSync(DESTINO, completo);
console.log(path.relative(path.join(DIR, '..'), DESTINO) + ' gerado.');
