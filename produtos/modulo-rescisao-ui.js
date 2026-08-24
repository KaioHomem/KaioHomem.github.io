/* ===================================================
   INTERFACE DA RESCISÃO — injetada no build completo

   Fica fora do modulo-rescisao.js de propósito: aquele
   arquivo é o motor, e o gate de paridade o avalia
   isolado, sem DOM. Misturar `el()` e `brl()` lá dentro
   funcionaria — declaração de função não executa nada —
   mas embaçaria a fronteira que faz o gate ser simples.

   Rescisão é uma pessoa por vez, não a folha inteira.
   Por isso um painel próprio em vez de sete colunas novas
   numa tabela que já tem nove.
   =================================================== */

/* O estado do painel não vai para o localStorage junto com a folha:
   demitir é evento, não cadastro. Guardar isso entre sessões faria o
   programa abrir amanhã com a demissão de ontem preenchida. */
var rescisaoAtual = {
  indice: 0,
  tipo: 'sem-justa-causa',
  diasTrabalhadosNoMes: 30,
  anosCompletos: 0,
  mesesPara13: 12,
  mesesParaFerias: 12,
  feriasVencidas: false,
  saldoFGTS: 0,
  avisoCumprido: true,
  regime: 'simples'
};

function funcionarioDaRescisao(){
  var f = dados.funcionarios[rescisaoAtual.indice];
  if(!f) return null;
  var e = {};
  for(var k in rescisaoAtual) if(Object.prototype.hasOwnProperty.call(rescisaoAtual,k)) e[k]=rescisaoAtual[k];
  e.nome = f.nome; e.cargo = f.cargo;
  e.salario = f.salario; e.dependentes = f.dependentes;
  return e;
}

function preencherPainelRescisao(){
  var sel = el('rFuncionario');
  if(!sel) return;
  if(rescisaoAtual.indice >= dados.funcionarios.length) rescisaoAtual.indice = 0;

  sel.innerHTML = dados.funcionarios.length
    ? dados.funcionarios.map(function(f,i){
        return '<option value="'+i+'"'+(i===rescisaoAtual.indice?' selected':'')+'>'+
               esc(f.nome)+(f.cargo?' — '+esc(f.cargo):'')+'</option>';
      }).join('')
    : '<option value="">Nenhum funcionário cadastrado</option>';

  el('rTipo').value = rescisaoAtual.tipo;
  el('rDiasMes').value = rescisaoAtual.diasTrabalhadosNoMes;
  el('rAnos').value = rescisaoAtual.anosCompletos;
  el('rMeses13').value = rescisaoAtual.mesesPara13;
  el('rMesesFerias').value = rescisaoAtual.mesesParaFerias;
  el('rVencidas').checked = rescisaoAtual.feriasVencidas;
  el('rFgts').value = rescisaoAtual.saldoFGTS ? brl(rescisaoAtual.saldoFGTS).replace('R$','').trim() : '';
  el('rRegime').value = rescisaoAtual.regime;

  // O desconto de trinta dias só existe em pedido de demissão. Mostrar o
  // campo nos outros tipos convida a marcar algo que não tem efeito.
  el('campoAviso').style.display = rescisaoAtual.tipo === 'pedido-demissao' ? '' : 'none';
  el('rAvisoCumprido').checked = rescisaoAtual.avisoCumprido;

  // O botão imprime um termo aqui, não holerites. Rótulo que descreve
  // outra coisa faz o usuário hesitar antes de clicar.
  el('btImprimir').textContent = 'Imprimir termo';
}

