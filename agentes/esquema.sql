-- ===================================================
-- CAMADA DE MEMÓRIA COMPARTILHADA
-- Postgres / Supabase
--
-- Regra dura: nenhum agente guarda estado próprio.
-- Estado privado é como dois agentes passam a divergir em
-- silêncio, e você só descobre quando tomam decisões
-- contraditórias.
--
-- As tabelas do fim (agente_execucoes, avaliacoes) são as
-- que quase ninguém cria — e são exatamente as que fazem a
-- diferença entre uma estrutura que melhora e 16 chats que
-- degradam juntos sem ninguém perceber.
-- ===================================================

-- ---------- PRODUTO ----------

create table clientes (
  id            uuid primary key default gen_random_uuid(),
  criado_em     timestamptz not null default now(),
  email         text unique not null,
  plano         text not null default 'trial',
  mrr_centavos  integer not null default 0,
  estado        text not null default 'ativo'
                check (estado in ('trial','ativo','inadimplente','churn')),
  -- Health is derived, never typed by hand.
  ativado_em    timestamptz,
  ultimo_uso_em timestamptz,
  churn_em      timestamptz,
  motivo_churn  text
);

create index on clientes (estado);
create index on clientes (ultimo_uso_em);

-- Everything that happens in the product. Append-only.
create table eventos (
  id         bigserial primary key,
  ocorrido_em timestamptz not null default now(),
  cliente_id uuid references clientes(id) on delete cascade,
  nome       text not null,
  -- Free-form payload, but the event *name* is canonical.
  dados      jsonb not null default '{}'::jsonb
);

create index on eventos (nome, ocorrido_em desc);
create index on eventos (cliente_id, ocorrido_em desc);

-- ---------- CONHECIMENTO ----------

-- Output of the Voz do Cliente agent. Nothing here without a source.
create table insights (
  id            uuid primary key default gen_random_uuid(),
  criado_em     timestamptz not null default now(),
  dor           text not null,
  frequencia    integer not null default 1,
  -- Literal quotes with url + date, validated by contratos.js
  citacoes      jsonb not null,
  concorrentes  text[] not null default '{}',
  nicho         text,
  virou_o_que   text check (virou_o_que in ('feature','campanha','conteudo','descartado')),

  -- An insight with no evidence is an opinion wearing a lab coat.
  constraint insight_precisa_de_citacao check (jsonb_array_length(citacoes) > 0)
);

create index on insights (nicho);
create index on insights (frequencia desc);

-- Business and architectural decisions, with the reasoning attached.
create table decisoes (
  id           uuid primary key default gen_random_uuid(),
  criado_em    timestamptz not null default now(),
  tipo         text not null check (tipo in ('adr','negocio','estrategia')),
  titulo       text not null,
  contexto     text not null,
  decisao      text not null,
  alternativas text[] not null default '{}',
  custo_reverter text,
  -- Filled in later. This is what makes the retro possible.
  resultado_real text,
  avaliado_em  timestamptz,

  constraint decisao_precisa_de_alternativa check (array_length(alternativas, 1) >= 1)
);

-- Assumptions the business runs on, scored monthly.
create table premissas (
  id         uuid primary key default gen_random_uuid(),
  criado_em  timestamptz not null default now(),
  premissa   text not null,
  status     text not null default 'aberta'
             check (status in ('aberta','validada','refutada')),
  evidencia  text not null,
  revisado_em timestamptz
);

-- ---------- EXPERIMENTOS ----------

create table experimentos (
  id            uuid primary key default gen_random_uuid(),
  criado_em     timestamptz not null default now(),
  hipotese      text not null,
  metrica       text not null,
  -- Declared BEFORE the experiment starts. Not negotiable afterwards.
  amostra_minima integer not null,
  iniciado_em   timestamptz,
  encerrado_em  timestamptz,
  amostra_real  integer,
  resultado     text check (resultado in ('confirmada','refutada','inconclusiva')),
  veredito      text,

  -- Guards against reading a win off 40 people.
  constraint amostra_minima_positiva check (amostra_minima > 0)
);

-- ---------- MÉTRICAS ----------

-- Daily snapshot. One row per metric per day, so history is never
-- overwritten by a recalculation.
create table metricas (
  dia        date not null,
  nome       text not null,
  valor      numeric not null,
  primary key (dia, nome)
);

-- ---------- GO-TO-MARKET ----------

create table ativos (
  id           uuid primary key default gen_random_uuid(),
  criado_em    timestamptz not null default now(),
  tipo         text not null check (tipo in ('criativo','conteudo','email','pagina')),
  titulo       text not null,
  conteudo     text,
  origem_insight uuid references insights(id),
  -- Performance is attached to the asset, so the swipe file is never
  -- a folder of pretty things nobody measured.
  impressoes   integer default 0,
  cliques      integer default 0,
  conversoes   integer default 0,
  custo_centavos integer default 0,
  estado       text not null default 'teste'
               check (estado in ('teste','escalando','morto'))
);

create index on ativos (tipo, estado);

-- ===================================================
-- CAMADA 4 — O LOOP DE MELHORIA
-- Sem estas duas tabelas você não tem uma empresa que
-- melhora. Tem 16 chats que degradam juntos.
-- ===================================================

-- Every agent run: what went in, what it decided, and — crucially —
-- what actually happened afterwards.
create table agente_execucoes (
  id            bigserial primary key,
  executado_em  timestamptz not null default now(),
  agente        text not null,
  versao_prompt text not null,          -- commit sha do prompt em git
  entrada       jsonb not null,
  saida         jsonb not null,
  contrato      text,                   -- qual contrato a saída deveria cumprir
  contrato_valido boolean,

  -- Preenchido N dias depois. É a coluna que transforma log em aprendizado.
  resultado_real jsonb,
  avaliado_em   timestamptz,
  acertou       boolean
);

create index on agente_execucoes (agente, executado_em desc);
create index on agente_execucoes (agente, acertou);

-- Golden cases. Every escaped error becomes a permanent case here, so the
-- same mistake cannot ship twice.
create table avaliacoes (
  id            uuid primary key default gen_random_uuid(),
  criado_em     timestamptz not null default now(),
  agente        text not null,
  entrada       jsonb not null,
  saida_esperada jsonb not null,
  origem        text not null,          -- 'bug-escapou', 'caso-dourado', 'regressao'
  ativo         boolean not null default true
);

create index on avaliacoes (agente, ativo);

-- Scoreboard per agent over time. An agent that gets worse should be
-- revertible to its previous prompt version, like any other software.
create view placar_agentes as
select
  agente,
  versao_prompt,
  count(*)                                              as execucoes,
  count(*) filter (where contrato_valido is false)      as saidas_fora_do_contrato,
  count(*) filter (where acertou is true)               as acertos,
  count(*) filter (where acertou is false)              as erros,
  round(
    100.0 * count(*) filter (where acertou is true)
    / nullif(count(*) filter (where acertou is not null), 0)
  , 1)                                                  as taxa_acerto_pct
from agente_execucoes
group by agente, versao_prompt
order by agente, versao_prompt;
