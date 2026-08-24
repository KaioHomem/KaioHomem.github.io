# Ativar a venda

O produto está pronto e verificado. A entrega gateada também. Falta o que
só uma pessoa pode fazer: ativar a conta do Stripe e criar os links.

Isto não é limitação minha — é assim em todo processador de pagamento.
Aceitar os termos de uso é um ato jurídico em nome de uma pessoa, e a conta
bancária que recebe o dinheiro é a sua. Nenhum deles aceita que um agente
faça isso no seu lugar, e é bom que seja assim.

---

## ⚠️ A regra que não se quebra: meios de pagamento

**No lançamento, habilite apenas cartão e Pix. Boleto fica de fora.**

Isto não é preferência. A entrega de hoje pergunta ao Stripe, **no momento
do download**, se a sessão está paga. Cartão e Pix confirmam na hora, então
a resposta já é "sim" quando o comprador chega à página de obrigado.

O boleto não. A documentação do Stripe o classifica como *delayed
notification payment method*: a confirmação leva de um a três dias úteis, e
por isso a própria documentação manda usar webhook para ele. Com boleto
ligado, o comprador é redirecionado, pede o download, recebe uma recusa — e
descobre sozinho que pagou e não recebeu.

> **Habilitar qualquer meio de confirmação atrasada exige, ANTES, implementar
> o fulfillment assíncrono por webhook.** Não é uma melhoria opcional para
> depois: é pré-requisito daquele meio de pagamento.

Isso vale para boleto e para qualquer outro que o Stripe classifique da
mesma forma. Ligar um deles no painel é um clique, noutro sistema, meses
depois — e nada no repositório vai reclamar. Por isso está escrito aqui, em
vez de num comentário de código que ninguém abre na hora de mexer no painel.

### O enquadramento honesto

Não é que "cartão + Pix dispensa webhook" seja uma propriedade do Stripe. O
Stripe recomenda webhook como o mecanismo confiável de cumprimento, ponto.

O que estamos escolhendo é uma **v0.1 simplificada**, e ela funciona por uma
razão específica: aqui o download é *puxado* pelo comprador, não *empurrado*
por nós. Ele clica, e nesse instante o Worker pergunta o estado ao Stripe. Se
ele fechar o navegador, volta pelo link e pede de novo — não há nada para se
perder no caminho, que é o risco contra o qual o webhook protege.

Para meios de confirmação atrasada essa premissa cai, porque o comprador
chega antes da resposta existir. Aí o webhook deixa de ser escolha de escopo.

---

## O que já está feito

Criei na sua conta Stripe (`acct_1TaKZ2RvYSQ7CX5v`, modo real):

| Item | ID |
|---|---|
| Produto "Folha Simples — gerador de holerite offline" | `prod_V5oja6iUM74PXV` |
| Preço, R$ 97, pagamento único | `price_1U5d5bRvYSQ7CX5vJXbMmmxn` |

Nada foi cobrado de ninguém e nada é definitivo.

⚠️ **Não conte com o conector do Stripe.** Em algumas sessões ele pede
autorização e, sem ela, nenhum agente cria link nenhum. Planeje criar os
links você mesmo pelo painel; se o conector estiver ligado, é um bônus.

---

## Passo 1 — ativar a conta

Tudo em <https://dashboard.stripe.com/account/onboarding>.

1. **Nome do negócio.** É o que aparece no checkout e na fatura do cartão do
   comprador. Pode ser o seu nome. Sem isto o Stripe recusa criar link de
   pagamento — foi exatamente onde parei.
2. **Telefone de suporte.** Precisa ser um número seu de verdade.
3. **Aceitar os termos de uso.** O passo jurídico.
4. **Conta bancária.** Para onde o dinheiro cai.

O endereço do site e a descrição do produto o painel também pede:

