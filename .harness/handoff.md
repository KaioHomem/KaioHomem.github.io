# Handoff operacional

Uma tela. Memória, **não** autoridade: branch, HEAD, working tree e
contagens se recalculam com `npm run harness:status` e `npm run verificar`.

**Missão:** Harness v0.1 e fechamento técnico pré-migração.
Detalhe em `.harness/mission.md`.

**Item atual:** nenhum. O trabalho local da missão acabou.

**Último concluído:** `PUSH-001` — commits publicados e validados na CI
remota, checkpoint `c1baa6d`. Antes dele, `DEMO-001` — a demo perdeu 13º e férias de dentro do
arquivo; o gate `separacao` prova a ausência e o `gate-separacao` prova que
o gate reprova.

**Fila `ready`:** vazia. Tudo que resta depende do dono.

**`blocked_human`** — todos por efeito externo, nesta ordem de execução:

```
STRIPE-001  onboarding da conta
CF-001      criar Cloudflare e conectar o repositório
STRIPE-002  Payment Link (cartão e Pix; boleto NÃO)
CF-002      segredo e preços no Worker
GH-001      repositório privado   ← penúltimo, nunca primeiro
GH-002      desligar o Pages      ← último
MERGE-001   mesclar o PR #6 (o push já foi feito e validado)
```

**Riscos abertos:**

- Nenhuma venda existe. Qualquer número de conversão é hipótese.
- `docs.stripe.com` e `developers.cloudflare.com` estão bloqueados pelo
  proxy desta máquina. A pesquisa registrada em
  `conhecimento/achados/entrega-do-produto-pago.md` é leitura de segunda
  mão, e diz isso.

**Próximo passo:** é humano. `STRIPE-001` (onboarding) ou `CF-001` (criar
a Cloudflare) — os dois são independentes e podem começar em paralelo.

**Verify:** `npm run verificar` (com `CHROMIUM_PATH` e
`PUPPETEER_EXECUTABLE_PATH` apontando para o Chromium).

**Working tree esperado:** limpo. Se estiver sujo, entenda antes de
commitar — pode ser sessão interrompida.
