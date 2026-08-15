/* ===================================================
   AGENTES — TESTES DOS CONTRATOS
   Rodar: node agentes/testes-contratos.js

   O valor de um contrato está no que ele REJEITA. Um
   validador que aceita tudo é decoração. Metade destes
   testes existe para provar que entregas incompletas ou
   sem evidência quebram.
   =================================================== */

'use strict';

var C = require('./contratos.js');

var falhas = 0, total = 0;

function ok(descricao, condicao, extra) {
  total++;
  if (condicao) { console.log('  ok      ' + descricao); }
  else { falhas++; console.error('  FALHOU  ' + descricao + (extra ? '  → ' + extra : '')); }
}

function aceita(descricao, contrato, obj) {
  var r = C.validar(contrato, obj);
  ok(descricao, r.valido, r.erros.join(' | '));
}

function rejeita(descricao, contrato, obj, trechoEsperado) {
  var r = C.validar(contrato, obj);
  var achou = !r.valido && (!trechoEsperado ||
    r.erros.some(function (e) { return e.indexOf(trechoEsperado) > -1; }));
  ok(descricao, achou, r.valido ? 'aceitou quando deveria rejeitar' : r.erros.join(' | '));
}

console.log('\nCONTRATOS DISPONÍVEIS: ' + Object.keys(C.CONTRATOS).length + '\n');

/* ---------- VOZ DO CLIENTE ---------- */
console.log('VOZ DO CLIENTE');

var vozValida = {
  dor: 'Perco horas toda semana conferindo se o holerite bate com a convenção coletiva',
  frequencia: 14,
  citacoes: [{
    texto: 'passo a tarde inteira do dia 5 conferindo folha na mão, é desumano',
    fonte: 'https://reddit.com/r/exemplo/comments/123',
    data: '2026-08-01'
  }],
  concorrentes_que_falham: ['Concorrente A', 'Concorrente B']
};

aceita('entrega completa passa', 'voz-do-cliente', vozValida);

rejeita('sem citação não passa — é o campo de evidência', 'voz-do-cliente',
  Object.assign({}, vozValida, { citacoes: [] }), 'evidência');

rejeita('citação sem fonte não passa', 'voz-do-cliente',
  Object.assign({}, vozValida, { citacoes: [{ texto: 'muito trabalhoso isso aqui', data: '2026-08-01' }] }),
  'fonte');

rejeita('fonte que não é URL não passa', 'voz-do-cliente',
  Object.assign({}, vozValida, {
    citacoes: [{ texto: 'muito trabalhoso isso aqui', fonte: 'vi no reddit', data: '2026-08-01' }]
  }), 'url');

rejeita('dor curta demais é sinal de invenção', 'voz-do-cliente',
  Object.assign({}, vozValida, { dor: 'é chato' }), 'caracteres');

rejeita('frequência como texto não passa', 'voz-do-cliente',
  Object.assign({}, vozValida, { frequencia: 'muitas' }), 'numero');

/* ---------- ESPECIFICAÇÃO ---------- */
console.log('\nESPECIFICAÇÃO');

var specValida = {
  hipotese: 'Se automatizarmos a conferência da folha, o usuário economiza 4h por semana',
  criterio_sucesso: '60% dos usuários ativos usam a feature em 14 dias',
  metrica: 'adocao_feature_conferencia',
  esforco: '2 semanas',
  dor_origem: 'Perco horas conferindo holerite contra convenção coletiva',
  criterios_aceite: ['Importa CSV da folha', 'Aponta divergência por linha']
};

aceita('spec completa passa', 'especificacao', specValida);

// A feature with no origin is the most expensive kind of feature.
rejeita('feature sem dor de origem não passa', 'especificacao',
  Object.assign({}, specValida, { dor_origem: '' }), 'dor_origem');

rejeita('sem critério de sucesso não passa', 'especificacao',
  Object.assign({}, specValida, { criterio_sucesso: '' }), 'criterio_sucesso');

rejeita('hipótese vaga demais não passa', 'especificacao',
  Object.assign({}, specValida, { hipotese: 'melhorar' }), 'caracteres');

/* ---------- DESENHO TÉCNICO ---------- */
console.log('\nDESENHO TÉCNICO');

var desenhoValido = {
  desenho: 'Fila assíncrona processa o CSV e grava divergências numa tabela própria',
  alternativas_descartadas: ['Processar de forma síncrona — trava a request em arquivo grande'],
  riscos: ['Fila pode acumular em pico'],
  o_que_pode_quebrar: ['Importador antigo de CSV'],
  custo_de_reverter: 'Baixo — a tabela nova é isolada e pode ser descartada'
};

