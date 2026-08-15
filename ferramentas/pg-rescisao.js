/* Page logic — termination calculator. */
(function () {
  'use strict';

  var F = window.FerramentasBR;
  var A = window.App;

  var DIA = 86400000;

  /** Parse a yyyy-mm-dd input as UTC, so timezones never shift the day. */
  function paraData(texto) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(texto || '').trim());
    if (!m) return null;
    return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  }

  function somarMeses(data, n) {
    var d = new Date(data.getTime());
    var diaOriginal = d.getUTCDate();
    d.setUTCMonth(d.getUTCMonth() + n);
    // Guard the month-end overflow: 31/jan + 1 month must not become 03/mar.
    if (d.getUTCDate() < diaOriginal) d.setUTCDate(0);
    return d;
  }

  function anosCompletos(inicio, fim) {
    var anos = fim.getUTCFullYear() - inicio.getUTCFullYear();
    if (somarMeses(inicio, anos * 12) > fim) anos--;
    return Math.max(0, anos);
  }

  /**
   * Count months in twelfths ("avos"): whole months plus a trailing
   * fraction that counts only when 15 or more days were worked.
   */
  function contarAvos(inicio, fim) {
    if (!inicio || !fim || fim < inicio) return 0;

    var meses = 0;
    var cursor = new Date(inicio.getTime());

    while (true) {
      var proximo = somarMeses(cursor, 1);
      if (proximo <= fim) {
        meses++;
        cursor = proximo;
      } else {
        break;
      }
    }

    var diasRestantes = Math.floor((fim - cursor) / DIA) + 1;
    if (diasRestantes >= 15) meses++;

    return Math.min(12, meses);
  }

  function calcular() {
    var alvo = document.getElementById('resultado');
    var salario = A.valorDe('salario');
    var admissao = paraData(A.textoDe('admissao'));
    var saida = paraData(A.textoDe('saida'));

    if (salario <= 0) {
      alvo.innerHTML = '<div class="aviso"><p>Informe o último salário bruto.</p></div>';
      A.mostrarResultado('resultado');
      return;
    }
    if (!admissao || !saida) {
      alvo.innerHTML = '<div class="aviso"><p>Preencha a data de admissão e a data do desligamento.</p></div>';
      A.mostrarResultado('resultado');
      return;
    }
    if (saida < admissao) {
      alvo.innerHTML = '<div class="aviso"><p>A data do desligamento não pode ser anterior à admissão.</p></div>';
      A.mostrarResultado('resultado');
      return;
    }

    var anos = anosCompletos(admissao, saida);

    // Vacation twelfths count from the anniversary of the current
    // acquisitive period; the 13th counts from January of the exit year.
    var inicioPeriodoFerias = somarMeses(admissao, anos * 12);
    var inicioAno = new Date(Date.UTC(saida.getUTCFullYear(), 0, 1));
    var inicio13 = admissao > inicioAno ? admissao : inicioAno;

    var r = F.rescisao({
      salario: salario,
      tipo: A.textoDe('tipo'),
      diasTrabalhadosNoMes: saida.getUTCDate(),
      anosCompletos: anos,
      mesesPara13: contarAvos(inicio13, saida),
      mesesParaFerias: contarAvos(inicioPeriodoFerias, saida),
      feriasVencidas: A.marcadoDe('feriasVencidas'),
      avisoCumprido: A.marcadoDe('avisoCumprido'),
      saldoFGTS: A.valorDe('saldoFGTS'),
      dependentes: A.inteiroDe('dependentes')
    });

    var p = r.proventos;
    var d = r.descontos;
    var html = '';

    html += '<div class="destaque">' +
              '<div class="rotulo">Total líquido da rescisão</div>' +
              '<div class="valor">' + F.brl(r.liquido) + '</div>' +
              '<p class="nota">' + anos + ' ano(s) completo(s) de contrato' +
              (r.diasAviso ? ' · aviso prévio de ' + r.diasAviso + ' dias' : '') +
              '</p>' +
            '</div>';

    html += '<div class="linhas">';
    html += A.grupo('Proventos');

    var proventos = [
      ['Saldo de salário', p.saldoSalario, saida.getUTCDate() + ' dia(s) trabalhado(s) no mês'],
      ['Aviso prévio indenizado', p.avisoPrevioIndenizado, r.diasAviso + ' dias'],
      ['13º salário proporcional', p.decimoTerceiroProporcional, null],
      ['Férias proporcionais', p.feriasProporcionais, null],
      ['1/3 sobre férias proporcionais', p.tercoFeriasProporcionais, null],
      ['Férias vencidas', p.feriasVencidas, null],
      ['1/3 sobre férias vencidas', p.tercoFeriasVencidas, null],
      ['Multa do FGTS', p.multaFGTS, null]
    ];

    var algumProvento = false;
    proventos.forEach(function (item) {
      if (item[1] > 0) {
        algumProvento = true;
        html += A.linha(item[0], item[1], { tipo: 'pos', sub: item[2] });
      }
    });
    if (!algumProvento) {
      html += A.linha('Nenhuma verba a receber', 0);
    }
    html += A.linha('Total de proventos', r.totalProventos, { total: true, tipo: 'pos' });

    if (r.totalDescontos > 0) {
      html += A.grupo('Descontos');
      var descontos = [
        ['INSS sobre saldo de salário', d.inssSaldoSalario],
        ['IRRF sobre saldo de salário', d.irrfSaldoSalario],
        ['INSS sobre 13º salário', d.inssDecimoTerceiro],
        ['IRRF sobre 13º salário', d.irrfDecimoTerceiro],
        ['Aviso prévio não cumprido', d.avisoPrevioNaoCumprido]
      ];
      descontos.forEach(function (item) {
        if (item[1] > 0) {
          html += A.linha(item[0], item[1], { tipo: 'neg', bruto: '− ' + F.brl(item[1]) });
        }
      });
      html += A.linha('Total de descontos', r.totalDescontos, {
        total: true, tipo: 'neg', bruto: '− ' + F.brl(r.totalDescontos)
      });
    }

    html += A.linha('Líquido a receber', r.liquido, { total: true, tipo: 'pos' });
    html += '</div>';

    html += '<div class="linhas" style="margin-top:1rem">';
    html += A.grupo('Além da rescisão');
    html += A.linha('FGTS disponível para saque', r.fgtsSacavel, {
      sub: 'sobre o saldo informado de ' + F.brl(A.valorDe('saldoFGTS'))
    });
    html += A.linha('Seguro-desemprego', 0, {
      bruto: r.temSeguroDesemprego ? 'Tem direito' : 'Não tem direito',
      sub: r.temSeguroDesemprego ? 'sujeito às regras de carência do programa' : null
    });
    html += '</div>';

    if (A.valorDe('saldoFGTS') <= 0 && (r.tipo === 'sem-justa-causa' || r.tipo === 'acordo')) {
      html += '<div class="aviso"><p>Você não informou o saldo do FGTS, então a multa ' +
              'ficou zerada. Consulte o saldo no aplicativo FGTS e refaça o cálculo — ' +
              'nesse tipo de desligamento a multa costuma ser uma das maiores verbas.</p></div>';
    }

    alvo.innerHTML = html;
    A.mostrarResultado('resultado');
  }

  function limpar() {
    ['salario', 'saldoFGTS', 'admissao', 'saida'].forEach(function (id) {
      document.getElementById(id).value = '';
    });
    document.getElementById('dependentes').value = '0';
    document.getElementById('feriasVencidas').checked = false;
    document.getElementById('avisoCumprido').checked = true;
    var alvo = document.getElementById('resultado');
    alvo.innerHTML = '';
    alvo.classList.remove('visivel');
  }

  /** The "vou cumprir o aviso" switch only matters when resigning. */
  function ajustarCampos() {
    var linha = document.getElementById('linhaAvisoCumprido');
    linha.style.display = A.textoDe('tipo') === 'pedido-demissao' ? '' : 'none';
  }

  document.getElementById('calcular').addEventListener('click', calcular);
  document.getElementById('limpar').addEventListener('click', limpar);
  document.getElementById('tipo').addEventListener('change', ajustarCampos);
  A.ligarEnter('formulario', calcular);

  // Seed a realistic example: hired two years ago, leaving today.
  (function semear() {
    var hoje = new Date();
    var saida = document.getElementById('saida');
    var admissao = document.getElementById('admissao');

    function iso(d) { return d.toISOString().slice(0, 10); }

    saida.value = iso(hoje);
    var doisAnosAtras = new Date(hoje.getTime());
    doisAnosAtras.setFullYear(doisAnosAtras.getFullYear() - 2);
    admissao.value = iso(doisAnosAtras);
  })();

  ajustarCampos();
  calcular();
})();
