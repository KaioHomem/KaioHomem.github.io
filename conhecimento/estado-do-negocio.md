# Estado do negócio

Atualizado em 2026-08-18. Quem pesquisar deve reler antes de responder,
e corrigir aqui o que descobrir de novo.

## O produto

**Folha Simples** — arquivo HTML único, roda offline no computador do
comprador. Sem servidor, sem instalação, sem mensalidade.

- Preço: **R$ 97**, pagamento único
- Faz: folha mensal, **férias** e **13º salário**, com as tabelas de 2026
- Emite recibo de pagamento por funcionário, imprimível
- **Não faz**: rescisão, eSocial, transmissão de guias, FGTS Digital
- Demonstração gratuita em `produtos/demo.html`, limitada a 2 funcionários
- Reembolso: 7 dias, sem justificativa

Motor fiscal coberto por 187 testes automatizados e 3.820 cenários de
paridade contra o motor das calculadoras públicas.

## O funil hoje

Calculadoras gratuitas (11) → página de venda → checkout Stripe → entrega
por redirect para `obrigado.html`.

Duas das calculadoras miram quem compra, não quem trabalha:
**custo de funcionário** e **custo de demissão**. As outras nove atendem
o trabalhador e servem de porta de entrada.

## Números reais

| Item | Valor | Desde quando |
|---|---|---|
| Tráfego | ~0 | site publicado em 2026-08-18 |
| Vendas | 0 | — |
| Ticket médio | — | não há venda |
| Taxa de conversão | desconhecida | sem dado |
| CAC | — | nunca houve mídia paga |

**Nenhuma métrica de conversão deste negócio existe.** Qualquer número
sobre desempenho é [HIPÓTESE] ou [MERCADO], nunca [FATO].

## Infraestrutura

- Site estático em GitHub Pages, repositório **público**
- Sem backend, sem banco, sem login, sem formulário que grave dados
- Stripe: conta criada, produto `prod_V5oja6iUM74PXV`, preço
  `price_1U5d5bRvYSQ7CX5vJXbMmmxn`, descritor `FOLHA SIMPLES`, Radar Padrão
- **Link de pagamento ainda não criado** — enquanto isso o botão de compra
  fica desabilitado com aviso honesto
- Ativação do Stripe reportada como concluída pelo dono, **não verificada
  por API** (o conector caiu na sessão em que ele avisou)

## Canais

| Canal | Estado |
|---|---|
| SEO | páginas no ar desde 18/08/2026, indexação começando |
| Instagram | **conta não existe**; 17 cartões prontos em `marketing/posts/` |
| Meta Ads | conta `act_1317150126233385` conectada, saldo R$ 0,00, nunca usada |
| E-mail | não há lista nem captura |

## Restrições que não mudam por decisão de marketing

- Site estático: sem carrinho abandonado, sem OTO de um clique, sem
  detecção server-side de nada
- Repositório público: o código-fonte do produto é legível por qualquer um,
  e a demo vira o produto completo trocando uma linha
- Sem CNPJ: a conta Stripe é de pessoa física

## Taxas de plataforma

Levantadas em 2026-08-18 de fontes secundárias (blogs comparativos), **não
de documentação oficial**. Tratar como ordem de grandeza, reverificar antes
de decidir migração.

| Plataforma | Taxa | Líquido em R$ 97 |
|---|---|---|
| Stripe | 3,99% + R$ 0,39 | R$ 92,74 |
| Hotmart Starter | 9,9% + R$ 1,00 | R$ 86,40 |
| Kiwify | 8,99% + R$ 2,49 | R$ 85,79 |