aceita('desenho completo passa', 'desenho-tecnico', desenhoValido);

rejeita('decisão sem alternativa considerada não é decisão', 'desenho-tecnico',
  Object.assign({}, desenhoValido, { alternativas_descartadas: [] }), 'alternativas');

rejeita('sem custo de reverter não passa', 'desenho-tecnico',
  Object.assign({}, desenhoValido, { custo_de_reverter: '' }), 'custo_de_reverter');

/* ---------- QA ---------- */
console.log('\nQA');

aceita('veredito completo passa', 'veredito-qa', {
  aprovado: false,
  achados: ['CSV com BOM quebra o parser'],
  novos_casos_teste: ['CSV com BOM'],
  criterios_verificados: ['Importa CSV da folha']
});

rejeita('aprovado precisa ser booleano, não texto', 'veredito-qa', {
  aprovado: 'sim', achados: [], novos_casos_teste: [], criterios_verificados: ['x']
}, 'booleano');

rejeita('veredito sem critério verificado não passa', 'veredito-qa', {
  aprovado: true, achados: [], novos_casos_teste: [], criterios_verificados: []
}, 'criterios_verificados');

/* ---------- ESTRATÉGIA ---------- */
console.log('\nESTRATÉGIA');

var memoValido = {
  tese: 'Concentrar em contabilidades pequenas, onde a dor é recorrente e o pagador é B2B',
  premissas: [{
    premissa: 'Contabilidade pequena paga por automação de conferência',
    status: 'aberta',
    evidencia: 'Nenhuma ainda — a validar em entrevistas'
  }],
  onde_alocar: 'Seis semanas de pesquisa antes de qualquer linha de produto',
  risco_de_plataforma: 'Se o sistema de folha lançar isso nativo, o produto morre'
};

aceita('memo completo passa', 'memo-estrategico', memoValido);

rejeita('status de premissa fora da lista não passa', 'memo-estrategico',
  Object.assign({}, memoValido, {
    premissas: [{ premissa: 'x', status: 'talvez', evidencia: 'y' }]
  }), 'não é um valor aceito');

rejeita('premissa sem evidência não passa', 'memo-estrategico',
  Object.assign({}, memoValido, {
    premissas: [{ premissa: 'x', status: 'validada' }]
  }), 'evidencia');

/* ---------- EXPERIMENTO ---------- */
console.log('\nEXPERIMENTO');

aceita('veredito de experimento passa', 'veredito-experimento', {
  hipotese: 'Onboarding com checklist aumenta ativação',
  amostra: 420,
  amostra_minima_definida_antes: 380,
  resultado: 'confirmada',
  veredito: 'Ativação subiu de 31% para 44%, acima do mínimo definido antes'
});

// This is the assertion that kills "we won" readings on 40 people.
rejeita('resultado fora da lista não passa', 'veredito-experimento', {
  hipotese: 'x', amostra: 40, amostra_minima_definida_antes: 380,
  resultado: 'deu certo', veredito: 'subiu bastante'
}, 'não é um valor aceito');

rejeita('sem amostra mínima definida antes não passa', 'veredito-experimento', {
  hipotese: 'x', amostra: 40, resultado: 'confirmada', veredito: 'subiu bastante'
}, 'amostra_minima_definida_antes');

/* ---------- GERAL ---------- */
console.log('\nGERAL');

rejeita('contrato inexistente é rejeitado', 'agente-inventado', {}, 'desconhecido');
rejeita('texto solto não é entrega válida', 'voz-do-cliente', 'achei uma dor boa', 'objeto JSON');

(function () {
  var r = C.validar('voz-do-cliente',
    Object.assign({ campo_novo: 'x' }, vozValida));
  ok('campo fora do contrato vira aviso, não erro',
    r.valido && r.avisos.length === 1, JSON.stringify(r.avisos));
})();

(function () {
  var r = C.validar('voz-do-cliente', {});
  ok('entrega vazia lista todos os erros de uma vez, não um por vez',
    r.erros.length >= 3, r.erros.length + ' erro(s)');
})();

/* ---------- RESULTADO ---------- */
console.log('\n' + '-'.repeat(52));
if (falhas === 0) {
  console.log(total + '/' + total + ' verificações de contrato passaram.');
  process.exit(0);
}
console.error(falhas + ' de ' + total + ' FALHARAM.');
process.exit(1);
