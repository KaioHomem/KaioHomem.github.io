/* Page logic — 13th salary calculator. */
(function () {
  'use strict';

  var F = window.FerramentasBR;
  var A = window.App;

  function calcular() {
    var alvo = document.getElementById('resultado');
    var salario = A.valorDe('salario');
    var meses = A.inteiroDe('meses');

    if (salario <= 0) {
      alvo.innerHTML = '<div class="aviso"><p>Informe o salário bruto mensal.</p></div>';
      A.mostrarResultado('resultado');
      return;
    }
    if (meses <= 0) {
      alvo.innerHTML = '<div class="aviso"><p>Sem meses trabalhados não há 13º a receber.</p></div>';
      A.mostrarResultado('resultado');
      return;
    }

    var r = F.decimoTerceiro({
      salario: salario,
      meses: meses,
      dependentes: A.inteiroDe('dependentes'),
      pensao: A.valorDe('pensao')
    });

    var html = '';

    html += '<div class="par-destaque">';
    html += '<div class="destaque neutro">' +
              '<div class="rotulo">1ª parcela · até 30/nov</div>' +
              '<div class="valor">' + F.brl(r.primeiraParcela) + '</div>' +
              '<p class="nota">sem nenhum desconto</p>' +
            '</div>';
    html += '<div class="destaque">' +
              '<div class="rotulo">2ª parcela · até 20/dez</div>' +
              '<div class="valor">' + F.brl(r.segundaParcela) + '</div>' +
              '<p class="nota">já com INSS e IRRF do 13º inteiro</p>' +
            '</div>';
    html += '</div>';

    html += '<div class="linhas">';
    html += A.linha('13º bruto', r.bruto, {
      sub: r.integral ? '12 meses trabalhados — salário cheio' : meses + '/12 do salário'
    });

    html += A.grupo('Descontos, cobrados só na 2ª parcela');
    html += A.linha('INSS', r.inss.valor, {
      tipo: 'neg',
      sub: 'base própria, separada do salário do mês',
      bruto: '− ' + F.brl(r.inss.valor)
    });
    html += A.linha('IRRF', r.irrf.valor, {
      tipo: r.irrf.valor > 0 ? 'neg' : '',
      sub: r.irrf.isento
        ? (r.irrf.redutor > 0 ? 'isento pelo redutor da Lei 15.270/2025' : 'abaixo da faixa de tributação')
        : 'alíquota de ' + F.pct(r.irrf.aliquota, 1),
      bruto: r.irrf.valor > 0 ? '− ' + F.brl(r.irrf.valor) : F.brl(0)
    });
    html += A.linha('Total de descontos', r.totalDescontos, {
      total: true, tipo: 'neg', bruto: '− ' + F.brl(r.totalDescontos)
    });
    html += A.linha('13º líquido no ano', r.liquido, { total: true, tipo: 'pos' });
    html += '</div>';

    html += '<div class="linhas" style="margin-top:1rem">';
    html += A.grupo('Depositado pelo empregador (não é desconto)');
    html += A.linha('FGTS sobre o 13º', r.fgts, { sub: '8% do valor bruto' });
    html += '</div>';

    if (r.segundaParcela < r.primeiraParcela) {
      var diferenca = F.round2(r.primeiraParcela - r.segundaParcela);
      html += '<div class="aviso"><p>A segunda parcela vem ' + F.brl(diferenca) +
              ' menor que a primeira. Não é erro: a primeira é paga bruta, e todos os ' +
              'descontos do décimo terceiro caem de uma vez na segunda.</p></div>';
    }

    alvo.innerHTML = html;
    A.mostrarResultado('resultado');
  }

  function limpar() {
    ['salario', 'pensao'].forEach(function (id) {
      document.getElementById(id).value = '';
    });
    document.getElementById('meses').value = '12';
    document.getElementById('dependentes').value = '0';
    var alvo = document.getElementById('resultado');
    alvo.innerHTML = '';
    alvo.classList.remove('visivel');
    document.getElementById('salario').focus();
  }

  document.getElementById('calcular').addEventListener('click', calcular);
  document.getElementById('limpar').addEventListener('click', limpar);
  A.ligarEnter('formulario', calcular);

  calcular();
})();
