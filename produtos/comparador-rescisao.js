/* ===================================================
   COMPARADOR DOS CINCO DESFECHOS

   Roda na página de oferta usando o mesmo nucleo.js das
   calculadoras públicas — não uma cópia, o arquivo. Se o
   motor mudar, esta página muda junto, e os 6.000 cenários
   de paridade do gate cobrem os dois.

   A página mostra de graça o que ela vende. Isso é
   deliberado e é como o site inteiro funciona: as onze
   calculadoras provam a conta, o produto integra a conta
   no dia a dia. Quem só precisa comparar uma vez foi bem
   servido e não devia nada.
   =================================================== */

(function () {
  'use strict';

  var TIPOS = [
    ['sem-justa-causa', 'Dispensa sem justa causa'],
    ['acordo',          'Acordo entre as partes'],
    ['pedido-demissao', 'Pedido de demissão'],
    ['fim-contrato',    'Fim de contrato'],
    ['justa-causa',     'Dispensa por justa causa']
  ];

  var alvo = document.getElementById('tabelaComparacao');
  if (!alvo || !window.FerramentasBR) return;

  var fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  function brl(n) { return fmt.format(Number(n) || 0); }

  function num(txt) {
    var s = String(txt || '').trim().replace(/[^\d,.-]/g, '');
    if (!s) return 0;
    if (s.indexOf(',') > -1) s = s.replace(/\./g, '').replace(',', '.');
    else {
      var p = s.split('.');
      if (p.length > 2 || (p.length === 2 && p[1].length === 3)) s = p.join('');
    }
    var v = parseFloat(s);
    return isFinite(v) && v > 0 ? v : 0;
  }

  function el(id) { return document.getElementById(id); }

  function calcular() {
    var salario = num(el('oSalario').value);
    var anos = Math.max(0, parseInt(el('oAnos').value, 10) || 0);
    var fgts = num(el('oFgts').value);

    // Um desligamento no meio do mês, com o ano já corrido — o caso que
    // aparece na maioria das vezes. Números redondos aqui esconderiam
    // quanto o proporcional pesa.
    var base = {
      salario: salario,
      dependentes: 0,
      diasTrabalhadosNoMes: 15,
      anosCompletos: anos,
      mesesPara13: 7,
      mesesParaFerias: 7,
      feriasVencidas: false,
      saldoFGTS: fgts,
      avisoCumprido: true,
      regime: 'simples'
    };

    return TIPOS.map(function (t) {
      var e = {};
      for (var k in base) if (Object.prototype.hasOwnProperty.call(base, k)) e[k] = base[k];
      e.tipo = t[0];
      var c = window.FerramentasBR.custoDemissao(e);
      return {
        nome: t[1],
        custo: c.total,
        liquido: c.rescisao.liquido,
        fgts: c.rescisao.fgtsSacavel,
        seguro: c.rescisao.temSeguroDesemprego
      };
    });
  }

  function render() {
    var linhas = calcular();
    var maior = linhas[0].custo;   // dispensa sem justa causa é a referência

    alvo.innerHTML =
      '<thead><tr>' +
        '<th class="motivo">Motivo</th>' +
        '<th>Sai do caixa</th>' +
        '<th>Ele recebe</th>' +
        '<th>FGTS sacado</th>' +
        '<th>Seguro</th>' +
        '<th>Contra a dispensa</th>' +
      '</tr></thead><tbody>' +
      linhas.map(function (l) {
        var dif = Math.round((maior - l.custo) * 100) / 100;
        return '<tr>' +
          '<td class="motivo">' + l.nome + '</td>' +
          '<td>' + brl(l.custo) + '</td>' +
          '<td>' + brl(l.liquido) + '</td>' +
          '<td>' + brl(l.fgts) + '</td>' +
          '<td>' + (l.seguro ? 'sim' : '—') + '</td>' +
          '<td class="' + (dif > 0 ? 'dif' : 'dif-zero') + '">' +
            (dif > 0 ? '\u2212\u00a0' + brl(dif) : '\u2014') + '</td>' +
        '</tr>';
      }).join('') +
      '</tbody>';

    /* O número grande é a distância entre DISPENSA e ACORDO, não entre o
       desfecho mais caro e o mais barato da tabela.

       Medir do mais caro ao mais barato dá um número muito maior, e ele
       cai quase sempre em justa causa — o que enquadra como "escolha de
       R$ 25 mil" algo que não é escolha nenhuma: justa causa é um fato
       sobre o que o funcionário fez, e registrar sem a falta que a
       justifica é fraude. Seria a mesma manipulação do selo de "mais
       barato" que saiu do módulo, só que em corpo 40.

       Dispensa contra acordo do art. 484-A é a única comparação da
       tabela que é decisão de verdade: o acordo existe na lei
       justamente como alternativa negociada à dispensa. O número é
       menor e é o certo. */
    var acordo = linhas[1].custo;
    var faixa = Math.round((maior - acordo) * 100) / 100;
    el('difValor').textContent = brl(faixa);
    el('difTexto').textContent = faixa > 0
      ? 'separam a dispensa sem justa causa do acordo do art. 484-A — a única escolha de verdade desta tabela.'
      : 'de diferença — preencha um salário para comparar.';
  }

  ['oSalario', 'oAnos', 'oFgts'].forEach(function (id) {
    var campo = el(id);
    if (campo) campo.addEventListener('input', render);
  });

  render();
})();
