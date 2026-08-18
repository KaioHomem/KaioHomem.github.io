/* Page logic — real cost of a CLT employee, from the employer's side. */
(function () {
  'use strict';

  var F = window.FerramentasBR;
  var A = window.App;

  // Nos anexos I, II, III e V do Simples esses três campos não têm efeito
  // nenhum sobre o resultado. Deixá-los na tela sugere que mexer neles
  // muda alguma coisa, e quem preenche um campo inerte perde a confiança
  // no resto da conta.
  function ajustarCampos() {
    var regime = A.textoDe('regime');
    mostrar('campoRat', regime !== 'simples');
    mostrar('campoFap', regime !== 'simples');
    mostrar('campoTerceiros', regime === 'normal');
  }

  function mostrar(id, visivel) {
    document.getElementById(id).style.display = visivel ? '' : 'none';
  }

  function calcular() {
    ajustarCampos();

    var alvo = document.getElementById('resultado');
    var salario = A.valorDe('salario');

    if (salario <= 0) {
      alvo.innerHTML = '<div class="aviso"><p>Informe o salário bruto mensal.</p></div>';
      A.mostrarResultado('resultado');
      return;
    }

    var r = F.custoFuncionario({
      salario: salario,
      regime: A.textoDe('regime'),
      rat: parseFloat(A.textoDe('rat')),
      fap: A.valorDe('fap'),
      terceiros: A.valorDe('terceiros') / 100,
      beneficios: A.valorDe('beneficios'),
      valeTransporte: A.valorDe('vt'),
      provisionarMulta: A.marcadoDe('multa')
    });

    var acima = r.multiplicador - 1;

    var html = '';

    html += '<div class="destaque">' +
              '<div class="rotulo">Custo mensal real</div>' +
              '<div class="valor">' + F.brl(r.mensal) + '</div>' +
              '<p class="nota">' + F.pct(acima, 0) + ' acima do salário — cada R$ 1,00 ' +
              'combinado custa ' + F.brl(r.multiplicador) + '</p>' +
            '</div>';

    html += '<div class="linhas">';

    html += A.grupo('Remuneração');
    html += A.linha('Salário', r.salario);
    html += A.linha('13º (provisão)', r.provisoes.decimoTerceiro, { sub: 'um doze avos por mês' });
    html += A.linha('Terço de férias (provisão)', r.provisoes.tercoFerias, {
      sub: 'só o terço — o mês de férias substitui um mês normal'
    });

    html += A.grupo('Encargos sobre a folha');
    if (r.encargos.total > 0) {
      if (r.encargos.cpp > 0) {
        html += A.linha('INSS patronal (20%)', F.round2(r.encargos.cpp / 12), { tipo: 'neg' });
      }
      if (r.encargos.rat > 0) {
        html += A.linha('RAT', F.round2(r.encargos.rat / 12), {
          tipo: 'neg',
          sub: 'alíquota efetiva de ' + F.pct(r.encargos.ratAliquota, 2) + ' após o FAP'
        });
      }
      if (r.encargos.terceiros > 0) {
        html += A.linha('Terceiros', F.round2(r.encargos.terceiros / 12), {
          tipo: 'neg',
          sub: 'Sistema S, INCRA e salário-educação'
        });
      }
    } else {
      html += A.linha('INSS patronal, RAT e terceiros', 0, {
        bruto: 'no DAS',
        sub: 'já embutidos na alíquota do Simples'
      });
    }

    html += A.grupo('FGTS');
    html += A.linha('Depósito (8%)', F.round2(r.fgts.deposito / 12), { tipo: 'neg' });
    if (r.fgts.multa > 0) {
      html += A.linha('Provisão da multa de 40%', F.round2(r.fgts.multa / 12), {
        tipo: 'neg',
        sub: 'devida só na dispensa sem justa causa'
      });
    }

    if (r.beneficios.valor > 0 || r.beneficios.vt > 0) {
      html += A.grupo('Benefícios');
      if (r.beneficios.valor > 0) {
        html += A.linha('Benefícios', F.round2(r.beneficios.valor / 12), { tipo: 'neg' });
      }
      if (r.beneficios.vt > 0) {
        html += A.linha('Vale-transporte', r.beneficios.vtMensal, {
          tipo: 'neg',
          sub: 'só o que passa de 6% do salário'
        });
      }
    }

    html += A.linha('Custo mensal', r.mensal, { total: true });
    html += '</div>';

    html += '<div class="linhas">' +
              A.linha('Custo por hora', r.custoHora, { sub: 'sobre a jornada de 220h' }) +
              A.linha('Custo no ano', r.anual, { sub: 'já com 13º, férias e encargos' }) +
            '</div>';

    html += comparar(r);

    // Um vale-transporte abaixo do teto aparece como zero na conta. Sem
    // explicação isso parece bug.
    if (A.valorDe('vt') > 0 && r.beneficios.vt === 0) {
      html += '<div class="aviso"><p><strong>O vale-transporte não entrou no custo.</strong> ' +
              'Ele cabe dentro dos 6% que a lei permite descontar do funcionário — ' +
              F.brl(F.round2(salario * 0.06)) + ' neste salário — então a empresa compra o ' +
              'passe e recupera tudo no desconto.</p></div>';
    }

    alvo.innerHTML = html;
    A.mostrarResultado('resultado');
  }

  // O regime é a variável que mais muda o resultado, e é a única que o
  // empresário pode discutir com o contador. Mostrar o outro lado vale
  // mais que qualquer explicação.
  function comparar(r) {
    var outro = r.regime === 'simples' ? 'normal' : 'simples';
    var alt = F.custoFuncionario({
      salario: r.salario,
      regime: outro,
      rat: parseFloat(A.textoDe('rat')),
      fap: A.valorDe('fap'),
      terceiros: A.valorDe('terceiros') / 100,
      beneficios: A.valorDe('beneficios'),
      valeTransporte: A.valorDe('vt'),
      provisionarMulta: A.marcadoDe('multa')
    });

    var diferenca = Math.abs(F.round2(alt.mensal - r.mensal));
    if (diferenca < 0.01) return '';

    var nome = outro === 'simples' ? 'Simples Nacional (anexos I, II, III e V)'
                                   : 'Lucro Presumido ou Real';
    var barato = alt.mensal < r.mensal;

    return '<div class="aviso"><p><strong>Para comparar:</strong> o mesmo salário no ' +
           nome + ' custaria ' + F.brl(alt.mensal) + ' por mês — ' + F.brl(diferenca) +
           (barato ? ' a menos' : ' a mais') + ', ou ' + F.brl(F.round2(diferenca * 12)) +
           ' no ano. A diferença é o INSS patronal e os terceiros, que no Simples já estão ' +
           'dentro do DAS.</p></div>';
  }

  function limpar() {
    ['beneficios', 'vt'].forEach(function (id) {
      document.getElementById(id).value = '';
    });
    document.getElementById('salario').value = '';
    document.getElementById('regime').value = 'simples';
    document.getElementById('rat').value = '0.02';
    document.getElementById('fap').value = '1,00';
    document.getElementById('terceiros').value = '5,8';
    document.getElementById('multa').checked = true;
    var alvo = document.getElementById('resultado');
    alvo.innerHTML = '';
    alvo.classList.remove('visivel');
    ajustarCampos();
    document.getElementById('salario').focus();
  }

  document.getElementById('calcular').addEventListener('click', calcular);
  document.getElementById('limpar').addEventListener('click', limpar);
  ['regime', 'rat', 'multa'].forEach(function (id) {
    document.getElementById(id).addEventListener('change', calcular);
  });
  A.ligarEnter('formulario', calcular);

  calcular();
})();