function renderRescisao(){
  var f = funcionarioDaRescisao();

  if(!f){
    el('resumo').innerHTML = '';
    el('tabela').innerHTML =
      '<tbody><tr><td class="vazio">Cadastre um funcionário acima para calcular a rescisão dele.</td></tr></tbody>';
    el('holerite').innerHTML = '';
    return;
  }

  var c = custoDemissaoDe(f);
  var r = c.rescisao;

  el('resumo').innerHTML = [
    ['a', brl(c.total),       'Custo total da demissão', 'sai do caixa da empresa'],
    ['v', brl(r.liquido),     'Líquido ao funcionário',  'o que ele recebe na mão'],
    ['',  brl(c.encargos.total), 'Encargos do empregador', 'além do que vai para ele'],
    ['',  brl(r.fgtsSacavel), 'FGTS que ele pode sacar', r.temSeguroDesemprego ? 'e tem seguro-desemprego' : 'sem direito a seguro-desemprego']
  ].map(function(k){
    return '<div class="kpi '+k[0]+'"><div class="n">'+k[1]+'</div><div class="l">'+k[2]+
           '<br><span style="color:var(--t3)">'+k[3]+'</span></div></div>';
  }).join('');

  var lin = [
    ['Saldo de salário',              r.proventos.saldoSalario,              'v'],
    ['Aviso prévio indenizado' + (r.diasAviso ? ' — '+r.diasAviso+' dias' : ''),
                                      r.proventos.avisoPrevioIndenizado,     'v'],
    ['13º proporcional',              r.proventos.decimoTerceiroProporcional,'v'],
    ['Férias proporcionais',          r.proventos.feriasProporcionais,       'v'],
    ['Terço das férias proporcionais',r.proventos.tercoFeriasProporcionais,  'v'],
    ['Férias vencidas',               r.proventos.feriasVencidas,            'v'],
    ['Terço das férias vencidas',     r.proventos.tercoFeriasVencidas,       'v'],
    ['Multa de FGTS',                 r.proventos.multaFGTS,                 'v'],
    ['INSS sobre o saldo de salário', r.descontos.inssSaldoSalario,          'd'],
    ['IRRF sobre o saldo de salário', r.descontos.irrfSaldoSalario,          'd'],
    ['INSS sobre o 13º',              r.descontos.inssDecimoTerceiro,        'd'],
    ['IRRF sobre o 13º',              r.descontos.irrfDecimoTerceiro,        'd'],
    ['Aviso prévio não cumprido',     r.descontos.avisoPrevioNaoCumprido,    'd']
  ].filter(function(l){ return l[1] > 0; });

  el('tabela').innerHTML =
    '<thead><tr><th>Verba</th><th>Vencimentos</th><th>Descontos</th></tr></thead><tbody>'+
    lin.map(function(l){
      return '<tr><td>'+l[0]+'</td>'+
        (l[2]==='d' ? '<td></td><td class="neg">'+brl(l[1])+'</td>'
                    : '<td>'+brl(l[1])+'</td><td></td>')+'</tr>';
    }).join('')+
    '<tr class="tot"><td>Totais</td><td>'+brl(r.totalProventos)+'</td><td class="neg">'+brl(r.totalDescontos)+'</td></tr>'+
    '<tr class="tot"><td>Líquido a receber</td><td class="pos">'+brl(r.liquido)+'</td><td></td></tr>'+
    '<tr><td colspan="3" style="color:var(--t3)">'+
      'Encargos do empregador — INSS patronal '+brl(c.encargos.inssPatronal)+
      ' e FGTS '+brl(c.encargos.fgtsSobreVerbas)+
      ' (regime '+esc(c.regime === 'simples' ? 'Simples' : c.regime === 'simplesIV' ? 'Simples anexo IV' : 'normal')+')'+
    '</td></tr>'+
    '</tbody>';

  montarTermoRescisao();
}

