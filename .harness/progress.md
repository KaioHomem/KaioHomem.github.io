# Progress

Diário operacional. Curto. O que aconteceu e o que provou — não
transcrição de terminal nem cópia do git log.

---

## 2026-08-24 — HE-001 · Harness v0.1

**Recuperação.** Branch `claude/visual-pagina-venda`, HEAD `1ab6bda`,
working tree limpo, 16 commits à frente da `main`, sem divergência do
upstream. Nada interrompido. O estado bateu com o que o bootstrap
descrevia — confirmado, não presumido.

**Baseline verde** antes de tocar em qualquer arquivo: 187 fiscais, 491
consistência, 9.820 de paridade, 20 entrega, 325 publicação, 6 gate ao
contrário, 327 auditoria, 143 navegador, 22 design. Bundle 35,48 KiB
comprimido.

**Descoberto: o verify local não é equivalente ao CI.** A CI roda
`gerar-demo.js --verificar` e `wrangler --dry-run`; o `npm run verificar`
não rodava nenhum dos dois. Quem verificasse localmente não descobriria
o que a CI descobriria. Virou VERIFY-001.

**Confirmado: DEMO-001 é real.** O `DEMO` do produto controla três coisas
e só três — chave do localStorage, marca d'água do holerite, teto de 2
funcionários. `DEMO=null` devolve o produto de R$ 97 inteiro. Não é
suposição herdada do chat: foi lido no arquivo.

---

## 2026-08-24 — DEMO-001 · a demo deixa de ser o produto

**Confirmado no arquivo**, não herdado do chat: `DEMO` controlava chave do
localStorage, marca d'água e teto de 2 funcionários. Nada mais. A
comparação base × demo achou **zero** identificadores exclusivos do base.

**Feito.** 18 regiões do produto marcadas com sentinelas; o
`gerar-demo.js` passou a remover entre elas em vez de trocar uma linha. A
demo caiu de 46 KB para 34 KB e perdeu 13º e férias por completo.

**O gate deriva as assinaturas do próprio produto** a cada execução, e
reprova se sobrarem poucas — cegueira detectada, não sofrida.

**Três defeitos meus, achados por teste e não por leitura:** sentinela mal
posta gerou `mensal: };` e a demo saiu com SyntaxError enquanto todos os
outros gates seguiam verdes; sobraram leituras de `fMeses`/`fDias`/
`fVendidos` que dariam TypeError no botão Limpar; e o gate conferia a
capacidade gratuita com `indexOf`, que acha as chamadas mesmo sem a
função. Os três viraram checagem.

**Quatro âncoras do `gerar-completo.js` colidiram** com as sentinelas. O
gerador recusou em vez de produzir build quebrado.

## 2026-08-24 — VERIFY-001 · o verify local vira o que o CI roda

`harness:check`, `demo`, `separacao`, `gate-*` e `bundle` entraram no
`npm run verificar` e no workflow. A divergência achada na recuperação
está fechada: quem roda local descobre o que a CI descobriria.

## Estado ao fim da missão

Verify verde inteiro. Fila sem item vivo: tudo que resta é
`blocked_human`. Nenhum push, nenhum efeito externo.

## 2026-08-24 — Dogfood

Sessão de contexto limpo recebeu só "siga o HARNESS.md" e reconstruiu
sozinha: raiz, branch, HEAD, working tree, missão, 14 invariantes, fila,
bloqueios com motivo, verify canônico e próximo passo. Sem nenhum resumo
de conversa.

Ela achou uma inconsistência que eu não tinha visto: o `harness:status`
listava os bloqueados na ordem do array, e isso contradizia a ordem de
execução escrita no handoff. Duas fontes discordando é o defeito que o
Harness existe para não ter. Corrigido na origem — o array agora É a
ordem, e o status diz isso.

Também registrou, com razão, que o verde do `progress.md` é memória e não
prova. É a disciplina certa.
