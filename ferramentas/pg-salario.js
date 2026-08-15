/* Page logic — net salary calculator. */
(function () {
  'use strict';

  var F = window.FerramentasBR;
  var A = window.App;

  function calcular() {
    var bruto = A.valorDe('bruto');
    var r = F.salarioLiquido({
      bruto: bruto,
      dependentes: A.inteiroDe('dependentes'),
      pensao: A.valorDe('pensao'),
      outrosDescontos: A.valorDe('outros')
    });

    var alvo = document.getElementById('resultado');

    if (bruto <= 0) {
      alvo.innerHTML = '<div class="aviso"><p>Informe um salário bruto maior que zero.</p></div>';
      A.mostrarResultado('resultado');
      return;
    }

    var html = '';

    html += '<div class="destaque">' +
              '<div class="rotulo">Salário líquido</div>' +
              '<div class="valor">' + F.brl(r.liquido) + '</div>' +
              '<p class="nota">' + F.pct(r.percentualDescontado, 1) +
              ' do bruto vai em descontos obrigatórios.</p>' +
            '</div>';

    html += '<div class="linhas">';
    html += A.linha('Salário bruto', r.bruto);

    html += A.grupo('Descontos');
    html += A.linha(
      'INSS',
      r.inss.valor,
      {
        tipo: 'neg',
        sub: 'alíquota efetiva de ' + F.pct(r.inss.aliquotaEfetiva, 2) +
             (r.inss.teto ? ' · teto atingido' : ''),
        bruto: '− ' + F.brl(r.inss.valor)
      }
    );

    var subIRRF;
    if (r.irrf.isento) {
      subIRRF = r.irrf.redutor > 0
        ? 'isento pelo redutor da Lei 15.270/2025'
        : 'abaixo da faixa de tributação';
    } else {
      subIRRF = 'base de ' + F.brl(r.irrf.base) + ' · alíquota de ' + F.pct(r.irrf.aliquota, 1);
      if (r.irrf.redutor > 0) {
        subIRRF += ' · redutor de ' + F.brl(r.irrf.redutor);
      }
      if (r.irrf.usouDescontoSimplificado) {
        subIRRF += ' · desconto simplificado';
      }
    }
    html += A.linha('IRRF', r.irrf.valor, {
      tipo: r.irrf.valor > 0 ? 'neg' : '',
      sub: subIRRF,
      bruto: r.irrf.valor > 0 ? '− ' + F.brl(r.irrf.valor) : F.brl(0)
    });

    if (r.pensao > 0) {
      html += A.linha('Pensão alimentícia', r.pensao, { tipo: 'neg', bruto: '− ' + F.brl(r.pensao) });
    }
    if (r.outrosDescontos > 0) {
      html += A.linha('Outros descontos', r.outrosDescontos, { tipo: 'neg', bruto: '− ' + F.brl(r.outrosDescontos) });
    }

    html += A.linha('Total de descontos', r.totalDescontos, {
      total: true, tipo: 'neg', bruto: '− ' + F.brl(r.totalDescontos)
    });
    html += A.linha('Líquido a receber', r.liquido, { total: true, tipo: 'pos' });
    html += '</div>';

    html += '<div class="linhas" style="margin-top:1rem">';
    html += A.grupo('Depositado pelo empregador (não é desconto)');
    html += A.linha('FGTS do mês', r.fgtsMensal, {
      sub: '8% do bruto, em conta vinculada no seu nome'
    });
    html += '</div>';

    if (r.irrf.isento && bruto > 3000) {
      html += '<div class="aviso"><p><strong>Você está isento de IRRF.</strong> ' +
              'A isenção vale para rendimentos de até R$ 5.000 por mês e diminui ' +
              'gradualmente até R$ 7.350.</p></div>';
    }

    alvo.innerHTML = html;
    A.mostrarResultado('resultado');
  }

  function limpar() {
    ['bruto', 'pensao', 'outros'].forEach(function (id) {
      document.getElementById(id).value = '';
    });
    document.getElementById('dependentes').value = '0';
    var alvo = document.getElementById('resultado');
    alvo.innerHTML = '';
    alvo.classList.remove('visivel');
    document.getElementById('bruto').focus();
  }

  document.getElementById('calcular').addEventListener('click', calcular);
  document.getElementById('limpar').addEventListener('click', limpar);
  A.ligarEnter('formulario', calcular);

  // Show a filled-in example on first load so the page is never a blank form.
  calcular();
})();
