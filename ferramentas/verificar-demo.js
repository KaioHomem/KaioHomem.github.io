/* ===================================================
   GATE DA DEMONSTRAÇÃO — capacidade paga ausente
   Uso: node ferramentas/verificar-demo.js
        npm run demo-gate

   Prova que produtos/demo.html não contém a capacidade
   que o produto base vende: 13º salário e férias.

   Constitution C3 e C10: a demo é limitada por ausência,
   não por condição. Apagar `DEMO`, trocar o limite, tirar
   um atributo ou editar o HTML não pode devolver a
   capacidade — porque ela não está lá.

   >>> As assinaturas NÃO são escolhidas à mão.

   Elas são derivadas do próprio produto, a cada execução:
   o gate lê as regiões marcadas como pagas, extrai os
   identificadores que existem SÓ ali dentro, e exige que
   nenhum apareça na demo.

   Isso resolve a cegueira que uma lista fixa teria. Com
   assinatura escrita à mão, renomear uma função no produto
   faz o gate procurar para sempre por algo que ninguém
   escreve — e passar por estar cego. Derivando da fonte,
   renomear a função renomeia a assinatura junto.
   =================================================== */

'use strict';

var fs = require('fs');
var path = require('path');

var RAIZ = path.join(__dirname, '..');
var publico = require('./publico');

var BASE = path.join(RAIZ, publico.PAGOS.base.arquivo);
var DEMO = path.join(RAIZ, 'produtos/demo.html');

var ABRE = '/*«PAGO»*/';
var FECHA = '/*«/PAGO»*/';

var problemas = [];
var checagens = 0;

function exigir(condicao, mensagem) {
  checagens++;
  if (!condicao) problemas.push(mensagem);
}

[BASE, DEMO].forEach(function (f) {
  if (!fs.existsSync(f)) {
    console.error('Não achei ' + path.relative(RAIZ, f) + '.');
    process.exit(1);
  }
});

var base = fs.readFileSync(BASE, 'utf8');
var demo = fs.readFileSync(DEMO, 'utf8');

/* ---------- 1. SEPARAR O PAGO DO GRATUITO NO PRODUTO ---------- */

var corte = new RegExp(
  ABRE.replace(/[*/]/g, '\\$&') + '[\\s\\S]*?' + FECHA.replace(/[*/]/g, '\\$&'), 'g');

var regioes = base.match(corte) || [];
var textoPago = regioes.join('\n');
var textoLivre = base.replace(corte, '');

exigir(regioes.length > 0,
  'o produto base não tem nenhuma região marcada como paga — ' +
  'ou as sentinelas sumiram, ou alguém as apagou');

/* ---------- 2. DERIVAR AS ASSINATURAS ----------

   Identificador que aparece dentro de região paga E NÃO aparece no
   resto do produto. O filtro é o que evita falso positivo: `dados`,
   `brl` e `funcionarios` também estão lá dentro, mas são do produto
   inteiro.                                                          */

function identificadores(texto) {
  var achados = {};
  var re = /[A-Za-z_$][A-Za-z0-9_$]{4,}/g;
  var m;
  while ((m = re.exec(texto)) !== null) achados[m[0]] = true;
  return Object.keys(achados);
}

var livres = {};
identificadores(textoLivre).forEach(function (i) { livres[i] = true; });

var ASSINATURAS = identificadores(textoPago).filter(function (i) {
  return !livres[i];
});

/* Cegueira: se sobrou pouca ou nenhuma assinatura, o gate não está
   provando nada. Melhor reprovar e mandar alguém olhar do que passar
   verde sem ter olhado. */
exigir(ASSINATURAS.length >= 6,
  'só ' + ASSINATURAS.length + ' assinatura(s) exclusiva(s) da capacidade paga. ' +
  'O gate está quase cego — confira as sentinelas no produto antes de confiar nele.');

/* ---------- 3. NENHUMA DELAS PODE ESTAR NA DEMO ---------- */

ASSINATURAS.forEach(function (a) {
  exigir(demo.indexOf(a) === -1,
    'CAPACIDADE PAGA NA DEMO: "' + a + '" existe só nas regiões pagas do produto ' +
    'e apareceu em demo.html');
});

/* ---------- 4. A DEMO AINDA PRECISA DEMONSTRAR ALGO ----------

   Sem isto, "apagar o arquivo inteiro" passaria no gate. Uma demo vazia
   satisfaz a ausência de capacidade paga e não serve para nada.      */
// `function X(`, não só "X": procurar o nome solto acha as chamadas e
// passa mesmo com a função removida. Foi o que aconteceu no teste ao
// contrário — renomear a declaração deixou os call sites para trás e o
// gate não viu.
['folhaDe', 'montarHolerites', 'calcINSS', 'calcIRRF'].forEach(function (f) {
  exigir(demo.indexOf('function ' + f + '(') !== -1,
    'a demo perdeu a função "' + f + '": ela precisa continuar fazendo a folha mensal');
});

exigir(/DEMO\s*=\s*\{\s*limite\s*:\s*\d+/.test(demo),
  'a demo não tem o limite de funcionários configurado');

exigir(demo.indexOf('marca-demo') !== -1,
  'a demo perdeu a marca d\'água do holerite');

/* ---------- 5. O QUE SOBROU PRECISA SER JAVASCRIPT VÁLIDO ----------

   Achado durante a implementação: uma sentinela mal posicionada engoliu
   o valor de `mensal` em CAMPOS_POR_MODO e gerou `mensal: };`. A demo
   ficou com SyntaxError e todos os outros testes continuaram passando,
   porque nenhum deles executava o script.

   Remover código de dentro de um arquivo é uma operação que quebra
   sintaxe com facilidade. Sem esta checagem, o gate aprovaria uma demo
   que não abre.                                                       */
(function () {
  var m = demo.match(/<script>([\s\S]*?)<\/script>/);
  if (!m) {
    exigir(false, 'não achei o <script> da demo');
    return;
  }
  checagens++;
  try {
    new Function(m[1]);
  } catch (e) {
    problemas.push('A DEMO NÃO É JAVASCRIPT VÁLIDO: ' + e.message +
                   '\n    O corte das regiões pagas quebrou a sintaxe.');
  }
})();

/* ---------- 6. AS SENTINELAS NÃO VAZAM PARA A DEMO ---------- */

exigir(demo.indexOf(ABRE) === -1 && demo.indexOf(FECHA) === -1,
  'sobrou sentinela na demo — o corte não removeu tudo');

/* ---------- RESULTADO ---------- */

console.log('');
console.log('Regiões pagas no produto: ' + regioes.length);
console.log('Assinaturas derivadas:    ' + ASSINATURAS.length +
            '  (' + ASSINATURAS.slice(0, 6).join(', ') +
            (ASSINATURAS.length > 6 ? ', …' : '') + ')');

if (problemas.length) {
  console.error('\n' + '-'.repeat(52));
  console.error('A DEMONSTRAÇÃO NÃO ESTÁ SEPARADA DO PRODUTO:\n');
  problemas.forEach(function (p) { console.error('  ' + p); });
  console.error('');
  process.exit(1);
}

console.log('\n' + '-'.repeat(52));
console.log(checagens + ' checagens da demo passaram.');
console.log('A capacidade paga está ausente do arquivo, não desligada nele.');
