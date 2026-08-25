/* Page logic — compound interest, with an inline SVG chart. */
(function () {
  'use strict';

  var F = window.FerramentasBR;
  var A = window.App;

  /**
   * Stacked area chart: contributions at the bottom, interest on top.
   * Drawn as inline SVG so there is no charting dependency and it stays
   * crisp at any width.
   */
  function grafico(evolucao) {
    var L = 800, Alt = 260;
    var m = { topo: 14, dir: 8, base: 26, esq: 62 };
    var largura = L - m.esq - m.dir;
    var altura = Alt - m.topo - m.base;

    var ultimo = evolucao[evolucao.length - 1];
    var maximo = Math.max(ultimo.saldo, 1);
    var n = evolucao.length - 1;

    function x(i) { return m.esq + (n === 0 ? 0 : (i / n) * largura); }
    function y(v) { return m.topo + altura - (v / maximo) * altura; }

    var pontosSaldo = [];
    var pontosInvestido = [];
    for (var i = 0; i < evolucao.length; i++) {
      pontosSaldo.push(x(i).toFixed(1) + ',' + y(evolucao[i].saldo).toFixed(1));
      pontosInvestido.push(x(i).toFixed(1) + ',' + y(evolucao[i].investido).toFixed(1));
    }

    var base = x(n).toFixed(1) + ',' + y(0).toFixed(1) + ' ' + x(0).toFixed(1) + ',' + y(0).toFixed(1);

    var svg = '<svg class="grafico" viewBox="0 0 ' + L + ' ' + Alt +
              '" role="img" aria-label="Evolução do investimento ao longo do tempo" ' +
              'preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">';

    // Horizontal guides with value labels.
    for (var g = 0; g <= 4; g++) {
      var valor = (maximo / 4) * g;
      var py = y(valor);
      svg += '<line x1="' + m.esq + '" y1="' + py.toFixed(1) + '" x2="' + (L - m.dir) +
             '" y2="' + py.toFixed(1) + '" stroke="#30363d" stroke-width="1"/>';
      svg += '<text x="' + (m.esq - 8) + '" y="' + (py + 4).toFixed(1) +
             '" fill="#6e7681" font-size="11" font-family="monospace" text-anchor="end">' +
             compacto(valor) + '</text>';
    }

    svg += '<polygon points="' + pontosSaldo.join(' ') + ' ' + base + '" fill="rgba(63,185,80,0.22)"/>';
    svg += '<polygon points="' + pontosInvestido.join(' ') + ' ' + base + '" fill="rgba(88,166,255,0.28)"/>';
    svg += '<polyline points="' + pontosSaldo.join(' ') + '" fill="none" stroke="#3fb950" stroke-width="2.5"/>';
    svg += '<polyline points="' + pontosInvestido.join(' ') + '" fill="none" stroke="#58a6ff" stroke-width="2"/>';

    // Time axis: first and last labels only, to stay readable on mobile.
    svg += '<text x="' + m.esq + '" y="' + (Alt - 6) +
           '" fill="#6e7681" font-size="11" font-family="monospace">0</text>';
    svg += '<text x="' + (L - m.dir) + '" y="' + (Alt - 6) +
           '" fill="#6e7681" font-size="11" font-family="monospace" text-anchor="end">' +
           rotuloPrazo(n) + '</text>';

    svg += '</svg>';
    return svg;
  }

  function compacto(v) {
    if (v >= 1000000) return 'R$ ' + (v / 1000000).toFixed(1).replace('.', ',') + 'M';
    if (v >= 1000) return 'R$ ' + Math.round(v / 1000) + 'k';
    return 'R$ ' + Math.round(v);
  }

  function rotuloPrazo(meses) {
    if (meses % 12 === 0 && meses >= 12) {
      var anos = meses / 12;
      return anos + (anos === 1 ? ' ano' : ' anos');
    }
    return meses + ' meses';
  }

  function calcular() {
    var alvo = document.getElementById('resultado');

    var inicial = A.valorDe('inicial');
    var aporte = A.valorDe('aporte');
    var taxaInformada = A.valorDe('taxa') / 100;
    var prazo = A.inteiroDe('prazo');

    var meses = A.textoDe('periodoPrazo') === 'anos' ? prazo * 12 : prazo;
    var taxaMensal = A.textoDe('periodoTaxa') === 'ano'
      ? F.anualParaMensal(taxaInformada)
      : taxaInformada;

    if (meses <= 0) {
      alvo.innerHTML = '<div class="aviso"><p>Informe um prazo maior que zero.</p></div>';
      A.mostrarResultado('resultado');
      return;
    }
    if (meses > 960) {
      alvo.innerHTML = '<div class="aviso"><p>O prazo máximo da simulação é de 80 anos.</p></div>';
      A.mostrarResultado('resultado');
      return;
    }
    if (inicial <= 0 && aporte <= 0) {
      alvo.innerHTML = '<div class="aviso"><p>Informe um valor inicial ou um aporte mensal.</p></div>';
      A.mostrarResultado('resultado');
      return;
    }

    var r = F.jurosCompostos({
      inicial: inicial,
      aporteMensal: aporte,
      meses: meses,
      taxaMensal: taxaMensal
    });

    var participacaoJuros = r.montante > 0 ? r.totalJuros / r.montante : 0;
    var html = '';

    html += '<div class="destaque">' +
              '<div class="rotulo">Montante final em ' + rotuloPrazo(meses) + '</div>' +
              '<div class="valor">' + F.brl(r.montante) + '</div>' +
              '<p class="nota">' + F.pct(participacaoJuros, 1) +
              ' do total veio de juros, não do seu bolso.</p>' +
            '</div>';

    html += '<div class="linhas">';
    html += A.linha('Total investido', r.totalInvestido, {
      sub: 'aporte inicial mais ' + meses + ' aportes mensais'
    });
    html += A.linha('Total em juros', r.totalJuros, { tipo: 'pos' });
    html += A.linha('Montante final', r.montante, { total: true, tipo: 'pos' });
    html += A.linha('Taxa mensal equivalente', 0, {
      bruto: F.pct(taxaMensal, 4),
      sub: A.textoDe('periodoTaxa') === 'ano' ? 'convertida da taxa anual informada' : null
    });
    html += '</div>';

    html += '<h2 style="margin-top:1.6rem;font-size:1.15rem">Evolução</h2>';
    html += grafico(r.evolucao);
    html += '<div class="legenda">' +
              '<span><i class="ponto" style="background:#58a6ff"></i> Total investido</span>' +
              '<span><i class="ponto" style="background:#3fb950"></i> Montante com juros</span>' +
            '</div>';

    // Yearly milestones keep long simulations readable.
    if (meses >= 24) {
      html += '<h3 style="margin-top:1.6rem">Ano a ano</h3>';
      html += '<div class="tabela-rolagem"><table><thead><tr>' +
              '<th>Ano</th><th>Investido</th><th>Juros</th><th>Montante</th>' +
              '</tr></thead><tbody>';
      for (var mes = 12; mes <= meses; mes += 12) {
        var e = r.evolucao[mes];
        html += '<tr><td>' + (mes / 12) + '</td><td>' + F.brl(e.investido) +
                '</td><td>' + F.brl(e.juros) + '</td><td>' + F.brl(e.saldo) + '</td></tr>';
      }
      if (meses % 12 !== 0) {
        var f = r.evolucao[meses];
        html += '<tr><td>' + rotuloPrazo(meses) + '</td><td>' + F.brl(f.investido) +
                '</td><td>' + F.brl(f.juros) + '</td><td>' + F.brl(f.saldo) + '</td></tr>';
      }
      html += '</tbody></table></div>';
    }

    alvo.innerHTML = html;
    A.mostrarResultado('resultado');
  }

  function limpar() {
    ['inicial', 'aporte', 'taxa'].forEach(function (id) {
      document.getElementById(id).value = '';
    });
    document.getElementById('prazo').value = '10';
    var alvo = document.getElementById('resultado');
    alvo.innerHTML = '';
    alvo.classList.remove('visivel');
    document.getElementById('inicial').focus();
  }

  document.getElementById('calcular').addEventListener('click', calcular);
  document.getElementById('limpar').addEventListener('click', limpar);
  A.ligarEnter('formulario', calcular);

  calcular();
})();
