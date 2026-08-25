# HARNESS — como trabalhar neste repositório

Leia isto no começo de toda sessão. São dois minutos e substitui o
histórico de conversa.

## 1. Recupere antes de confiar

```bash
npm ci                    # se node_modules não existir
npm run harness:status    # onde o trabalho parou
```

**O repositório prevalece.** Branch, HEAD, working tree, contagem de teste
e status de item se **recalculam** — nunca se leem de um documento.

A autoridade, de cima para baixo:

```
filesystem + git + verificações executáveis
        ↓
documentação operacional (.harness/, HARNESS.md)
        ↓
handoff / progress
        ↓
conversas anteriores
```

Handoff é memória, não prova. Se um documento discordar do `git status`,
o documento está velho.

## 2. Carregue só o necessário

| Arquivo | Para quê |
|---|---|
| `.harness/CONSTITUTION.md` | o que não se pode enfraquecer |
| `.harness/mission.md` | objetivo atual, escopo, ordem da migração |
| `.harness/work-items.json` | a fila |
| `.harness/handoff.md` | onde parou, em uma tela |
| `.harness/progress.md` | diário curto do que aconteceu |
| `conhecimento/decisoes.md` | **por que** cada coisa é como é |
| `conhecimento/estado-do-negocio.md` | números reais e o que é hipótese |

Cada Work Item traz `references` e `decision_refs`. **Carregue esses
arquivos, não o repositório inteiro.**

## 3. Escolha trabalho

Pegue o `current` da fila; se ele estiver bloqueado, pegue o primeiro
`ready` cujas dependências estejam `done`.

Você pode criar Work Item novo e marcá-lo `ready` sozinho, desde que
esteja dentro da missão, respeite a Constitution e não precise de Classe
C. Melhoria que está **fora** da missão vai para `backlog` — registre e
siga. Não expanda o escopo por achar interessante.

Passos internos são seus: não vire cada um em Work Item.

## 4. Autoridade

- **A — implementação.** Decide sozinho. Código, teste, refactor, script, doc.
- **B — arquitetura.** Também decide sozinho. Deixe decisão durável em
  `conhecimento/decisoes.md`, proporcional ao risco. ADR só quando o
  trade-off justificar documento próprio.
- **C — constitucional ou externa.** Só o dono.

Não peça autorização só porque há mais de uma solução técnica válida:

```
decida → implemente → verifique → registre → checkpoint → continue
```

## 5. Proibido

Nada que saia desta máquina: **push**, force push, merge remoto, deploy,
DNS, alterar remote, Cloudflare real, Stripe real, segredo real,
cobrança, tornar o repositório privado, desligar o GitHub Pages, gasto,
reescrever histórico publicado.

Commit **local** é permitido e esperado.

## 6. Bloqueio local não é parada global

Bateu em Classe C: marque `blocked_human`, **escreva o motivo**, e vá para
o próximo `ready`.

Pare a missão inteira só quando não sobrar trabalho seguro, ou tudo que
resta depender do dono, ou o ambiente impedir verificar. Incerteza técnica
não é motivo para parar — é motivo para investigar.

## 7. Verifique

```bash
CHROMIUM_PATH=/opt/pw-browsers/chromium \
PUPPETEER_EXECUTABLE_PATH=/opt/pw-browsers/chromium \
npm run verificar
```

**Este é o único significado de "verde".** Não crie um segundo.

Evidência vence narrativa: não diga que funciona porque leu o código. E se
um gate passar rápido demais, confira se ele **rodou** — a prova é a
contagem que ele imprime, não a duração. Verde falso é pior que gate
nenhum.

Nunca conserte um gate afrouxando-o. Gate crítico prova nos dois sentidos:
bom passa, ruim deliberado reprova, restaurado passa.

## 8. Registre e checkpoint

Ao fechar uma unidade coerente:

1. `npm run verificar`
2. atualize `work-items.json`, `progress.md`, `handoff.md`
3. revise o diff
4. **staging explícito** — nunca `git add .` com mudança alheia no disco
5. commit local

Working tree que já estava sujo quando você chegou: **preserve**.
Entenda, associe a um item, não misture no seu commit, não descarte.

## 9. Onde mora o quê

```
.harness/       estado operacional da engenharia (muda toda sessão)
conhecimento/   conhecimento durável do produto (decisões, negócio)
git             histórico e checkpoint
npm run verificar   a definição executável de "aceitável"
conversas       discussão — nada indispensável mora aqui
```

Não duplique estado mutável entre esses lugares.
