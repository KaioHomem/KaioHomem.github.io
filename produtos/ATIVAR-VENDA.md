# Ativar a venda

O produto está pronto e verificado. Falta uma coisa: a conta do Stripe
ainda não pode receber dinheiro.

Isto não é algo que eu consiga fazer por você, e não é limitação minha —
é assim em todo processador de pagamento (Stripe, Mercado Pago, PagSeguro,
Hotmart). Aceitar os termos de uso é um ato jurídico em nome de uma pessoa,
e a conta bancária que recebe o dinheiro é a sua. Nenhum deles aceita que
um agente faça isso no seu lugar, e é bom que seja assim.

São dez minutos, uma vez só. Depois disso a venda roda sozinha.

## O que já está feito

Criei na sua conta Stripe (conta `acct_1TaKZ2RvYSQ7CX5v`, modo real):

| Item | ID |
|---|---|
| Produto "Folha Simples — gerador de holerite offline" | `prod_V5oja6iUM74PXV` |
| Preço, R$ 97, pagamento único | `price_1U5d5bRvYSQ7CX5vJXbMmmxn` |

Nada foi cobrado de ninguém e nada é definitivo — dá para arquivar os dois
no painel a qualquer momento.

## O que falta, na ordem

Tudo em <https://dashboard.stripe.com/account/onboarding>.

1. **Nome do negócio.** É o que aparece no checkout e na fatura do cartão
   do comprador. Pode ser o seu nome. Sem isto o Stripe recusa criar o link
   de pagamento — foi exatamente onde eu parei.
2. **Telefone de suporte.** Precisa ser um número seu de verdade.
3. **Aceitar os termos de uso.** O passo jurídico.
4. **Conta bancária.** Para onde o dinheiro cai. Sem ela dá para receber,
   mas não para sacar.

O endereço do site e a descrição do produto o painel também pede. Pode colar:

> Site: `https://kaiohomem.github.io/produtos/folha-de-pagamento.html`
>
> Descrição: Venda de software próprio para cálculo de folha de pagamento
> no Brasil. Produto digital de download único, entregue imediatamente após
> o pagamento, sem assinatura. O programa roda no computador do comprador e
> calcula INSS, IRRF, FGTS e vale-transporte conforme a legislação brasileira.

Descrição vaga é o motivo mais comum de conta nova travar em análise de
risco, então vale colar essa mesmo.

## Depois que a conta for aprovada

Duas opções — as duas terminam no mesmo lugar.

**Me avise** que eu crio o link de pagamento pela API e deixo tudo ligado.
Eu já tenho acesso de escrita à conta; o que faltava era ela estar ativa.

**Ou faça você mesmo,** se preferir não esperar:

1. <https://dashboard.stripe.com/payment-links/create>
2. Escolha o produto **Folha Simples** que já está lá.
3. Em *After payment*, marque **Redirect customers to a page you host** e cole:
   `https://kaiohomem.github.io/produtos/obrigado.html`
4. Copie o link gerado (`https://buy.stripe.com/...`).
5. Cole em `produtos/pagamento.js`, na linha `link: ''`.

Commit, e está vendendo.

## Por que o botão está desabilitado até lá

Enquanto `link` está vazio, o botão de compra não vira um link quebrado:
ele fica desabilitado e a página oferece um e-mail. Um 404 na hora de pagar
é o pior primeiro contato possível com um produto pago, e um visitante que
bate nisso não volta.
