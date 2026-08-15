# Estrutura de agentes

## O que está construído, e o que não está — de propósito

Este diretório tem **a Fase 0 e a fundação**, não dezesseis agentes.

A razão está no próprio plano que originou isto:

> *"Não construa 16 agentes. Você vai passar 4 meses construindo
> infraestrutura pra uma empresa que não tem produto."*

Construir os dezesseis agora produziria uma pasta que **parece** uma empresa e
não é uma. O gargalo hoje não é mão de obra — é não saber o que vender.

| Camada | Estado |
|---|---|
| Memória compartilhada (`esquema.sql`) | Pronta |
| Contratos de handoff (`contratos.js`) | Prontos e validados no CI |
| Loop de melhoria (tabelas + placar) | Pronto |
| Fase 0 — Voz do Cliente, Estrategista, Analytics | Definidos |
| Fases 1–3 — os outros 13 agentes | **Não construídos** |

Os contratos das fases seguintes já existem em `contratos.js` porque definir o
formato do handoff é barato e evita retrabalho. O que não existe é o agente.

---

## Por que contratos, e não prompts

A diferença entre "16 chats" e uma estrutura que encaixa é que cada agente
entrega **JSON com esquema fixo**.

Isso não é formalismo. É que alucinação em texto livre passa despercebida, e
campo obrigatório faltando **quebra na hora**.

```bash
node agentes/testes-contratos.js
```

26 verificações. Metade delas existe para provar o que o validador **rejeita**:

- Dor sem citação literal → rejeitada (o campo de evidência está vazio)
- Citação sem URL de fonte → rejeitada
- Feature sem dor de origem → rejeitada
- Decisão arquitetural sem alternativa considerada → rejeitada
- Experimento sem amostra mínima definida **antes** → rejeitado
- `resultado: "deu certo"` → rejeitado, não é um valor do enum

Essa última é a que mata leitura de vitória em amostra de 40 pessoas.

Um validador que aceita tudo é decoração. O valor está no que ele barra.

---

## A regra que sustenta tudo

**Agente que não consegue preencher um campo obrigatório para e pede. Nunca
inventa.**

É a única defesa contra uma estrutura que produz relatórios confiantes sem nada
por trás.

---

## Memória compartilhada

`esquema.sql` roda em Postgres/Supabase. Sete tabelas de operação mais duas que
quase ninguém cria:

- **`agente_execucoes`** — entrada, decisão, saída e, N dias depois, **o
  resultado real**. É a coluna `resultado_real` que transforma log em
  aprendizado.
- **`avaliacoes`** — casos dourados. Todo erro que escapou vira caso permanente,
  para que o mesmo engano não suba duas vezes.
- **`placar_agentes`** (view) — taxa de acerto por agente **e por versão de
  prompt**. Agente que piorou, você reverte a versão. Como qualquer software.

Sem essas três coisas você não tem uma empresa que melhora — tem chats que
degradam juntos e ninguém percebe.

Restrições que valem a pena notar, porque impedem lixo na origem:

```sql
constraint insight_precisa_de_citacao  check (jsonb_array_length(citacoes) > 0)
constraint decisao_precisa_de_alternativa check (array_length(alternativas,1) >= 1)
constraint amostra_minima_positiva     check (amostra_minima > 0)
```

**Regra dura: nenhum agente guarda estado próprio.** Estado privado é como dois
agentes divergem em silêncio.

---

## Fase 0 — achar o que vender

Três agentes, zero código de produto. Saída: um nicho escolhido com evidência.

| Agente | Entrega | Responde por |
|---|---|---|
| [Voz do Cliente](fase-0/voz-do-cliente.md) | Dores ranqueadas + citações literais | Densidade de insight acionável |
| [Estrategista](fase-0/estrategista.md) | Memo mensal + placar de premissas | Acerto direcional |
| [Analytics](fase-0/analytics.md) | Painel semanal + veredito de experimento | Confiabilidade do dado |

### A vantagem que já existe

A Fase 0 normalmente começa do zero. Aqui não precisa.

O site de calculadoras já está no ar e vai gerar, de graça, **a linguagem
literal do cliente em escala**: as queries do Google Search Console são
exatamente o insumo do Voz do Cliente — pessoas descrevendo a própria dor, com
as próprias palavras, com volume medido.

É o mesmo insumo que se caça a mão no Reddit, só que já quantificado e sem
viés de quem posta.

---

## O que nunca é delegado

| Nunca | Por quê |
|---|---|
| Movimentar dinheiro | Óbvio |
| Assinar contrato | Responsabilidade legal é pessoal |
| Subir campanha paga | Gasta dinheiro real e é irreversível |
| Deploy sem gate de QA | QA aprova, humano libera |
| Matar ou pivotar o produto | Isso é gosto e aposta, não análise |
| Os 10 primeiros clientes | Você precisa sentir a dor sem intermediário |

---

## Uma nota sobre vantagem competitiva

Esta estrutura **não é** vantagem competitiva. Em pouco tempo todo mundo terá
algo parecido.

O que continua escasso é **distribuição e gosto** — saber qual dor atacar e
conseguir chegar em quem a tem. Os agentes dão velocidade de execução; não dão
o que executar.

É por isso que a Fase 0 existe antes de tudo, e por que ela é a única fase
construída aqui.
