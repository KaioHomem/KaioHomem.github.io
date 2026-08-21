/* Page logic — loan simulator comparing Price and SAC. */
(function () {
  'use strict';

  var F = window.FerramentasBR;
  var A = window.App;

  var LINHAS_INICIAIS = 12;
  var ultimoResultado = null;
  var sistemaVisivel = 'price';
  var tabelaExpandida = false;

  function calcular() {
    var alvo = document.getElementById('resultado');

    var valor = A.valorDe('valor');
    var entrada = A.valorDe('entrada');
    var taxaInformada = A.valorDe('taxa') / 100;
    var meses = A.inteiroDe('prazo');

    var taxaMensal = A.textoDe('periodoTaxa') === 'ano'
      ? F.anualParaMensal(taxaInformada)
      : taxaInformada;

    if (valor <= 0) {
      alvo.innerHTML = '<div class="aviso"><p>Informe o valor do bem.</p></div>';
      A.mostrarResultado('resultado');
      return;
    }
    if (entrada >= valor) {
      alvo.innerHTML = '<div class="aviso"><p>A entrada cobre o valor total — não há o que financiar.</p></div>';
      A.mostrarResultado('resultado');
      return;
    }
    if (meses <= 0 || meses > 600) {
      alvo.innerHTML = '<div class="aviso"><p>Informe um prazo entre 1 e 600 meses.</p></div>';
      A.mostrarResultado('resultado');
      return;
    }

    ultimoResultado = F.financiamento({
      valor: valor,
      entrada: entrada,
      meses: meses,
      taxaMensal: taxaMensal
    });
    tabelaExpandida = false;

    desenhar();
    A.mostrarResultado('resultado');
  }

  function desenhar() {
    var r = ultimoResultado;
    if (!r) return;

    var economia = F.round2(r.price.totalJuros - r.sac.totalJuros);
    var html = '';

    html += '<div class="par-destaque">';
    html += '<div class="destaque neutro">' +
              '<div class="rotulo">Price · parcela fixa</div>' +
              '<div class="valor">' + F.brl(r.price.primeira) + '</div>' +
              '<p class="nota">' + F.brl(r.price.totalJuros) + ' de juros no total</p>' +
            '</div>';
    html += '<div class="destaque">' +
              '<div class="rotulo">SAC · 1ª parcela</div>' +
              '<div class="valor">' + F.brl(r.sac.primeira) + '</div>' +
              '<p class="nota">cai até ' + F.brl(r.sac.ultima) + ' · ' +
              F.brl(r.sac.totalJuros) + ' de juros</p>' +
            '</div>';
    html += '</div>';

    html += '<div class="linhas">';
    html += A.linha('Valor financiado', r.principal, {
      sub: 'valor do bem menos a entrada'
    });

    html += A.grupo('Tabela Price');
    html += A.linha('Parcela', r.price.primeira, { sub: 'igual do início ao fim' });
    html += A.linha('Total de juros', r.price.totalJuros, { tipo: 'neg' });
    html += A.linha('Total pago', r.price.totalPago, { total: true });

    html += A.grupo('SAC');
    html += A.linha('Primeira parcela', r.sac.primeira);
    html += A.linha('Última parcela', r.sac.ultima);
    html += A.linha('Total de juros', r.sac.totalJuros, { tipo: 'neg' });
    html += A.linha('Total pago', r.sac.totalPago, { total: true });
    html += '</div>';

    html += '<div class="aviso"><p>Escolhendo <strong>SAC</strong> você paga ' +
            F.brl(economia) + ' a menos de juros, mas a primeira parcela fica ' +
            F.brl(F.round2(r.sac.primeira - r.price.primeira)) + ' mais alta.</p></div>';

    html += '<h2 style="margin-top:1.6rem;font-size:1.15rem">Tabela de amortização</h2>';
    html += '<div class="botoes" style="margin-top:0.4rem;margin-bottom:1rem">' +
              botaoSistema('price', 'Price') +
              botaoSistema('sac', 'SAC') +
            '</div>';

    var parcelas = r[sistemaVisivel].parcelas;
    var limite = tabelaExpandida ? parcelas.length : Math.min(LINHAS_INICIAIS, parcelas.length);

    html += '<div class="tabela-rolagem"><table><thead><tr>' +
            '<th>Nº</th><th>Parcela</th><th>Juros</th><th>Amortização</th><th>Saldo devedor</th>' +
            '</tr></thead><tbody>';
    for (var i = 0; i < limite; i++) {
      var p = parcelas[i];
      html += '<tr><td>' + p.n + '</td><td>' + F.brl(p.parcela) + '</td><td>' +
              F.brl(p.juros) + '</td><td>' + F.brl(p.amortizacao) + '</td><td>' +
              F.brl(p.saldo) + '</td></tr>';
    }
    html += '</tbody></table></div>';

    if (parcelas.length > LINHAS_INICIAIS) {
      html += '<div class="botoes"><button type="button" class="btn btn-vazado" id="alternarTabela">' +
              (tabelaExpandida
                ? 'Mostrar apenas as primeiras ' + LINHAS_INICIAIS
                : 'Ver todas as ' + parcelas.length + ' parcelas') +
              '</button></div>';
    }

    document.getElementById('resultado').innerHTML = html;
    ligarControles();
  }

  function botaoSistema(id, rotulo) {
    var classe = sistemaVisivel === id ? 'btn' : 'btn btn-vazado';
    return '<button type="button" class="' + classe + '" data-sistema="' + id + '">' + rotulo + '</button>';
  }

  function ligarControles() {
    var botoes = document.querySelectorAll('[data-sistema]');
    for (var i = 0; i < botoes.length; i++) {
      botoes[i].addEventListener('click', function () {
        sistemaVisivel = this.getAttribute('data-sistema');
        tabelaExpandida = false;
        desenhar();
      });
    }

    var alternar = document.getElementById('alternarTabela');
    if (alternar) {
      alternar.addEventListener('click', function () {
        tabelaExpandida = !tabelaExpandida;
        desenhar();
      });
    }
  }

  function limpar() {
    ['valor', 'entrada', 'taxa'].forEach(function (id) {
      document.getElementById(id).value = '';
    });
    document.getElementById('prazo').value = '360';
    ultimoResultado = null;
    var alvo = document.getElementById('resultado');
    alvo.innerHTML = '';
    alvo.classList.remove('visivel');
    document.getElementById('valor').focus();
  }

  document.getElementById('calcular').addEventListener('click', calcular);
  document.getElementById('limpar').addEventListener('click', limpar);
  A.ligarEnter('formulario', calcular);

  calcular();
})();
