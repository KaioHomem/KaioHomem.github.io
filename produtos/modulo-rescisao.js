/* ===================================================
   MÓDULO DE RESCISÃO — injetado no build completo

   Este arquivo não roda sozinho: o gerar-completo.js o
   injeta dentro do produto, antes do marcador
   /* ---------- FORMATO E ENTRADA ---------- *_/, que é
   exatamente onde o gate de paridade corta o motor. Com
   isso a rescisão entra na comparação contra o nucleo.js
   sem nenhum trabalho extra.

   Por que módulo separado e build separado, e não um
   `if (comprouOUpsell)` dentro do arquivo único: o
   comprador baixa o HTML e pode abrir e editar. Uma trava
   que qualquer pessoa desfaz num editor de texto não é
   trava, é encenação. Quem compra o módulo recebe outro
   arquivo.

   As regras aqui são as mesmas do ferramentas/nucleo.js,
   com os nomes dos ajudantes do produto (pos, round2,
   calcINSS, calcIRRF). Se divergirem, o gate reprova.
   =================================================== */

/* Encargos do empregador. Não existem no build base porque
   o base só responde o que o funcionário recebe. */
TABELAS.empregador = {
  cpp: 0.20,
  ratOpcoes: [0.01, 0.02, 0.03],
  fapMin: 0.5, fapMax: 2.0,
  terceirosPadrao: 0.058, terceirosMax: 0.078,
  multaFgts: 0.40
};

/* Cinco tipos de desligamento, e a diferença entre eles não é de grau:
   é de quais verbas existem.

   sem-justa-causa  recebe aviso, 40% de multa, saca tudo, tem seguro
   pedido-demissao  não recebe aviso — e pode ter 30 dias descontados
                    se não cumprir; sem multa, sem saque
   acordo           metade do aviso, 20% de multa, saca 80%, sem seguro
   fim-contrato     sem aviso, sem multa, saca tudo
   justa-causa      perde 13º e férias proporcionais, sem multa, sem saque

   O aviso é 30 dias mais 3 por ano completo, teto de 90. */
function rescisaoDe(f){
  var salario = pos(f.salario);
  var tipo = f.tipo || 'sem-justa-causa';
  var diasTrabalhadosNoMes = Math.min(30, Math.max(0, parseInt(f.diasTrabalhadosNoMes,10)||0));
  var anosCompletos = Math.max(0, parseInt(f.anosCompletos,10)||0);
  var mesesPara13 = Math.min(12, Math.max(0, parseInt(f.mesesPara13,10)||0));
  var mesesParaFerias = Math.min(12, Math.max(0, parseInt(f.mesesParaFerias,10)||0));
  var feriasVencidas = !!f.feriasVencidas;
  var saldoFGTS = pos(f.saldoFGTS);
  var dependentes = Math.max(0, parseInt(f.dependentes,10)||0);

  var regras = {
    'sem-justa-causa': { avisoRecebe:true,  avisoDesconta:false, multaFGTS:0.40, sacaFGTS:1.00, temSeguroDesemprego:true },
    'pedido-demissao': { avisoRecebe:false, avisoDesconta:true,  multaFGTS:0,    sacaFGTS:0,    temSeguroDesemprego:false },
    'acordo':          { avisoRecebe:true,  avisoDesconta:false, multaFGTS:0.20, sacaFGTS:0.80, temSeguroDesemprego:false, avisoMetade:true },
    'fim-contrato':    { avisoRecebe:false, avisoDesconta:false, multaFGTS:0,    sacaFGTS:1.00, temSeguroDesemprego:false },
    'justa-causa':     { avisoRecebe:false, avisoDesconta:false, multaFGTS:0,    sacaFGTS:0,    temSeguroDesemprego:false, semFerias:true, sem13:true }
  };
  var regra = regras[tipo] || regras['sem-justa-causa'];

  var diasAviso = Math.min(90, 30 + anosCompletos*3);
  var valorAvisoIntegral = round2((salario/30)*diasAviso);

  var avisoIndenizado = 0, descontoAviso = 0;
  if(regra.avisoRecebe){
    avisoIndenizado = regra.avisoMetade ? round2(valorAvisoIntegral/2) : valorAvisoIntegral;
  } else if(regra.avisoDesconta && f.avisoCumprido === false){
    descontoAviso = round2(salario);
  }

  var saldoSalario = round2((salario/30)*diasTrabalhadosNoMes);
  var decimoTerceiro = regra.sem13 ? 0 : round2((salario/12)*mesesPara13);

  /* Férias indenizadas e o terço delas não pagam INSS nem IRRF — são
     verba indenizatória (STJ, Tema 737). O terço de férias GOZADAS é
     outra coisa e paga (STF, Tema 985), mas isso não acontece aqui. */
  var feriasProporcionais = regra.semFerias ? 0 : round2((salario/12)*mesesParaFerias);
  var tercoProporcionais = round2(feriasProporcionais/3);
  var valorFeriasVencidas = feriasVencidas && !regra.semFerias ? round2(salario) : 0;
  var tercoVencidas = round2(valorFeriasVencidas/3);

  /* Saldo de salário e 13º são bases separadas. Somar os dois numa base
     só é o erro que mais aparece em rescisão feita na planilha. */
  var inssSaldo = calcINSS(saldoSalario);
  var irrfSaldo = calcIRRF(saldoSalario, inssSaldo, dependentes);
  var inss13 = calcINSS(decimoTerceiro);
  var irrf13 = calcIRRF(decimoTerceiro, inss13, dependentes);

  /* A multa incide sobre o saldo da conta na data do pagamento, sem a
     projeção do aviso indenizado (OJ 42, II, da SDI-1 do TST). Como o
     saldo entra como dado informado, é exatamente o que acontece. */
  var multaFGTS = round2(saldoFGTS*regra.multaFGTS);
  var fgtsSacavel = round2(saldoFGTS*regra.sacaFGTS);

  var proventos = round2(
    saldoSalario + avisoIndenizado + decimoTerceiro +
    feriasProporcionais + tercoProporcionais +
    valorFeriasVencidas + tercoVencidas + multaFGTS
  );
  var descontos = round2(inssSaldo + irrfSaldo.valor + inss13 + irrf13.valor + descontoAviso);

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
      inssSaldoSalario: inssSaldo,
      irrfSaldoSalario: irrfSaldo.valor,
      inssDecimoTerceiro: inss13,
      irrfDecimoTerceiro: irrf13.valor,
      avisoPrevioNaoCumprido: descontoAviso
    },
    diasAviso: (regra.avisoRecebe || regra.avisoDesconta) ? diasAviso : 0,
    fgtsSacavel: fgtsSacavel,
    totalProventos: proventos,
    totalDescontos: descontos,
    liquido: round2(proventos - descontos),
    temSeguroDesemprego: !!regra.temSeguroDesemprego
  };
}

