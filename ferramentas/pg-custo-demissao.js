/* Page logic — what a dismissal costs the employer. */
(function () {
  'use strict';

  var F = window.FerramentasBR;
  var A = window.App;

  function ajustarCampos() {
    var regime = A.textoDe('regime');
    document.getElementById('campoRat').style.display = regime === 'simples' ? 'none' : '';
    document.getElementById('campoTerceiros').style.display = regime === 'normal' ? '' : 'none';
  }

  function entradas() {
    return {
      salario: A.valorDe('salario'),
      tipo: A.textoDe('tipo'),
      regime: A.textoDe('regime'),
      anosCompletos: A.inteiroDe('anosCompletos'),
      saldoFGTS: A.valorDe('saldoFGTS'),
      diasTrabalhadosNoMes: A.inteiroDe('diasTrabalhadosNoMes'),
      mesesPara13: A.inteiroDe('mesesPara13'),
      mesesParaFerias: A.inteiroDe('mesesParaFerias'),
      feriasVencidas: A.marcadoDe('feriasVencidas'),
      rat: parseFloat(A.textoDe('rat')),
      terceiros: A.valorDe('terceiros') / 100
    };
  }

  function calcular() {
    ajustarCampos();

    var alvo = document.getElementById('resultado');
    var dados = entradas();

    if (dados.salario <= 0) {
      alvo.innerHTML = '<div class="aviso"><p>Informe o salário bruto mensal.</p></div>';
      A.mostrarResultado('resultado');
      return;
    }

    var c = F.custoDemissao(dados);
    var p = c.rescisao.proventos;

    var html = '';

    html += '<div class="destaque">' +
              '<div class="rotulo">Sai do caixa</div>' +
              '<div class="valor">' + F.brl(c.total) + '</div>' +
              '<p class="nota">' + c.emSalarios.toFixed(1).replace('.', ',') +
              ' salários — o termo de rescisão mostra ' + F.brl(c.aoTrabalhador) + '</p>' +
            '</div>';

    html += '<div class="linhas">';
    html += A.grupo('Verbas rescisórias');
    if (p.saldoSalario > 0) html += A.linha('Saldo de salário', p.saldoSalario);
    if (p.avisoPrevioIndenizado > 0) {
      html += A.linha('Aviso prévio indenizado', p.avisoPrevioIndenizado, {
        sub: c.rescisao.diasAviso + ' dias'
      });
    }
    if (p.decimoTerceiroProporcional > 0) html += A.linha('13º proporcional', p.decimoTerceiroProporcional);
    if (p.feriasProporcionais > 0) {
      html += A.linha('Férias proporcionais + 1/3',
        F.round2(p.feriasProporcionais + p.tercoFeriasProporcionais));
    }
    if (p.feriasVencidas > 0) {
      html += A.linha('Férias vencidas + 1/3',
        F.round2(p.feriasVencidas + p.tercoFeriasVencidas));
    }
    if (p.multaFGTS > 0) {
      html += A.linha('Multa de 40% do FGTS', p.multaFGTS, {
        sub: 'sobre o saldo depositado, sem projetar o aviso'
      });
    }

    html += A.grupo('Encargos do empregador');
    if (c.encargos.inssPatronal > 0) {
      html += A.linha('INSS patronal', c.encargos.inssPatronal, {
        tipo: 'neg',
        sub: F.pct(c.encargos.aliquota, 1) + ' sobre ' + F.brl(c.encargos.basePatronal) +
             ' — fora o aviso e as férias'
      });
    } else {
      html += A.linha('INSS patronal', 0, {
        bruto: 'no DAS',
        sub: 'já embutido na alíquota do Simples'
      });
    }
    html += A.linha('FGTS sobre as verbas', c.encargos.fgtsSobreVerbas, {
      tipo: 'neg',
      sub: '8% sobre ' + F.brl(c.encargos.baseFgts) + ' — inclui o aviso indenizado'
    });

    html += A.linha('Total que sai do caixa', c.total, { total: true });
    html += '</div>';

    html += '<div class="linhas">' +
              A.linha('O trabalhador recebe', c.aoTrabalhador, {
                sub: 'é este o número do termo de rescisão'
              }) +
              A.linha('Retido e repassado ao governo', c.retidoDoTrabalhador, {
                sub: 'INSS e IRRF descontados dele'
              }) +
              A.linha('Encargos que só a empresa vê', c.encargos.total, {
                sub: 'não aparecem em documento nenhum do funcionário'
              }) +
            '</div>';

    html += pesoDaMulta(c);
    html += compararRegime(c, dados);

    alvo.innerHTML = html;
    A.mostrarResultado('resultado');
  }

  // A multa cresce com o tempo de casa e costuma dominar a conta. Quem
  // não sabe disso demite achando que vai pagar um mês.
  function pesoDaMulta(c) {
    if (c.multaFGTS <= 0 || c.total <= 0) return '';
    var fatia = c.multaFGTS / c.total;
    if (fatia < 0.2) return '';
    return '<div class="aviso"><p><strong>A multa de 40% é ' + F.pct(fatia, 0) +
           ' da conta.</strong> Ela incide sobre tudo que foi depositado de FGTS naquele ' +
           'contrato, então cresce com o tempo de casa — não com o salário. É o item que ' +
           'transforma uma demissão barata numa cara.</p></div>';
  }

  function compararRegime(c, dados) {
    var outro = c.regime === 'simples' ? 'normal' : 'simples';
    var alt = {};
    for (var k in dados) alt[k] = dados[k];
    alt.regime = outro;

    var r = F.custoDemissao(alt);
    var dif = Math.abs(F.round2(r.total - c.total));
    if (dif < 0.01) return '';

    var nome = outro === 'simples' ? 'Simples Nacional (anexos I, II, III e V)'
                                   : 'Lucro Presumido ou Real';
    return '<div class="aviso"><p><strong>Para comparar:</strong> a mesma demissão no ' +
           nome + ' custaria ' + F.brl(r.total) + ' — ' + F.brl(dif) +
           (r.total < c.total ? ' a menos' : ' a mais') +
           '. A multa de 40% e o FGTS sobre as verbas não mudam com o regime; só o INSS ' +
           'patronal muda.</p></div>';
  }

  function limpar() {
    document.getElementById('salario').value = '';
    document.getElementById('saldoFGTS').value = '';
    document.getElementById('tipo').value = 'sem-justa-causa';
    document.getElementById('regime').value = 'simples';
    document.getElementById('anosCompletos').value = '0';
    document.getElementById('diasTrabalhadosNoMes').value = '0';
    document.getElementById('mesesPara13').value = '0';
    document.getElementById('mesesParaFerias').value = '0';
    document.getElementById('rat').value = '0.02';
    document.getElementById('terceiros').value = '5,8';
    document.getElementById('feriasVencidas').checked = false;
    var alvo = document.getElementById('resultado');
    alvo.innerHTML = '';
    alvo.classList.remove('visivel');
    ajustarCampos();
    document.getElementById('salario').focus();
  }

  document.getElementById('calcular').addEventListener('click', calcular);
  document.getElementById('limpar').addEventListener('click', limpar);
  ['tipo', 'regime', 'rat', 'feriasVencidas'].forEach(function (id) {
    document.getElementById(id).addEventListener('change', calcular);
  });
  A.ligarEnter('formulario', calcular);

  calcular();
})();
