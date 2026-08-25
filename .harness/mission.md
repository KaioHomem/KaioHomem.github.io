# Mission — Harness v0.1 e fechamento técnico pré-migração

**Objetivo durável:** deixar o repositório capaz de continuar sozinho —
uma sessão nova recupera o estado, escolhe trabalho e verifica sem
depender de nenhuma conversa — e fechar o trabalho local que ainda falta
antes da migração para a Cloudflare.

## Escopo

Dentro:

- Harness instalado e provado (recuperação, autoridade, fila, verificação)
- separação estrutural entre a demonstração gratuita e o produto pago
- revalidação da entrega já construída (Worker, `dist/`, anti-vazamento)
- aproximar o verify local do que a CI realmente roda

Fora, e deliberadamente:

- Cloudflare real, Stripe real, deploy, DNS
- tornar o repositório privado, desligar o GitHub Pages
- push, merge, release
- primeira venda

## Autoridade delegada

Classe A e B, dentro da Constitution. Efeito externo é Classe C e vira
`blocked_human` — o item para, a missão não.

## Invariante da missão

O trabalho já concluído e verde **não se refaz**. Só se revalida. O
prompt de bootstrap e os handoffs são orientação; quem manda é o estado
do repositório mais `npm run verificar`.

## Concluída quando

- `npm run harness:check` passa, e reprova quando corrompido de propósito
- `npm run verificar` passa inteiro
- a demo não vira produto por edição trivial, e há gate que prova isso
- a fila reflete o estado real, com o externo em `blocked_human`
- uma sessão nova, recebendo só `HARNESS.md`, reconstrói local, branch,
  HEAD, missão, fila, bloqueios, verify e próximo passo
- nenhuma informação indispensável ficou só no chat
- nenhum push, nenhum efeito externo

## Ordem da migração — registrada, não executada

Repositório privado é o **penúltimo** passo, não o primeiro: no plano
gratuito o GitHub Pages despublica ao virar privado, e derrubaria o site
antes de existir substituto.

```
verify verde  →  Cloudflare configurada  →  preview validado
   →  Stripe em teste  →  compra ponta a ponta  →  produção confirmada
   →  ENTÃO repositório privado  →  ENTÃO Pages desligado
```

Detalhe operacional de cada passo: `produtos/ATIVAR-VENDA.md`.