/* O que o funcionário recebe não é o que sai da conta.

   Duas armadilhas aqui, e eu caí nas duas ao portar:

   1. O custo é o total de PROVENTOS mais encargos, não o líquido mais
      encargos. O INSS e o IRRF retidos do funcionário saem do caixa da
      empresa igual — só mudam de destinatário no caminho. Usar o
      líquido subestima a conta exatamente no valor dos descontos.

   2. O regime muda quem paga o quê. No Simples (o caso da maioria dos
      compradores) não há CPP nem terceiros: sobra só o FGTS. Cobrar
      CPP de quem está no Simples infla o custo em 20% da base.

   Quais encargos incidem sobre qual verba é jurisprudência, não
   dedução:

     saldo de salário e 13º proporcional → INSS patronal e FGTS
     aviso prévio indenizado             → só FGTS (Súmula 305 do TST);
                                           o INSS patronal não incide
                                           (STJ, Tema 478)
     férias indenizadas e o terço        → nenhum dos dois (Tema 737) */
function custoDemissaoDe(f){
  var E = TABELAS.empregador;
  var r = rescisaoDe(f);

  var regime = f.regime === 'normal' ? 'normal'
             : f.regime === 'simplesIV' ? 'simplesIV'
             : 'simples';

  var rat = pos(f.rat) || E.ratOpcoes[1];
  var fap = Number(f.fap);
  if(!isFinite(fap) || fap <= 0) fap = 1.0;
  fap = Math.min(E.fapMax, Math.max(E.fapMin, fap));

  var terceiros = f.terceiros === undefined ? E.terceirosPadrao : pos(f.terceiros);

  var pagaCpp = regime !== 'simples';
  var pagaTerceiros = regime === 'normal';

  var aliquotaPatronal = (pagaCpp ? E.cpp + rat*fap : 0) +
                         (pagaTerceiros ? terceiros : 0);

  var basePatronal = round2(r.proventos.saldoSalario + r.proventos.decimoTerceiroProporcional);
  var baseFgts = round2(basePatronal + r.proventos.avisoPrevioIndenizado);

  var inssPatronal = round2(basePatronal * aliquotaPatronal);
  var fgtsSobreVerbas = round2(baseFgts * TABELAS.fgts.aliquota);

  var total = round2(r.totalProventos + inssPatronal + fgtsSobreVerbas);

  return {
    rescisao: r,
    regime: regime,
    aoTrabalhador: r.liquido,
    retidoDoTrabalhador: r.totalDescontos,
    multaFGTS: r.proventos.multaFGTS,
    encargos: {
      aliquota: aliquotaPatronal,
      basePatronal: basePatronal,
      inssPatronal: inssPatronal,
      baseFgts: baseFgts,
      fgtsSobreVerbas: fgtsSobreVerbas,
      total: round2(inssPatronal + fgtsSobreVerbas)
    },
    total: total,
    // Quantos salários a demissão custa. É o número que responde
    // "tenho caixa para isso?" sem precisar de contexto.
    emSalarios: pos(f.salario) > 0 ? total/pos(f.salario) : 0
  };
}
