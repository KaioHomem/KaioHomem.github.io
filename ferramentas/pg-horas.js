/* Page logic — overtime calculator. */
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

    var r = F.horasExtras({
      salario: salario,
      jornadaMensal: parseInt(A.textoDe('jornada'), 10),
      horas50: A.valorDe('horas50'),
      horas100: A.valorDe('horas100'),
      horasNoturnas: A.valorDe('horasNoturnas'),
      horaNoturnaReduzida: A.marcadoDe('horaReduzida'),
      diasUteis: A.inteiroDe('diasUteis'),
      domingosFeriados: A.inteiroDe('descansos')
    });

    if (r.total <= 0) {
      alvo.innerHTML = '<div class="linhas">' +
        A.linha('Valor da sua hora', r.valorHora, {
          sub: 'salário dividido por ' + r.jornadaMensal + ' horas'
        }) +
        '</div><div class="aviso"><p>Lance as horas extras ou noturnas para ver o valor ' +
        'a receber.</p></div>';
      A.mostrarResultado('resultado');
      return;
    }

    var html = '';

    html += '<div class="destaque">' +
              '<div class="rotulo">A receber no mês</div>' +
              '<div class="valor">' + F.brl(r.total) + '</div>' +
              '<p class="nota">além do salário — que sobe para ' +
              F.brl(r.salarioComExtras) + ' no bruto</p>' +
            '</div>';

    html += '<div class="linhas">';
    html += A.linha('Valor da sua hora normal', r.valorHora, {
      sub: 'salário dividido por ' + r.jornadaMensal + ' horas'
    });

    if (r.valor50 > 0) {
      html += A.linha(r.horas50 + 'h com adicional de 50%', r.valor50, {
        tipo: 'pos',
        sub: 'hora de ' + F.brl(F.round2(r.valorHora * 1.5))
      });
    }
    if (r.valor100 > 0) {
      html += A.linha(r.horas100 + 'h com adicional de 100%', r.valor100, {
        tipo: 'pos',
        sub: 'hora de ' + F.brl(F.round2(r.valorHora * 2))
      });
    }
    if (r.valorNoturno > 0) {
      html += A.linha('Adicional noturno (20%)', r.valorNoturno, {
        tipo: 'pos',
        sub: 'só o adicional — a hora já está no salário'
      });
    }
    if (r.valorHoraReduzida > 0) {
      html += A.linha('Hora noturna reduzida', r.valorHoraReduzida, {
        tipo: 'pos',
        sub: 'as horas trabalhadas equivalem a ' + r.horasNoturnasEquivalentes + 'h'
      });
    }
    if (r.dsr > 0) {
      html += A.linha('DSR sobre as extras', r.dsr, {
        tipo: 'pos',
        sub: 'reflexo nos domingos e feriados'
      });
    }

    html += A.linha('Total a receber', r.total, { total: true, tipo: 'pos' });
    html += '</div>';

    if (r.dsr > 0) {
      var pct = r.totalExtras > 0 ? r.dsr / r.totalExtras : 0;
      html += '<div class="aviso"><p><strong>Confira o DSR no seu holerite.</strong> ' +
              'Ele acrescenta ' + F.brl(r.dsr) + ' aqui — ' + F.pct(pct, 1) +
              ' a mais sobre as extras. É a verba que mais falta em folha de pagamento, ' +
              'e você tem direito a ela.</p></div>';
    }

    alvo.innerHTML = html;
    A.mostrarResultado('resultado');
  }

  function limpar() {
    ['salario', 'horas50', 'horas100', 'horasNoturnas'].forEach(function (id) {
      document.getElementById(id).value = '';
    });
    document.getElementById('jornada').value = '220';
    document.getElementById('diasUteis').value = '25';
    document.getElementById('descansos').value = '5';
    document.getElementById('horaReduzida').checked = false;
    var alvo = document.getElementById('resultado');
    alvo.innerHTML = '';
    alvo.classList.remove('visivel');
    document.getElementById('salario').focus();
  }

  document.getElementById('calcular').addEventListener('click', calcular);
  document.getElementById('limpar').addEventListener('click', limpar);
  ['jornada', 'horaReduzida'].forEach(function (id) {
    document.getElementById(id).addEventListener('change', calcular);
  });
  A.ligarEnter('formulario', calcular);

  calcular();
})();
