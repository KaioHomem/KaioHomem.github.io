/* Page logic — CLT vs PJ comparison. */
(function () {
  'use strict';

  var F = window.FerramentasBR;
  var A = window.App;

  function calcular() {
    var alvo = document.getElementById('resultado');
    var salario = A.valorDe('salario');

    if (salario <= 0) {
      alvo.innerHTML = '<div class="aviso"><p>Informe o salário CLT bruto.</p></div>';
      A.mostrarResultado('resultado');
      return;
    }

    var r = F.cltVsPj({
      salario: salario,
      dependentes: A.inteiroDe('dependentes'),
      beneficios: A.valorDe('beneficios'),
      contadorMensal: A.valorDe('contador'),
      proLabore: A.valorDe('proLabore'),
      anexo: A.textoDe('anexo')
    });

    var html = '';

    html += '<div class="destaque">' +
              '<div class="rotulo">Para empatar, você precisa faturar</div>' +
              '<div class="valor">' + F.brl(r.pj.faturamentoEquivalente) + '</div>' +
              '<p class="nota">' + F.pct(r.premioNecessario, 1) +
              ' acima do salário CLT de ' + F.brl(r.clt.bruto) + ' — e isso é empate, não ganho.</p>' +
            '</div>';

    html += '<div class="linhas">';
    html += A.grupo('O que a CLT vale por mês, de verdade');
    html += A.linha('Salário líquido', r.clt.liquidoMensal, { tipo: 'pos' });
    html += A.linha('13º salário', F.round2(r.clt.decimoTerceiro / 12), {
      tipo: 'pos', sub: 'diluído por mês · ' + F.brl(r.clt.decimoTerceiro) + ' no ano'
    });
    html += A.linha('Terço de férias', F.round2(r.clt.ganhoFerias / 12), {
      tipo: 'pos', sub: 'diluído por mês · ' + F.brl(r.clt.ganhoFerias) + ' no ano'
    });
    if (r.clt.beneficiosAno > 0) {
      html += A.linha('Benefícios', F.round2(r.clt.beneficiosAno / 12), {
        tipo: 'pos', sub: 'sem desconto de imposto'
      });
    }
    html += A.linha('FGTS', F.round2(r.clt.fgtsAno / 12), {
      tipo: 'pos', sub: '8% sobre 13 salários · ' + F.brl(r.clt.fgtsAno) + ' no ano'
    });
    html += A.linha('Valor mensal equivalente', r.clt.mensalEquivalente, { total: true, tipo: 'pos' });

    html += A.grupo('Para chegar no mesmo valor como PJ');
    html += A.linha('Faturamento necessário', r.pj.faturamentoEquivalente, { tipo: 'pos' });
    html += A.linha('Simples Nacional', r.pj.imposto, {
      tipo: 'neg',
      sub: 'Anexo ' + r.pj.anexo + ' · faixa ' + r.pj.faixa + ' · alíquota efetiva de ' +
           F.pct(r.pj.aliquotaEfetiva, 2),
      bruto: '− ' + F.brl(r.pj.imposto)
    });
    html += A.linha('INSS sobre o pró-labore', r.pj.inssProLabore, {
      tipo: 'neg', sub: '11% sobre ' + F.brl(r.pj.proLabore), bruto: '− ' + F.brl(r.pj.inssProLabore)
    });
    if (r.pj.contador > 0) {
      html += A.linha('Contador', r.pj.contador, { tipo: 'neg', bruto: '− ' + F.brl(r.pj.contador) });
    }
    html += A.linha('Sobra no bolso', r.pj.liquido, { total: true, tipo: 'pos' });
    html += '</div>';

    if (r.pj.foraDoModelo) {
      html += '<div class="aviso"><p><strong>Fora do que esta calculadora modela.</strong> ' +
              'O faturamento passou de R$ 720 mil por ano. As faixas acima disso não estão ' +
              'implementadas aqui de propósito — em vez de mostrar um número que eu não ' +
              'consegui verificar, prefiro dizer que não sei. Consulte seu contador.</p></div>';
    }

    if (r.pj.perdeAnexoIII && A.textoDe('anexo') === 'III') {
      html += '<div class="aviso"><p><strong>Atenção ao Fator R.</strong> ' +
              'Com pró-labore de ' + F.brl(r.pj.proLabore) + ' e esse faturamento, sua folha ' +
              'representa ' + F.pct(r.pj.fatorR, 1) + ' da receita — abaixo dos 28% exigidos. ' +
              'Na prática você cairia no <strong>Anexo V</strong>, começando em 15,5% em vez ' +
              'de 6%. Aumente o pró-labore ou refaça a conta pelo Anexo V.</p></div>';
    }

    html += '<div class="aviso"><p>Esse número é o <strong>ponto de empate</strong>. ' +
            'Ele não paga a estabilidade, o seguro-desemprego, a multa de 40% nem a licença ' +
            'médica que você deixa para trás. Se a proposta PJ estiver perto disso, ' +
            'financeiramente ela é igual — e você assume todo o risco.</p></div>';

    alvo.innerHTML = html;
    A.mostrarResultado('resultado');
  }

  function limpar() {
    ['salario', 'beneficios', 'contador'].forEach(function (id) {
      document.getElementById(id).value = '';
    });
    document.getElementById('dependentes').value = '0';
    document.getElementById('proLabore').value = '1.621,00';
    document.getElementById('anexo').value = 'III';
    var alvo = document.getElementById('resultado');
    alvo.innerHTML = '';
    alvo.classList.remove('visivel');
    document.getElementById('salario').focus();
  }

  document.getElementById('calcular').addEventListener('click', calcular);
  document.getElementById('limpar').addEventListener('click', limpar);
  document.getElementById('anexo').addEventListener('change', calcular);
  A.ligarEnter('formulario', calcular);

  calcular();
})();
