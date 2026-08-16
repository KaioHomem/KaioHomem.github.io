/* Page logic — paid traffic unit economics. */
(function () {
  'use strict';

  var F = window.FerramentasBR;
  var A = window.App;

  var DIAGNOSTICOS = {
    'sem-ticket': {
      titulo: 'Não há o que vender',
      texto: 'Sem preço de venda não existe margem, e sem margem não existe tráfego pago ' +
             'viável. Isso não é problema de marketing.'
    },
    'sem-margem': {
      titulo: 'Os custos comem o preço',
      texto: 'Não sobra nada por venda, então qualquer real gasto em anúncio é prejuízo ' +
             'direto. Mexa em preço, custo ou oferta antes de pensar em campanha.'
    },
    'faltam-dados': {
      titulo: 'Faltam os números da campanha',
      texto: 'Preencha CPM, CTR e conversão para projetar o CPA. Sem isso dá para ver o ' +
             'teto, mas não se você chega nele.'
    },
    'criativo': {
      titulo: 'O gargalo é criativo ou público',
      texto: 'CTR abaixo de 1% quer dizer que as pessoas estão vendo e não clicando. ' +
             'Troque ângulo e hook antes de mexer em qualquer outra coisa.'
    },
    'pagina-ou-oferta': {
      titulo: 'O gargalo é a página ou a oferta',
      texto: 'O anúncio cumpriu a parte dele: trouxe gente. Quem quebrou foi o que ela ' +
             'encontrou depois — página, preço, prova ou risco.'
    },
    'cpa-alto': {
      // Also covers landing exactly on break-even: the CPA does not exceed
      // the margin there, it consumes all of it — which is still no profit.
      titulo: 'O CPA consome toda a margem',
      texto: 'A campanha funciona, mas não sobra dinheiro. Dá para atacar por três lados: ' +
             'baixar o CPM com criativo melhor, subir a conversão da página, ou subir o ' +
             'ticket. Mexer no criativo é o mais rápido; mexer no ticket é o que mais move.'
    },
    'viavel': {
      titulo: 'A conta fecha',
      texto: 'O CPA projetado cabe dentro da margem. Suba com regra de corte definida e ' +
             'verba suficiente para o teste dizer alguma coisa.'
    }
  };

  function calcular() {
    var alvo = document.getElementById('resultado');
    var ticket = A.valorDe('ticket');

    var r = F.trafegoPago({
      ticket: ticket,
      custoProduto: A.valorDe('custoProduto'),
      custoOperacional: A.valorDe('custoOperacional'),
      comprasPorCliente: A.valorDe('recompras') || 1,
      cpm: A.valorDe('cpm'),
      ctr: A.valorDe('ctr') / 100,
      taxaConversao: A.valorDe('conversao') / 100
    });

    var d = DIAGNOSTICOS[r.diagnostico] || DIAGNOSTICOS['faltam-dados'];
    var bom = r.diagnostico === 'viavel';
    var html = '';

    if (r.margem > 0 && isFinite(r.roasBreakeven)) {
      html += '<div class="destaque' + (bom ? '' : ' neutro') + '">' +
                '<div class="rotulo">ROAS de breakeven</div>' +
                '<div class="valor">' + r.roasBreakeven.toFixed(2).replace('.', ',') + 'x</div>' +
                '<p class="nota">Abaixo disso você paga para vender. ' +
                'Margem de contribuição de ' + F.pct(r.margem, 1) + '.</p>' +
              '</div>';
    } else {
      html += '<div class="destaque neutro" style="background:linear-gradient(135deg,rgba(248,81,73,.12),transparent);border-color:rgba(248,81,73,.35)">' +
                '<div class="rotulo">Sem margem</div>' +
                '<div class="valor" style="color:var(--red)">—</div>' +
                '<p class="nota">Não sobra nada por venda para pagar anúncio.</p>' +
              '</div>';
    }

    html += '<div class="linhas">';
    html += A.grupo('Economia por venda');
    html += A.linha('Preço de venda', r.ticket);
    html += A.linha('Margem de contribuição', r.contribuicao, {
      tipo: r.contribuicao > 0 ? 'pos' : 'neg',
      sub: 'o que sobra depois de todos os custos da venda'
    });
    html += A.linha('CPA máximo (empate)', r.cpaMaximo, {
      sub: 'pagar isso significa trabalhar de graça'
    });
    if (r.cpaMaximoComLTV > r.cpaMaximo) {
      html += A.linha('CPA máximo com recompra', r.cpaMaximoComLTV, {
        tipo: 'pos', sub: 'considerando ' + A.valorDe('recompras') + ' compras por cliente'
      });
    }
    html += A.linha('Regra de corte', r.regraDeCorte, {
      sub: 'mate o criativo que gastar isso sem venda — decida agora, não depois'
    });

    if (r.cpaProjetado > 0) {
      html += A.grupo('Projeção da campanha');
      html += A.linha('CPC', r.cpc, { sub: 'do CPM de ' + F.brl(A.valorDe('cpm')) + ' com CTR de ' + A.valorDe('ctr') + '%' });
      html += A.linha('CPA projetado', r.cpaProjetado, {
        tipo: r.viavel ? 'pos' : 'neg',
        sub: 'do CPC com conversão de ' + A.valorDe('conversao') + '%'
      });
      html += A.linha('ROAS projetado', 0, {
        bruto: r.roasProjetado.toFixed(2).replace('.', ',') + 'x',
        sub: r.viavel ? 'acima do breakeven' : 'abaixo do breakeven'
      });
      html += A.linha('Lucro por venda', r.lucroPorVenda, {
        total: true, tipo: r.lucroPorVenda > 0 ? 'pos' : 'neg'
      });
      html += A.linha('Verba por criativo no teste', r.verbaTestePorCriativo, {
        sub: 'cobre 3 conversões — abaixo disso o resultado é ruído'
      });
    }
    html += '</div>';

    html += '<div class="aviso" style="' +
            (bom ? 'background:rgba(63,185,80,.1);border-color:rgba(63,185,80,.35)' : '') +
            '"><p><strong>' + d.titulo + '.</strong> ' + d.texto + '</p></div>';

    alvo.innerHTML = html;
    A.mostrarResultado('resultado');
  }

  function limpar() {
    ['ticket', 'custoProduto', 'custoOperacional', 'cpm', 'ctr', 'conversao'].forEach(function (id) {
      document.getElementById(id).value = '';
    });
    document.getElementById('recompras').value = '1';
    var alvo = document.getElementById('resultado');
    alvo.innerHTML = '';
    alvo.classList.remove('visivel');
    document.getElementById('ticket').focus();
  }

  document.getElementById('calcular').addEventListener('click', calcular);
  document.getElementById('limpar').addEventListener('click', limpar);
  A.ligarEnter('formulario', calcular);

  calcular();
})();
