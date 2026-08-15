/* Page logic — unemployment benefit calculator. */
(function () {
  'use strict';

  var F = window.FerramentasBR;
  var A = window.App;

  function calcular() {
    var alvo = document.getElementById('resultado');
    var salarios = [A.valorDe('s1'), A.valorDe('s2'), A.valorDe('s3')];

    if (salarios[0] <= 0) {
      alvo.innerHTML = '<div class="aviso"><p>Informe pelo menos o último salário.</p></div>';
      A.mostrarResultado('resultado');
      return;
    }

    var meses = A.inteiroDe('meses');
    var solicitacao = parseInt(A.textoDe('solicitacao'), 10);

    var r = F.seguroDesemprego({
      salarios: salarios,
      mesesTrabalhados: meses,
      solicitacao: solicitacao
    });

    var html = '';

    if (!r.elegivel) {
      html += '<div class="destaque neutro" style="background:linear-gradient(135deg,rgba(210,153,34,.14),transparent);border-color:rgba(210,153,34,.35)">' +
                '<div class="rotulo">Sem direito ao benefício</div>' +
                '<div class="valor" style="color:var(--amber)">' + meses + ' de ' + r.minimoExigido + ' meses</div>' +
                '<p class="nota">Nesta solicitação são exigidos ao menos ' + r.minimoExigido +
                ' meses trabalhados, e você informou ' + meses + '.</p>' +
              '</div>';

      html += '<div class="aviso"><p>O mínimo exigido diminui a cada solicitação: ' +
              '<strong>12 meses</strong> na primeira, <strong>9</strong> na segunda e ' +
              '<strong>6</strong> da terceira em diante. Confira se você já pediu o ' +
              'seguro-desemprego antes — isso muda o resultado.</p></div>';

      alvo.innerHTML = html;
      A.mostrarResultado('resultado');
      return;
    }

    html += '<div class="par-destaque">';
    html += '<div class="destaque">' +
              '<div class="rotulo">Valor de cada parcela</div>' +
              '<div class="valor">' + F.brl(r.valorParcela) + '</div>' +
              '<p class="nota">' + r.numeroParcelas + ' parcelas mensais</p>' +
            '</div>';
    html += '<div class="destaque neutro">' +
              '<div class="rotulo">Total do benefício</div>' +
              '<div class="valor">' + F.brl(r.total) + '</div>' +
              '<p class="nota">somando todas as parcelas</p>' +
            '</div>';
    html += '</div>';

    html += '<div class="linhas">';
    html += A.linha('Média dos 3 últimos salários', r.media);
    html += A.linha('Valor da parcela', r.valorParcela, {
      sub: r.noTeto
        ? 'no teto da tabela de 2026'
        : (r.ajustadoAoPiso ? 'elevado ao salário mínimo' : 'pela faixa da tabela de 2026')
    });
    html += A.linha('Número de parcelas', 0, {
      bruto: String(r.numeroParcelas),
      sub: r.solicitacao + 'ª solicitação · ' + A.inteiroDe('meses') + ' meses trabalhados'
    });
    html += A.linha('Total a receber', r.total, { total: true, tipo: 'pos' });
    html += '</div>';

    if (r.noTeto) {
      html += '<div class="aviso"><p>Sua média salarial passou de R$ 3.704,00, então a ' +
              'parcela trava no teto de ' + F.brl(2518.65) + '. Ganhar mais que isso não ' +
              'aumenta o benefício.</p></div>';
    } else if (r.ajustadoAoPiso) {
      html += '<div class="aviso"><p>O cálculo pela tabela daria menos que o salário ' +
              'mínimo, então a parcela foi elevada para ' + F.brl(1621) + '. Nenhuma ' +
              'parcela pode ficar abaixo disso.</p></div>';
    }

    html += '<div class="aviso"><p><strong>Não perca o prazo:</strong> o pedido vai do ' +
            '7º ao 120º dia depois da demissão. Passou disso, o direito se perde.</p></div>';

    alvo.innerHTML = html;
    A.mostrarResultado('resultado');
  }

  /** Typing only the last salary is common — mirror it into the other two. */
  function espelhar() {
    var s1 = document.getElementById('s1').value;
    ['s2', 's3'].forEach(function (id) {
      var campo = document.getElementById(id);
      if (!campo.value.trim()) campo.value = s1;
    });
  }

  function limpar() {
    ['s1', 's2', 's3'].forEach(function (id) {
      document.getElementById(id).value = '';
    });
    document.getElementById('meses').value = '24';
    document.getElementById('solicitacao').value = '1';
    var alvo = document.getElementById('resultado');
    alvo.innerHTML = '';
    alvo.classList.remove('visivel');
    document.getElementById('s1').focus();
  }

  document.getElementById('calcular').addEventListener('click', function () {
    espelhar();
    calcular();
  });
  document.getElementById('limpar').addEventListener('click', limpar);
  document.getElementById('solicitacao').addEventListener('change', calcular);
  A.ligarEnter('formulario', function () { espelhar(); calcular(); });

  calcular();
})();