function montarTermoRescisao(){
  var f = funcionarioDaRescisao();
  if(!f){ el('holerite').innerHTML=''; return; }

  var e = dados.empresa;
  var c = custoDemissaoDe(f);
  var r = c.rescisao;
  var nomes = {
    'sem-justa-causa': 'Dispensa sem justa causa',
    'pedido-demissao': 'Pedido de demissão',
    'acordo': 'Acordo entre as partes (art. 484-A da CLT)',
    'fim-contrato': 'Fim de contrato por prazo determinado',
    'justa-causa': 'Dispensa por justa causa'
  };

  var lin = [
    ['Saldo de salário',              r.proventos.saldoSalario,              'v'],
    ['Aviso prévio indenizado' + (r.diasAviso ? ' — '+r.diasAviso+' dias' : ''),
                                      r.proventos.avisoPrevioIndenizado,     'v'],
    ['13º proporcional',              r.proventos.decimoTerceiroProporcional,'v'],
    ['Férias proporcionais + 1/3',    round2(r.proventos.feriasProporcionais + r.proventos.tercoFeriasProporcionais), 'v'],
    ['Férias vencidas + 1/3',         round2(r.proventos.feriasVencidas + r.proventos.tercoFeriasVencidas), 'v'],
    ['Multa de FGTS',                 r.proventos.multaFGTS,                 'v'],
    ['INSS',                          round2(r.descontos.inssSaldoSalario + r.descontos.inssDecimoTerceiro), 'd'],
    ['IRRF',                          round2(r.descontos.irrfSaldoSalario + r.descontos.irrfDecimoTerceiro), 'd'],
    ['Aviso prévio não cumprido',     r.descontos.avisoPrevioNaoCumprido,    'd']
  ].filter(function(l){ return l[1] > 0; });

  el('holerite').innerHTML =
    '<div class="hol">'+
    '<h3>'+esc(e.nome||'—')+'</h3>'+
    '<div class="emp">CNPJ '+esc(e.cnpj||'—')+' &nbsp;·&nbsp; Termo de rescisão do contrato de trabalho</div>'+
    '<div style="margin-bottom:6px"><strong>'+esc(f.nome)+'</strong>'+(f.cargo?' — '+esc(f.cargo):'')+'</div>'+
    '<div class="emp">'+esc(nomes[r.tipo]||r.tipo)+'</div>'+
    '<table><thead><tr><th>Descrição</th><th>Referência</th><th>Vencimentos</th><th>Descontos</th></tr></thead><tbody>'+
    lin.map(function(l){
      return '<tr><td>'+l[0]+'</td><td></td>'+
        (l[2]==='d' ? '<td></td><td>'+brl(l[1])+'</td>' : '<td>'+brl(l[1])+'</td><td></td>')+'</tr>';
    }).join('')+
    '<tr class="tot"><td>Totais</td><td></td><td>'+brl(r.totalProventos)+'</td><td>'+brl(r.totalDescontos)+'</td></tr>'+
    '<tr class="tot"><td colspan="3">Líquido a receber</td><td>'+brl(r.liquido)+'</td></tr>'+
    '<tr><td colspan="3">FGTS disponível para saque</td><td>'+brl(r.fgtsSacavel)+'</td></tr>'+
    (r.temSeguroDesemprego
      ? '<tr><td colspan="4">Habilitado ao seguro-desemprego, se cumpridos os demais requisitos.</td></tr>'
      : '')+
    '</tbody></table>'+
    '<div class="ass"><div>Assinatura do empregador</div><div>Recebi em ___/___/______</div></div>'+
    (DEMO?'<div class="marca-demo">DEMONSTRAÇÃO — não vale como termo</div>':'')+
    '</div>';
}

function ligarPainelRescisao(){
  function muda(id, campo, transforma){
    var e = el(id);
    if(!e) return;
    e.addEventListener('change', function(){
      rescisaoAtual[campo] = transforma(e);
      preencherPainelRescisao();
      render();
    });
  }
  muda('rFuncionario','indice',        function(e){ return parseInt(e.value,10)||0; });
  muda('rTipo','tipo',                 function(e){ return e.value; });
  muda('rDiasMes','diasTrabalhadosNoMes', function(e){ return e.value; });
  muda('rAnos','anosCompletos',        function(e){ return e.value; });
  muda('rMeses13','mesesPara13',       function(e){ return e.value; });
  muda('rMesesFerias','mesesParaFerias', function(e){ return e.value; });
  muda('rVencidas','feriasVencidas',   function(e){ return e.checked; });
  muda('rFgts','saldoFGTS',            function(e){ return num(e.value); });
  muda('rAvisoCumprido','avisoCumprido', function(e){ return e.checked; });
  muda('rRegime','regime',             function(e){ return e.value; });
}