> Site: `https://kaiohomem.github.io/produtos/folha-de-pagamento.html`
>
> Descrição: Venda de software próprio para cálculo de folha de pagamento no
> Brasil. Produto digital de download único, entregue imediatamente após o
> pagamento, sem assinatura. O programa roda no computador do comprador e
> calcula INSS, IRRF, FGTS e vale-transporte conforme a legislação brasileira.

Descrição vaga é o motivo mais comum de conta nova travar em análise de
risco, então vale colar essa mesma.

---

## Passo 2 — criar o Payment Link do produto base

<https://dashboard.stripe.com/payment-links/create>

1. Escolha o produto **Folha Simples**.
2. **Meios de pagamento:** cartão e Pix. **Boleto desmarcado** — ver a regra
   no topo.
3. Em *After payment*, marque **Redirect customers to a page you host** e
   cole exatamente isto, com as chaves incluídas:

   ```
   https://SEU-ENDERECO/produtos/obrigado.html?session_id={CHECKOUT_SESSION_ID}
   ```

   > O `{CHECKOUT_SESSION_ID}` **não é um exemplo para substituir**. É um
   > literal que o Stripe troca pelo identificador real. Sem ele a página de
   > obrigado não tem o que perguntar, e ninguém baixa nada.

4. **Metadata** — e este passo é o que autoriza o download. Em *Metadata*,
   adicione duas linhas:

   | Chave | Valor |
   |---|---|
   | `app` | `folha-simples` |
   | `produto` | `base` |

   O Stripe copia a metadata do Payment Link para cada Checkout Session que
   nascer dele. É por ela que o Worker sabe **qual arquivo** entregar — e é
   por isso que o navegador não escolhe: não existe parâmetro de produto na
   API.

5. Copie o link (`https://buy.stripe.com/...`) e cole em
   `produtos/pagamento.js`, no campo `link`.

6. Anote o **ID do preço** (`price_...`) que aparece no produto. Ele vai para
   a configuração do Worker no passo 4.

---

## Passo 3 — os outros três links

Só depois da primeira venda. Otimizar ticket com zero venda é otimizar zero.

| Link | `produto` na metadata | Onde o link vai | Entrega |
|---|---|---|---|
| Combo R$ 164 | `completo` | `pagamento.js` › `combo.link` | `obrigado-completo.html` |
| Módulo avulso R$ 67 | `completo` | `funil.js` › `upsell.link` | `obrigado-completo.html` |
| Parcelado 2× R$ 37 | `completo` | `funil.js` › `downsell.link` | `obrigado-completo.html` |

Os três redirecionam para `obrigado-completo.html?session_id={CHECKOUT_SESSION_ID}`
e os três levam `app=folha-simples`.

Anote o `price_...` de cada um: todos entram em `PRECOS_COMPLETO`.

---

## Passo 4 — configurar o Worker

A chave secreta **nunca** entra no repositório:

```bash
npx wrangler secret put STRIPE_SECRET_KEY
```

Os identificadores de preço são públicos por natureza (aparecem no
checkout), então vão no `wrangler.toml`, separados por vírgula:

```toml
[vars]
PRECOS_BASE = "price_1U5d5bRvYSQ7CX5vJXbMmmxn"
PRECOS_COMPLETO = "price_do_combo,price_do_modulo,price_do_parcelado"
```

**Enquanto estiverem vazios, o endpoint recusa entregar e responde 503.** É
de propósito: falhar fechado custa um erro claro durante a configuração;
falhar aberto custa o produto.

---

## Por que o botão fica desabilitado até lá

Com `link` vazio, o botão de compra não vira um link quebrado: fica
desabilitado e a página oferece um e-mail. Um 404 na hora de pagar é o pior
primeiro contato possível com um produto pago.

O `verificar-consistencia.js` recusa qualquer link que não comece com
`https://buy.stripe.com/`, e recusa também os que têm cara de exemplo
(`teste`, `demo`, `exemplo`). Um teste de navegador já deixou
`buy.stripe.com/combo` no disco uma vez, e a execução seguinte leu como
valor real.
