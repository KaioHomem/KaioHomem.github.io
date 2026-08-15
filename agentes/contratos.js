/* ===================================================
   AGENTES — CONTRATOS DE HANDOFF

   Cada agente entrega JSON com esquema fixo, não texto
   solto. Esta é a diferença entre "16 chats" e uma
   estrutura que encaixa.

   O ponto não é formalismo. É que alucinação em texto
   livre passa despercebida, e campo obrigatório faltando
   quebra na hora. Um agente que não consegue preencher um
   campo tem que PARAR E PEDIR — nunca inventar.

   Roda em Node e no navegador, sem dependência.
   =================================================== */

(function (root) {
  'use strict';

  /* ---------- FIELD TYPES ---------- */
  var TIPOS = {
    texto: function (v) { return typeof v === 'string'; },
    numero: function (v) { return typeof v === 'number' && isFinite(v); },
    booleano: function (v) { return typeof v === 'boolean'; },
    lista: function (v) { return Array.isArray(v); },
    objeto: function (v) { return v !== null && typeof v === 'object' && !Array.isArray(v); },
    url: function (v) { return typeof v === 'string' && /^https?:\/\/.+/.test(v); },
    data: function (v) { return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v); }
  };

  /* ---------- CONTRACTS ---------- */
  /**
   * `evidencia: true` marks a field that must trace back to something
   * observed. It is the guard against an agent producing a confident
   * report with nothing behind it.
   */
  var CONTRATOS = {

    'voz-do-cliente': {
      descricao: 'Dor encontrada em campo, com a linguagem literal de quem a sente.',
      produzidoPor: 'Agente 10 — Voz do Cliente',
      consumidoPor: ['Agente 3 — PM', 'Agente 11 — Conteúdo', 'Agente 12 — Aquisição'],
      campos: {
        dor: { tipo: 'texto', obrigatorio: true, minimo: 20,
               nota: 'Descrita como problema do cliente, não como solução.' },
        frequencia: { tipo: 'numero', obrigatorio: true,
                      nota: 'Quantas ocorrências distintas sustentam esta dor.' },
        citacoes: { tipo: 'lista', obrigatorio: true, minimoItens: 1, evidencia: true,
                    itemCampos: {
                      texto: { tipo: 'texto', obrigatorio: true, minimo: 15 },
                      fonte: { tipo: 'url', obrigatorio: true },
                      data: { tipo: 'data', obrigatorio: true }
                    },
                    nota: 'Literal. Sem parafrasear — a copy nasce daqui.' },
        concorrentes_que_falham: { tipo: 'lista', obrigatorio: true },
        disposicao_a_pagar: { tipo: 'texto', obrigatorio: false,
                              nota: 'Só preencher se houver evidência, não palpite.' }
      }
    },

    'especificacao': {
      descricao: 'Hipótese testável com critério de sucesso definido antes de construir.',
      produzidoPor: 'Agente 3 — PM',
      consumidoPor: ['Agente 4 — Arquiteto', 'Agente 6 — QA'],
      campos: {
        hipotese: { tipo: 'texto', obrigatorio: true, minimo: 20,
                    nota: 'No formato "se X, então Y" — precisa poder ser refutada.' },
        criterio_sucesso: { tipo: 'texto', obrigatorio: true, minimo: 10,
                            nota: 'Número e prazo. "Melhorar a experiência" não é critério.' },
        metrica: { tipo: 'texto', obrigatorio: true },
        esforco: { tipo: 'texto', obrigatorio: true },
        dor_origem: { tipo: 'texto', obrigatorio: true, evidencia: true,
                      nota: 'Referência à dor do Voz do Cliente. Feature sem origem não sobe.' },
        criterios_aceite: { tipo: 'lista', obrigatorio: true, minimoItens: 1 }
      }
    },

    'desenho-tecnico': {
      descricao: 'Decisão arquitetural com as alternativas descartadas e o porquê.',
      produzidoPor: 'Agente 4 — Arquiteto',
      consumidoPor: ['Agente 5 — Dev', 'Agente 8 — Segurança'],
      campos: {
        desenho: { tipo: 'texto', obrigatorio: true, minimo: 30 },
        alternativas_descartadas: { tipo: 'lista', obrigatorio: true, minimoItens: 1,
                                    nota: 'Decisão sem alternativa considerada não é decisão.' },
        riscos: { tipo: 'lista', obrigatorio: true },
        o_que_pode_quebrar: { tipo: 'lista', obrigatorio: true },
        custo_de_reverter: { tipo: 'texto', obrigatorio: true,
                             nota: 'O que importa não é elegância, é custo de mudar depois.' }
      }
    },

    'entrega-dev': {
      descricao: 'Código entregue contra a spec, com teste junto.',
      produzidoPor: 'Agente 5 — Dev',
      consumidoPor: ['Agente 6 — QA'],
      campos: {
        pr_url: { tipo: 'url', obrigatorio: true },
        testes: { tipo: 'lista', obrigatorio: true, minimoItens: 1,
                  nota: 'Teste escrito junto, não depois.' },
        spec_atendida: { tipo: 'booleano', obrigatorio: true },
        desvios: { tipo: 'lista', obrigatorio: true,
                   nota: 'Vazio se não houve. Se a spec estava errada, devolve ao PM.' }
      }
    },

    'veredito-qa': {
      descricao: 'Aprovação ou reprovação contra o critério de aceite.',
      produzidoPor: 'Agente 6 — QA',
      consumidoPor: ['Agente 1 — Orquestrador', 'Agente 5 — Dev'],
      campos: {
        aprovado: { tipo: 'booleano', obrigatorio: true },
        achados: { tipo: 'lista', obrigatorio: true },
        novos_casos_teste: { tipo: 'lista', obrigatorio: true,
                             nota: 'Todo erro que passou vira caso permanente.' },
        criterios_verificados: { tipo: 'lista', obrigatorio: true, minimoItens: 1 }
      }
    },

    'memo-estrategico': {
      descricao: 'Tese de alocação e o placar das premissas do mês.',
      produzidoPor: 'Agente 2 — Estrategista',
      consumidoPor: ['Agente 1 — Orquestrador'],
      campos: {
        tese: { tipo: 'texto', obrigatorio: true, minimo: 30 },
        premissas: { tipo: 'lista', obrigatorio: true, minimoItens: 1,
                     itemCampos: {
                       premissa: { tipo: 'texto', obrigatorio: true },
                       status: { tipo: 'texto', obrigatorio: true,
                                 valores: ['aberta', 'validada', 'refutada'] },
                       evidencia: { tipo: 'texto', obrigatorio: true }
                     },
                     nota: 'Premissa sem status vira crença. Crença não se mede.' },
        onde_alocar: { tipo: 'texto', obrigatorio: true },
        risco_de_plataforma: { tipo: 'texto', obrigatorio: true,
                               nota: 'A plataforma que te distribui pode virar concorrente.' }
      }
    },

    'veredito-experimento': {
      descricao: 'Leitura de experimento com poder estatístico decidido antes.',
      produzidoPor: 'Agente 9 — Analytics',
      consumidoPor: ['Agente 3 — PM', 'Agente 12 — Aquisição'],
      campos: {
        hipotese: { tipo: 'texto', obrigatorio: true },
        amostra: { tipo: 'numero', obrigatorio: true },
        amostra_minima_definida_antes: { tipo: 'numero', obrigatorio: true,
                                         nota: 'Definida na frente. Sem isso, é leitura de sorte.' },
        resultado: { tipo: 'texto', obrigatorio: true,
                     valores: ['confirmada', 'refutada', 'inconclusiva'] },
        veredito: { tipo: 'texto', obrigatorio: true, minimo: 10 }
      }
    }
  };

  /* ---------- VALIDATOR ---------- */
  function validarCampo(nome, regra, valor, caminho, erros) {
    var rotulo = caminho ? caminho + '.' + nome : nome;

    var ausente = valor === undefined || valor === null ||
                  (typeof valor === 'string' && valor.trim() === '');

    if (ausente) {
      if (regra.obrigatorio) {
        erros.push('campo obrigatório ausente: ' + rotulo +
                   (regra.nota ? ' — ' + regra.nota : ''));
      }
      return;
    }

    var verificador = TIPOS[regra.tipo];
    if (verificador && !verificador(valor)) {
      erros.push(rotulo + ' deveria ser do tipo ' + regra.tipo);
      return;
    }

    if (regra.minimo && typeof valor === 'string' && valor.trim().length < regra.minimo) {
      erros.push(rotulo + ' tem ' + valor.trim().length + ' caracteres, mínimo ' + regra.minimo +
                 ' — resposta curta demais costuma ser resposta inventada');
    }

    if (regra.minimoItens && Array.isArray(valor) && valor.length < regra.minimoItens) {
      erros.push(rotulo + ' precisa de ao menos ' + regra.minimoItens + ' item(ns)' +
                 (regra.evidencia ? ' — este campo é a evidência, sem ele o relatório é palpite' : ''));
    }

    if (regra.valores && regra.valores.indexOf(valor) === -1) {
      erros.push(rotulo + ' = "' + valor + '" não é um valor aceito (' + regra.valores.join(', ') + ')');
    }

    // Nested objects inside a list.
    if (regra.itemCampos && Array.isArray(valor)) {
      valor.forEach(function (item, i) {
        if (!TIPOS.objeto(item)) {
          erros.push(rotulo + '[' + i + '] deveria ser um objeto');
          return;
        }
        Object.keys(regra.itemCampos).forEach(function (sub) {
          validarCampo(sub, regra.itemCampos[sub], item[sub], rotulo + '[' + i + ']', erros);
        });
      });
    }
  }

  /**
   * Validate an agent's output against its contract.
   * Returns every problem at once, not just the first — an agent that has
   * to be told its mistakes one at a time wastes a round trip each time.
   */
  function validar(nomeContrato, objeto) {
    var contrato = CONTRATOS[nomeContrato];
    if (!contrato) {
      return { valido: false, erros: ['contrato desconhecido: ' + nomeContrato] };
    }
    if (!TIPOS.objeto(objeto)) {
      return { valido: false, erros: ['a entrega precisa ser um objeto JSON'] };
    }

    var erros = [];
    Object.keys(contrato.campos).forEach(function (nome) {
      validarCampo(nome, contrato.campos[nome], objeto[nome], '', erros);
    });

    // Unknown fields are a signal, not an error: usually a renamed field.
    var avisos = Object.keys(objeto).filter(function (k) {
      return !contrato.campos[k];
    }).map(function (k) {
      return 'campo fora do contrato: ' + k;
    });

    return { valido: erros.length === 0, erros: erros, avisos: avisos };
  }

  var API = { CONTRATOS: CONTRATOS, validar: validar, TIPOS: TIPOS };

  root.Contratos = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
