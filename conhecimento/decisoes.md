# Registro de decisões

Ordem cronológica inversa. **Decisão revogada não se apaga** — o motivo de
alguém ter mudado de ideia costuma valer mais que a conclusão atual.

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
