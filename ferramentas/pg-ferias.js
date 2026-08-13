/* Page logic — vacation pay calculator. */
(function () {
  'use strict';

  var F = window.FerramentasBR;
  var A = window.App;

  function calcular() {
    var alvo = document.getElementById('resultado');
    var salario = A.valorDe('salario');

    if (salario <= 0) {
      alvo.innerHTML = '<div class="aviso"><p>Informe o salário bruto mensal.</p></div>';
      A.mostrarResultado('resultado');
      return;
    }

    var dias = parseInt(A.textoDe('dias'), 10);
    var vendidos = parseInt(A.textoDe('vendidos'), 10);

    var r = F.ferias({
      salario: salario,
      dias: dias,
      diasVendidos: vendidos,
      dependentes: A.inteiroDe('dependentes'),
      adiantar13: A.marcadoDe('adiantar13')
    });

    var html = '';

    html += '<div class="destaque">' +
              '<div class="rotulo">Total a receber</div>' +
              '<div class="valor">' + F.brl(r.liquido) + '</div>' +
              '<p class="nota">' + r.diasGozados + ' dias de descanso' +
              (r.diasVendidos > 0 ? ' · ' + r.diasVendidos + ' dias vendidos' : '') +
              '</p>' +
            '</div>';

    html += '<div class="linhas">';
    html += A.grupo('Férias gozadas (tributável)');
    html += A.linha('Férias de ' + r.diasGozados + ' dias', r.valorFerias, { tipo: 'pos' });
    html += A.linha('Adicional de 1/3', r.terco, { tipo: 'pos' });
    html += A.linha('Base de cálculo', r.baseTributavel, { total: true });

    html += A.grupo('Descontos');
    html += A.linha('INSS', r.inss.valor, {
      tipo: 'neg',
      sub: 'alíquota efetiva de ' + F.pct(r.inss.aliquotaEfetiva, 2),
      bruto: '− ' + F.brl(r.inss.valor)
    });
    html += A.linha('IRRF', r.irrf.valor, {
      tipo: r.irrf.valor > 0 ? 'neg' : '',
      sub: r.irrf.isento
        ? (r.irrf.redutor > 0 ? 'isento pelo redutor da Lei 15.270/2025' : 'abaixo da faixa de tributação')
        : 'alíquota de ' + F.pct(r.irrf.aliquota, 1),
      bruto: r.irrf.valor > 0 ? '− ' + F.brl(r.irrf.valor) : F.brl(0)
    });

    if (r.totalAbono > 0) {
      html += A.grupo('Abono pecuniário (isento)');
      html += A.linha('Venda de ' + r.diasVendidos + ' dias', r.abono, { tipo: 'pos' });
      html += A.linha('1/3 sobre o abono', r.tercoAbono, { tipo: 'pos' });
    }

    if (r.adiantamento13 > 0) {
      html += A.grupo('Adiantamento');
      html += A.linha('1ª parcela do 13º', r.adiantamento13, {
        tipo: 'pos',
        sub: 'sem desconto agora — acertado em dezembro'
      });
    }

    html += A.linha('Líquido a receber', r.liquido, { total: true, tipo: 'pos' });
    html += '</div>';

    // Show the actual gain from selling days, computed rather than asserted.
    if (r.diasVendidos === 0) {
      var maximo = Math.floor(dias / 3);
      if (maximo > 0) {
        var vendendo = F.ferias({
          salario: salario,
          dias: dias,
          diasVendidos: maximo,
          dependentes: A.inteiroDe('dependentes'),
          adiantar13: A.marcadoDe('adiantar13')
        });
        var ganho = F.round2(vendendo.liquido - r.liquido);
        if (ganho > 0) {
          html += '<div class="aviso"><p>Vendendo ' + maximo + ' dias você receberia ' +
                  F.brl(vendendo.liquido) + ' — <strong>' + F.brl(ganho) + ' a mais</strong>, ' +
                  'porque o abono é isento de INSS e IRRF. Em troca, descansa ' +
                  (dias - maximo) + ' dias em vez de ' + dias + '.</p></div>';
        }
      }
    }

    alvo.innerHTML = html;
    A.mostrarResultado('resultado');
  }

  function limpar() {
    document.getElementById('salario').value = '';
    document.getElementById('dias').value = '30';
    document.getElementById('vendidos').value = '0';
    document.getElementById('dependentes').value = '0';
    document.getElementById('adiantar13').checked = false;
    var alvo = document.getElementById('resultado');
    alvo.innerHTML = '';
    alvo.classList.remove('visivel');
    document.getElementById('salario').focus();
  }

  document.getElementById('calcular').addEventListener('click', calcular);
  document.getElementById('limpar').addEventListener('click', limpar);
  ['dias', 'vendidos', 'adiantar13'].forEach(function (id) {
    document.getElementById(id).addEventListener('change', calcular);
  });
  A.ligarEnter('formulario', calcular);

  calcular();
})();
