/* ===================================================
   FERRAMENTAS BR — CALCULATION CORE
   Pure functions, no DOM. Runs in browser and Node
   (Node is used by the CI test suite).

   All fiscal tables live in TABELAS below — this is
   the single source of truth. To update for a new
   year, edit only that object.
   =================================================== */

(function (root) {
  'use strict';

  /* ---------- FISCAL TABLES ---------- */
  var TABELAS = {
    ano: 2026,
    atualizadoEm: '2026-08-12',

    // INSS — progressive, applied bracket by bracket.
    // Source: Portaria Interministerial MPS/MF (vigência jan/2026).
    inss: {
      teto: 8475.55,
      salarioMinimo: 1621.00,
      faixas: [
        { ate: 1621.00, aliquota: 0.075 },
        { ate: 2902.84, aliquota: 0.09 },
        { ate: 4354.27, aliquota: 0.12 },
        { ate: 8475.55, aliquota: 0.14 }
      ]
    },

    // IRRF — monthly progressive table (unchanged since May/2025).
    // The 2026 exemption up to R$ 5.000 is delivered by `redutor`,
    // not by changing the brackets (Lei 15.270/2025).
    irrf: {
      faixas: [
        { ate: 2428.80, aliquota: 0,     deduzir: 0 },
        { ate: 2826.65, aliquota: 0.075, deduzir: 182.16 },
        { ate: 3751.05, aliquota: 0.15,  deduzir: 394.16 },
        { ate: 4664.68, aliquota: 0.225, deduzir: 675.49 },
        { ate: Infinity, aliquota: 0.275, deduzir: 908.73 }
      ],
      descontoSimplificado: 607.20,
      deducaoDependente: 189.59,
      // Redutor = constante - (indice * rendimento bruto), floored at 0,
      // and 0 for gross income above `limite`.
      redutor: { limite: 7350.00, constante: 978.62, indice: 0.133145 }
    },

    fgts: { aliquota: 0.08 }
  };

  /* ---------- HELPERS ---------- */
  /**
   * Round to cents, half-up.
   *
   * Naive `Math.round(n * 100) / 100` is wrong for payroll: 1621 * 0.075
   * is 121.575 in decimal but lands just below it in binary, so it would
   * round down to 121.57 while every Brazilian payroll rounds to 121.58.
   * Re-parsing through decimal exponent notation removes that binary drift
   * before the rounding decision is made.
   */
  function round2(n) {
    var v = Number(n);
    if (!isFinite(v)) return 0;
    var sinal = v < 0 ? -1 : 1;
    var escalado = Math.abs(v) * 100;
    // Nudge by a relative epsilon: a product that should sit exactly on a
    // half-cent in decimal can land a few ULPs below it in binary, and
    // would otherwise round down. The nudge is ~1e-9 of the value itself,
    // far too small to move any figure that is not already on the boundary.
    return sinal * Math.round(escalado + escalado * 1e-9) / 100;
  }

  function positivo(n) {
    var v = Number(n);
    return isFinite(v) && v > 0 ? v : 0;
  }

  /* ---------- INSS ---------- */
  /**
   * Progressive INSS contribution for a CLT employee.
   * Each bracket's rate applies only to the slice of salary inside it.
   */
  function calcularINSS(salario) {
    var bruto = positivo(salario);
    var faixas = TABELAS.inss.faixas;
    var total = 0;
    var piso = 0;
    var detalhe = [];

    for (var i = 0; i < faixas.length; i++) {
      var faixa = faixas[i];
      if (bruto <= piso) break;

      var baseFaixa = Math.min(bruto, faixa.ate) - piso;
      var valorFaixa = baseFaixa * faixa.aliquota;
      total += valorFaixa;

      detalhe.push({
        de: piso,
        ate: faixa.ate,
        aliquota: faixa.aliquota,
        base: round2(baseFaixa),
        valor: round2(valorFaixa)
      });

      piso = faixa.ate;
    }

    var valor = round2(total);
    return {
      valor: valor,
      teto: bruto >= TABELAS.inss.teto,
      aliquotaEfetiva: bruto > 0 ? valor / bruto : 0,
      detalhe: detalhe
    };
  }

  /* ---------- IRRF ---------- */
  function impostoPelaTabela(base) {
    var faixas = TABELAS.irrf.faixas;
    for (var i = 0; i < faixas.length; i++) {
      if (base <= faixas[i].ate) {
        return {
          imposto: Math.max(0, base * faixas[i].aliquota - faixas[i].deduzir),
          aliquota: faixas[i].aliquota
        };
      }
    }
    return { imposto: 0, aliquota: 0 };
  }

  /**
   * Reduction introduced by Lei 15.270/2025, applied *after* the
   * progressive table. It is what makes income up to R$ 5.000 exempt
   * and phases out linearly to zero at R$ 7.350.
   */
  function calcularRedutor(rendimentoBruto) {
    var r = TABELAS.irrf.redutor;
    if (rendimentoBruto > r.limite) return 0;
    return Math.max(0, round2(r.constante - r.indice * rendimentoBruto));
  }

  /**
   * IRRF withheld at source.
   * Compares the legal-deduction base against the simplified discount
   * and keeps whichever produces the lower tax, as allowed by
   * IN RFB 2.141/2023.
   */
  function calcularIRRF(opcoes) {
    var o = opcoes || {};
    var bruto = positivo(o.bruto);
    var inss = positivo(o.inss);
    var dependentes = Math.max(0, parseInt(o.dependentes, 10) || 0);
    var pensao = positivo(o.pensao);

    var baseLegal = Math.max(
      0,
      bruto - inss - dependentes * TABELAS.irrf.deducaoDependente - pensao
    );
    var baseSimplificada = Math.max(0, bruto - TABELAS.irrf.descontoSimplificado);

    var porLegal = impostoPelaTabela(baseLegal);
    var porSimplificada = impostoPelaTabela(baseSimplificada);

    var usouSimplificado = porSimplificada.imposto < porLegal.imposto;
    var escolhida = usouSimplificado ? porSimplificada : porLegal;
    var base = usouSimplificado ? baseSimplificada : baseLegal;

    var redutor = calcularRedutor(bruto);
    var impostoBruto = round2(escolhida.imposto);
    var valor = round2(Math.max(0, impostoBruto - redutor));

    return {
      valor: valor,
      base: round2(base),
      aliquota: escolhida.aliquota,
      impostoAntesDoRedutor: impostoBruto,
      redutor: Math.min(redutor, impostoBruto),
      usouDescontoSimplificado: usouSimplificado,
      isento: valor === 0
    };
  }

  /* ---------- NET SALARY ---------- */
  /**
   * Net CLT salary. `outrosDescontos` covers things this calculator
   * cannot know (health plan, transport voucher, union dues).
   */
  function salarioLiquido(opcoes) {
    var o = opcoes || {};
    var bruto = positivo(o.bruto);
    var outros = positivo(o.outrosDescontos);

    var inss = calcularINSS(bruto);
    var irrf = calcularIRRF({
      bruto: bruto,
      inss: inss.valor,
      dependentes: o.dependentes,
      pensao: o.pensao
    });

    var pensao = positivo(o.pensao);
    var totalDescontos = round2(inss.valor + irrf.valor + pensao + outros);
    var liquido = round2(bruto - totalDescontos);

    return {
      bruto: round2(bruto),
      inss: inss,
      irrf: irrf,
      pensao: round2(pensao),
      outrosDescontos: round2(outros),
      totalDescontos: totalDescontos,
      liquido: liquido,
      fgtsMensal: round2(bruto * TABELAS.fgts.aliquota),
      percentualDescontado: bruto > 0 ? totalDescontos / bruto : 0
    };
  }

  /* ---------- TERMINATION ---------- */
  /**
   * Estimate of CLT termination pay.
   *
   * Deliberately scoped: covers the standard cases (dismissal without
   * cause, resignation, mutual agreement, end of fixed-term contract).
   * It does not model unstable employment, court-ordered adjustments,
   * or collective-agreement extras.
   *
   * `mesesTrabalhados` drives proportional 13th/vacation. A month counts
   * when at least 15 days were worked — the caller passes the already
   * counted number.
   */
  function rescisao(opcoes) {
    var o = opcoes || {};
    var salario = positivo(o.salario);
    var tipo = o.tipo || 'sem-justa-causa';
    var diasTrabalhadosNoMes = Math.min(30, Math.max(0, parseInt(o.diasTrabalhadosNoMes, 10) || 0));
    var anosCompletos = Math.max(0, parseInt(o.anosCompletos, 10) || 0);
    var mesesPara13 = Math.min(12, Math.max(0, parseInt(o.mesesPara13, 10) || 0));
    var mesesParaFerias = Math.min(12, Math.max(0, parseInt(o.mesesParaFerias, 10) || 0));
    var feriasVencidas = !!o.feriasVencidas;
    var saldoFGTS = positivo(o.saldoFGTS);
    var dependentes = Math.max(0, parseInt(o.dependentes, 10) || 0);

    var regras = {
      'sem-justa-causa': { avisoRecebe: true,  avisoDesconta: false, multaFGTS: 0.40, sacaFGTS: 1.00, temSeguroDesemprego: true },
      'pedido-demissao': { avisoRecebe: false, avisoDesconta: true,  multaFGTS: 0,    sacaFGTS: 0,    temSeguroDesemprego: false },
      'acordo':          { avisoRecebe: true,  avisoDesconta: false, multaFGTS: 0.20, sacaFGTS: 0.80, temSeguroDesemprego: false, avisoMetade: true },
      'fim-contrato':    { avisoRecebe: false, avisoDesconta: false, multaFGTS: 0,    sacaFGTS: 1.00, temSeguroDesemprego: false },
      'justa-causa':     { avisoRecebe: false, avisoDesconta: false, multaFGTS: 0,    sacaFGTS: 0,    temSeguroDesemprego: false, semFerias: true, sem13: true }
    };
    var regra = regras[tipo] || regras['sem-justa-causa'];

    // Notice period: 30 days + 3 per completed year, capped at 90.
    var diasAviso = Math.min(90, 30 + anosCompletos * 3);
    var valorAvisoIntegral = round2((salario / 30) * diasAviso);

    var avisoIndenizado = 0;
    var descontoAviso = 0;
    if (regra.avisoRecebe) {
      avisoIndenizado = regra.avisoMetade ? round2(valorAvisoIntegral / 2) : valorAvisoIntegral;
    } else if (regra.avisoDesconta && o.avisoCumprido === false) {
      // Resignation without working the notice: employer may deduct 30 days.
      descontoAviso = round2(salario);
    }

    // Salary balance for days worked in the final month — taxed.
    var saldoSalario = round2((salario / 30) * diasTrabalhadosNoMes);

    // Proportional 13th — taxed separately from the monthly salary.
    var decimoTerceiro = regra.sem13 ? 0 : round2((salario / 12) * mesesPara13);

    // Vacation: indemnified vacation and its 1/3 are exempt from INSS/IRRF.
    var feriasProporcionais = regra.semFerias ? 0 : round2((salario / 12) * mesesParaFerias);
    var tercoProporcionais = round2(feriasProporcionais / 3);
    var valorFeriasVencidas = feriasVencidas && !regra.semFerias ? round2(salario) : 0;
    var tercoVencidas = round2(valorFeriasVencidas / 3);

    // Taxes. Salary balance and 13th are taxed on separate bases.
    var inssSaldo = calcularINSS(saldoSalario);
    var irrfSaldo = calcularIRRF({
      bruto: saldoSalario,
      inss: inssSaldo.valor,
      dependentes: dependentes
    });

    var inss13 = calcularINSS(decimoTerceiro);
    var irrf13 = calcularIRRF({
      bruto: decimoTerceiro,
      inss: inss13.valor,
      dependentes: dependentes
    });

    var multaFGTS = round2(saldoFGTS * regra.multaFGTS);
    var fgtsSacavel = round2(saldoFGTS * regra.sacaFGTS);

    var proventos = round2(
      saldoSalario + avisoIndenizado + decimoTerceiro +
      feriasProporcionais + tercoProporcionais +
      valorFeriasVencidas + tercoVencidas + multaFGTS
    );

    var descontos = round2(
      inssSaldo.valor + irrfSaldo.valor + inss13.valor + irrf13.valor + descontoAviso
    );

    return {
      tipo: tipo,
      proventos: {
        saldoSalario: saldoSalario,
        avisoPrevioIndenizado: avisoIndenizado,
        decimoTerceiroProporcional: decimoTerceiro,
        feriasProporcionais: feriasProporcionais,
        tercoFeriasProporcionais: tercoProporcionais,
        feriasVencidas: valorFeriasVencidas,
        tercoFeriasVencidas: tercoVencidas,
        multaFGTS: multaFGTS
      },
      descontos: {
        inssSaldoSalario: inssSaldo.valor,
        irrfSaldoSalario: irrfSaldo.valor,
        inssDecimoTerceiro: inss13.valor,
        irrfDecimoTerceiro: irrf13.valor,
        avisoPrevioNaoCumprido: descontoAviso
      },
      diasAviso: regra.avisoRecebe || regra.avisoDesconta ? diasAviso : 0,
      fgtsSacavel: fgtsSacavel,
      totalProventos: proventos,
      totalDescontos: descontos,
      liquido: round2(proventos - descontos),
      temSeguroDesemprego: !!regra.temSeguroDesemprego
    };
  }

  /* ---------- 13TH SALARY ---------- */
  /**
   * Christmas bonus (13º salário).
   *
   * Paid in two instalments: the first is half the gross with no
   * deductions at all, and the whole tax bill lands on the second.
   * INSS and IRRF are calculated on a base of their own — the bonus is
   * never added to the month's salary for bracket purposes.
   */
  function decimoTerceiro(opcoes) {
    var o = opcoes || {};
    var salario = positivo(o.salario);
    var meses = Math.min(12, Math.max(0, parseInt(o.meses, 10) || 0));
    var adiantamentoJaRecebido = positivo(o.adiantamentoJaRecebido);

    var bruto = round2((salario / 12) * meses);

    // First instalment: 50% of gross, untaxed.
    var primeira = round2(bruto / 2);
    var jaPago = adiantamentoJaRecebido > 0 ? adiantamentoJaRecebido : primeira;

    var inss = calcularINSS(bruto);
    var irrf = calcularIRRF({
      bruto: bruto,
      inss: inss.valor,
      dependentes: o.dependentes,
      pensao: o.pensao
    });

    var descontos = round2(inss.valor + irrf.valor);
    var liquido = round2(bruto - descontos);
    var segunda = round2(liquido - jaPago);

    return {
      bruto: bruto,
      meses: meses,
      primeiraParcela: primeira,
      jaPago: round2(jaPago),
      segundaParcela: segunda,
      inss: inss,
      irrf: irrf,
      totalDescontos: descontos,
      liquido: liquido,
      fgts: round2(bruto * TABELAS.fgts.aliquota),
      integral: meses === 12
    };
  }

  /* ---------- VACATION ---------- */
  /**
   * Vacation pay.
   *
   * The constitutional extra third is taxed together with the vacation
   * days. Selling days back (abono pecuniário, up to a third of the
   * period) is indemnity in nature: it carries its own extra third and
   * neither part is taxed.
   */
  function ferias(opcoes) {
    var o = opcoes || {};
    var salario = positivo(o.salario);
    var dias = Math.min(30, Math.max(1, parseInt(o.dias, 10) || 30));
    // Legal cap on selling days is a third of the entitled period.
    var diasVendidos = Math.min(
      Math.floor(dias / 3),
      Math.max(0, parseInt(o.diasVendidos, 10) || 0)
    );
    var diasGozados = dias - diasVendidos;

    var valorFerias = round2((salario / 30) * diasGozados);
    var terco = round2(valorFerias / 3);
    var baseTributavel = round2(valorFerias + terco);

    var abono = round2((salario / 30) * diasVendidos);
    var tercoAbono = round2(abono / 3);
    var totalAbono = round2(abono + tercoAbono);

    var inss = calcularINSS(baseTributavel);
    var irrf = calcularIRRF({
      bruto: baseTributavel,
      inss: inss.valor,
      dependentes: o.dependentes,
      pensao: o.pensao
    });

    // Optional: ask for the first half of the 13th along with vacation.
    var adiantamento13 = o.adiantar13 ? round2(salario / 2) : 0;

    var descontos = round2(inss.valor + irrf.valor);
    var liquido = round2(baseTributavel - descontos + totalAbono + adiantamento13);

    return {
      dias: dias,
      diasGozados: diasGozados,
      diasVendidos: diasVendidos,
      valorFerias: valorFerias,
      terco: terco,
      baseTributavel: baseTributavel,
      abono: abono,
      tercoAbono: tercoAbono,
      totalAbono: totalAbono,
      adiantamento13: adiantamento13,
      inss: inss,
      irrf: irrf,
      totalDescontos: descontos,
      liquido: liquido
    };
  }

  /* ---------- COMPOUND INTEREST ---------- */
  /**
   * Future value with an initial deposit plus monthly contributions
   * made at the end of each period.
   */
  function jurosCompostos(opcoes) {
    var o = opcoes || {};
    var inicial = positivo(o.inicial);
    var mensal = positivo(o.aporteMensal);
    var meses = Math.max(0, parseInt(o.meses, 10) || 0);
    var taxa = Number(o.taxaMensal) || 0; // decimal, e.g. 0.008 for 0.8% a.m.

    var saldo = inicial;
    var investido = inicial;
    var evolucao = [{ mes: 0, saldo: round2(saldo), investido: round2(investido), juros: 0 }];

    for (var m = 1; m <= meses; m++) {
      saldo = saldo * (1 + taxa) + mensal;
      investido += mensal;
      evolucao.push({
        mes: m,
        saldo: round2(saldo),
        investido: round2(investido),
        juros: round2(saldo - investido)
      });
    }

    return {
      montante: round2(saldo),
      totalInvestido: round2(investido),
      totalJuros: round2(saldo - investido),
      evolucao: evolucao
    };
  }

  /** Convert an annual rate to its equivalent monthly rate. */
  function anualParaMensal(taxaAnual) {
    return Math.pow(1 + taxaAnual, 1 / 12) - 1;
  }

  /* ---------- LOAN AMORTIZATION ---------- */
  /**
   * Price (fixed instalment) and SAC (fixed amortization) schedules.
   */
  function financiamento(opcoes) {
    var o = opcoes || {};
    var valor = positivo(o.valor);
    var entrada = Math.min(positivo(o.entrada), valor);
    var meses = Math.max(1, parseInt(o.meses, 10) || 1);
    var taxa = Number(o.taxaMensal) || 0;
    var principal = round2(valor - entrada);

    function vazio() {
      return { parcelas: [], primeira: 0, ultima: 0, totalPago: 0, totalJuros: 0 };
    }
    if (principal <= 0) return { principal: 0, price: vazio(), sac: vazio() };

    // Price
    var parcelaPrice;
    if (taxa === 0) {
      parcelaPrice = principal / meses;
    } else {
      var fator = Math.pow(1 + taxa, meses);
      parcelaPrice = principal * (taxa * fator) / (fator - 1);
    }

    var price = [];
    var saldoPrice = principal;
    var totalPrice = 0;
    for (var i = 1; i <= meses; i++) {
      var jurosP = saldoPrice * taxa;
      var amortP = parcelaPrice - jurosP;
      saldoPrice -= amortP;
      totalPrice += parcelaPrice;
      price.push({
        n: i,
        parcela: round2(parcelaPrice),
        juros: round2(jurosP),
        amortizacao: round2(amortP),
        saldo: round2(Math.max(0, saldoPrice))
      });
    }

    // SAC
    var amortSac = principal / meses;
    var sac = [];
    var saldoSac = principal;
    var totalSac = 0;
    for (var j = 1; j <= meses; j++) {
      var jurosS = saldoSac * taxa;
      var parcelaS = amortSac + jurosS;
      saldoSac -= amortSac;
      totalSac += parcelaS;
      sac.push({
        n: j,
        parcela: round2(parcelaS),
        juros: round2(jurosS),
        amortizacao: round2(amortSac),
        saldo: round2(Math.max(0, saldoSac))
      });
    }

    return {
      principal: principal,
      price: {
        parcelas: price,
        primeira: price[0].parcela,
        ultima: price[price.length - 1].parcela,
        totalPago: round2(totalPrice),
        totalJuros: round2(totalPrice - principal)
      },
      sac: {
        parcelas: sac,
        primeira: sac[0].parcela,
        ultima: sac[sac.length - 1].parcela,
        totalPago: round2(totalSac),
        totalJuros: round2(totalSac - principal)
      }
    };
  }

  /* ---------- FORMATTING ---------- */
  var formatadorBRL = typeof Intl !== 'undefined'
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    : null;

  function brl(n) {
    var v = Number(n) || 0;
    return formatadorBRL ? formatadorBRL.format(v) : 'R$ ' + v.toFixed(2);
  }

  function pct(n, casas) {
    var v = (Number(n) || 0) * 100;
    return v.toFixed(casas === undefined ? 2 : casas).replace('.', ',') + '%';
  }

  var API = {
    TABELAS: TABELAS,
    round2: round2,
    calcularINSS: calcularINSS,
    calcularIRRF: calcularIRRF,
    calcularRedutor: calcularRedutor,
    salarioLiquido: salarioLiquido,
    rescisao: rescisao,
    decimoTerceiro: decimoTerceiro,
    ferias: ferias,
    jurosCompostos: jurosCompostos,
    anualParaMensal: anualParaMensal,
    financiamento: financiamento,
    brl: brl,
    pct: pct
  };

  root.FerramentasBR = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
