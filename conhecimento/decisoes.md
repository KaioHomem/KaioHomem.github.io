# Registro de decisões

Ordem cronológica inversa. **Decisão revogada não se apaga** — o motivo de
alguém ter mudado de ideia costuma valer mais que a conclusão atual.

---

## 2026-08-21 — Vendorizar o impeccable e medir contraste no pixel

**Decisão:** commitar o skill do impeccable em `.claude/skills/` e trocar
o medidor de contraste do `verificar-paginas.js` por medição no pixel
pintado.

**Por quê (vendorização):** `npx impeccable install` baixa as skills de
`impeccable.style`, e o proxy de saída responde 403. Só o motor de
detecção vem pelo npm. O código é Apache 2.0 e está no GitHub, de onde
foi clonado. Sem o diretório no repositório, a CI não roda o detector e a
próxima sessão esbarra no mesmo 403.

**Por quê (contraste):** o medidor anterior subia a árvore somando
`backgroundColor`. Acertava fundo semitransparente e errava três coisas
que o site usa — gradiente, `backdrop-filter` e `opacity` em ancestral.

O que a troca achou: `opacity: 0.75` nos cartões travados do painel
derrubava o selo para 3,55:1 e a nota para 3,71:1. As cores declaradas
passavam folgado; quem mais precisava ler aquele cartão era justamente
quem ainda não tinha conectado nada.

**Onde o detector do impeccable erra, e por que os dois gates ficam:** ele
lê a parada de um gradiente (`rgba(...,0.12)`) sem aplicar o alfa e acusa
1,0:1 em texto que mede de 5,4 a 6,9:1 no pixel. Foram 30 falsos
positivos nesse formato. O gate do repositório cobre contraste com mais
precisão; o do impeccable cobre uma classe que o nosso não vê — tarja
lateral, fonte batida, linha longa, caixa-alta em frase, título que pula
nível, escada de tipos achatada.

**Custo:** 3,5 MB no repositório; a versão vendorizada envelhece e precisa
ser atualizada à mão (o passo a passo está em
`.claude/skills/impeccable/COMO-VEIO-PARAR-AQUI.md`).

**Gatilho para reabrir:** se o download deixar de ser bloqueado, dá para
trocar o diretório por uma devDependency npm e apagar 3,5 MB.

---

## 2026-08-18 — Adiar bump, upsell e migração de plataforma

**Decisão:** não construir order bump, upsell nem migrar para
Kiwify/Hotmart antes da primeira venda.

**Por quê:** os três são otimizações de **ticket médio**. O ticket médio
hoje é R$ 0,00 porque as vendas são zero. Multiplicar zero por 1,3 dá
zero. A oferta nunca foi validada: ninguém pagou R$ 97 uma vez.

**Contra-argumento considerado:** o funil completo adicionaria ~R$ 29 de
ticket contra ~R$ 7 de taxa extra por venda, o que compensa. Verdade —
mas as taxas de aceite (20% no bump, 8% no OTO) são [MERCADO], não
medição deste negócio, e a migração é irreversível na prática.

**Gatilhos para reabrir:**
- 1ª venda → order bump passa a valer a tarde de trabalho
- 10 vendas → dá para medir aceite de verdade; migração se paga
- pedidos repetidos de multi-CNPJ → o plano de R$ 297 ganha demanda real

---

## 2026-08-18 — Descartar o plano multi-empresa de R$ 297

**Decisão:** não construir a versão multi-empresa mirando escritórios de
contabilidade.

**Por quê:** a tese caiu ao ser confrontada. Contador com 15 clientes já
usa Domínio, Alterdata ou Questor, e **precisa transmitir eSocial**, que
este produto explicitamente não faz. Ele não troca o sistema dele por um
arquivo HTML.

O comprador real de multi-empresa é quem tem 2 ou 3 CNPJs próprios — uma
loja e um restaurante. Segmento pequeno demais para justificar dias de
código.

**Quem propôs:** eu mesmo, na resposta anterior. A hipótese morreu antes
de virar código, que é o resultado desejado.

---

## 2026-08-18 — Não publicar preço de concorrente na página de venda

**Decisão:** a âncora de preço de R$ 97 é o **custo do erro**
(R$ 960,56 num único 13º mal calculado), não a mensalidade de sistemas
concorrentes.

**Por quê:** uma busca apontou "a partir de R$ 207/mês para até 5
funcionários", mas a fonte não abriu e o número ficou de segunda mão.
Comparação de preço com concorrente numa página comercial é afirmação
que precisa se sustentar se alguém checar.

O custo do erro é melhor âncora de qualquer forma: é verificável pelo
próprio leitor, na calculadora gratuita do site.

---

## 2026-08-18 — Não vender modelos de documentos de RH

**Decisão:** o order bump, se algum dia existir, não será pacote de
modelos de RH.

**Por quê:** advertência, contrato de experiência e aviso de férias são
**documentos com efeito jurídico**. Vender modelo de advertência para um
comerciante usar em demissão por justa causa, sem revisão de advogado, é
assumir risco que R$ 27 não paga.
