# Como entregar um arquivo pago depois do pagamento

Pesquisado em 2026-08-24. Confiança: **alta** nos fatos de documentação,
**média** nos limites de plano gratuito (ver ressalva de fonte abaixo).

Motivo da pesquisa: o `HANDOFF.md` registrou, como se fosse fato, que
"tirar o arquivo do repositório e entregar pelo Stripe" resolveria o
problema do produto pago exposto. Isso era **palpite meu, não verificado**.
O dono mandou conferir antes de construir qualquer coisa em cima. Fez bem.

---

## Ressalva de fonte, antes de tudo

`docs.stripe.com` está **bloqueado pelo proxy de egresso desta sessão**
(403 no CONNECT). O README do proxy diz para reportar o host bloqueado e
não contornar. Então nada aqui foi lido diretamente na página do Stripe:
o conteúdo veio pela ferramenta de busca, que indexa e cita essas mesmas
páginas oficiais.

Na prática isso é diferença de grau, não de tipo — as frases citadas são
das páginas oficiais. Mas quem for implementar **deve reabrir os links no
navegador** e confirmar, porque API de pagamento muda e uma citação de
segunda mão envelhece pior que a fonte.

---

## A descoberta que derruba a premissa

**O Stripe não hospeda nem entrega arquivos digitais.** Não existe campo
para anexar um arquivo a um produto, não existe entrega automática de
download, não existe gestão de acesso.

A página oficial de pós-pagamento de Payment Link lista **exatamente duas**
opções depois do pagamento:

1. uma mensagem de confirmação, que dá para personalizar; ou
2. um redirecionamento para uma URL sua.

Não há uma terceira. Se o Stripe entregasse arquivos, estaria ali.

Corroboração pelo lado do ecossistema: o próprio Marketplace de Apps do
Stripe lista o **SendOwl** como a forma de "entregar automaticamente e com
segurança os bens digitais vendidos com Stripe". Uma plataforma não
recomenda um parceiro para fazer o que ela já faz.

**Consequência:** a terceira linha da tabela de opções do `HANDOFF.md`
estava errada e foi corrigida. Não existe caminho em que o Stripe seja o
depósito do arquivo.

---

## O que o Stripe realmente oferece

### Redirecionamento com o identificador da sessão

Na URL de redirecionamento dá para incluir o literal `{CHECKOUT_SESSION_ID}`,
e o Stripe o substitui pelo identificador real da sessão de checkout:

```
https://kaiohomem.github.io/produtos/obrigado.html?session_id={CHECKOUT_SESSION_ID}
```

Esse identificador é a chave de tudo. **Mas ele sozinho não prova nada** —
é só um texto na barra de endereço, e quem inventar um `cs_...` qualquer
recebe a mesma página.

### A verificação exige a chave secreta

Para saber se aquela sessão foi realmente paga, é preciso chamar a API do
Stripe e ler o campo `payment_status`, que vale `paid`, `unpaid` ou
`no_payment_required`. Essa chamada é autenticada **com a chave secreta**
(`sk_...`).

Isto é o ponto de virada da arquitetura inteira: **chave secreta não pode
ir para o navegador.** Qualquer verificação de pagamento exige um pedaço de
código rodando fora do computador do visitante. Não há versão estática
disso — nenhuma.

### O que o Stripe recomenda oficialmente

A página de cumprimento de pedido é direta:

> O Stripe envia um evento `checkout.session.completed` quando o cliente
> completa o pagamento de uma Checkout Session. **Disparar o cumprimento
> apenas a partir da sua página de sucesso não é confiável.**

E manda ouvir o evento em vez de esperar o cliente voltar ao site. Também
exige que a função de cumprimento seja **idempotente** — ela pode ser
chamada várias vezes, inclusive ao mesmo tempo, para a mesma sessão.

**Uma ressalva honesta sobre essa recomendação.** Ela foi escrita pensando
em cumprimento que *empurra* — despachar um produto físico, provisionar uma
conta, mandar um e-mail. Aí perder o evento significa o cliente pagar e não
receber, e a página de sucesso realmente não serve, porque o navegador pode
fechar.

O caso daqui é cumprimento que *puxa*: o comprador clica e baixa. Se ele
fechar o navegador, ele volta pelo link ou escreve um e-mail — não há nada
para perder no caminho. A recomendação continua sendo a mais robusta, mas a
diferença de risco entre as duas para **este** produto é bem menor do que a
frase sugere. Vale dizer isso em voz alta em vez de citar a regra como se
fosse absoluta.

---

## O tamanho do arquivo muda a conta

| Arquivo | Tamanho |
|---|---|
| `folha-simples-<hash>.html` | 47 KB |
| `folha-simples-completo-<hash>.html` | 72 KB |

**119 KB somados.** Isso é menor que uma única foto de celular.

Metade das arquiteturas que se recomendam para "vender arquivo digital"
existe para resolver o problema de mover gigabytes: armazenamento de
objetos, URL assinada, CDN na frente, cobrança por egresso. Nada disso é
necessário aqui. O arquivo cabe **dentro** do código que o entrega.

Quem montar depósito de objetos para 119 KB está resolvendo um problema que
não tem.

---

## As opções, comparadas

### A — Redirecionamento puro, sem verificação (o que existe hoje)

Paga → volta para `obrigado.html` → clica num link para o arquivo.

- **Verificação:** nenhuma. A URL é fixa e serve para qualquer um.
- **Custo:** R$ 0
- **Complexidade:** zero
- **Segurança:** nenhuma. Hoje o arquivo é servido pelo GitHub Pages, está
  listado na árvore de um repositório público, e o `robots.txt` **anuncia o
  caminho** (`Disallow: /produtos/folha-simples`) para quem o ler.
- **Atende os requisitos?** Não. Falha em "liberar só para comprador".

### B — Redirecionamento + verificação server-side num Worker

Paga → volta com `?session_id=cs_...` → a página chama um endpoint próprio
→ o endpoint pergunta ao Stripe se aquela sessão foi paga → se foi,
devolve os bytes do arquivo.

- **Verificação:** real, contra a API do Stripe, com a chave secreta.
- **Custo:** R$ 0. O plano gratuito do Cloudflare Workers dá 100.000
  requisições por dia.
- **Complexidade:** **um arquivo**, na casa de 60 linhas. Sem banco, sem
  webhook, sem depósito de arquivos, sem serviço de e-mail.
- **Segurança:** boa. O arquivo deixa de ter URL pública — ele só existe
  como resposta de um pedido autorizado. A chave secreta mora num secret do
  Cloudflare, nunca no repositório.
- **Fraqueza conhecida:** quem comprou pode passar o próprio link adiante.
  Mitigável com janela de tempo ou contador de downloads, e nenhum dos dois
  precisa de banco de dados.
- **Atende os requisitos?** Todos os seis.

### C — Webhook + link temporário assinado

Paga → o Stripe chama seu webhook → você grava um token e manda um e-mail
com um link que expira.

- **Verificação:** a mais robusta. Não depende do navegador do comprador.
- **Custo:** R$ 0 nos planos gratuitos, mas **três serviços em vez de um**:
  Worker, armazenamento de chave-valor e um provedor de e-mail.
- **Complexidade:** bem maior. Segredo de webhook, verificação de
  assinatura, idempotência de verdade, conta e chave de e-mail, e o
  problema clássico de e-mail transacional caindo em spam.
- **Ganho real sobre B:** o comprador recebe uma cópia durável no e-mail e
  não perde o acesso se fechar a aba. É um ganho verdadeiro.
- **Veredito:** é o **segundo** passo certo, não o primeiro. Construir isso
  antes da primeira venda é montar infraestrutura para um fluxo que ninguém
  percorreu ainda.

### D — Armazenamento privado (R2 / S3) com URL assinada

O arquivo mora num balde privado; o código gera uma URL temporária.

- **Custo:** R$ 0 no plano gratuito do R2 (10 GB, egresso zero).
- **Complexidade:** mais um serviço, mais um par de credenciais, mais um
  lugar onde o arquivo pode ficar dessincronizado do que a CI testou.
- **Ganho sobre B:** para 119 KB, **nenhum**. O Worker devolve os bytes
  direto. Isto passaria a fazer sentido se o produto virasse vídeo, ou
  crescesse duas ordens de grandeza.
- **Veredito:** engenharia a mais.

### E — Serviço pronto de entrega (SendOwl, Lemon Squeezy, Payhip, Gumroad)

- **Custo:** mensalidade (SendOwl na faixa de US$ 9–18/mês) ou taxa maior
  (Gumroad ~10%; Lemon Squeezy ~5% + taxa fixa, como merchant of record).
- **Complexidade de engenharia:** a menor de todas. Quase zero.
- **A favor, e isto é honesto:** um merchant of record assume a
  responsabilidade fiscal da venda. Para pessoa física vendendo software,
  isso tem valor real e não é pouco.
- **Contra:** mensalidade com zero venda é a pior forma de gastar. E
  `conhecimento/decisoes.md` já registrou, em 18/08, a rejeição de
  Kiwify/Hotmart por taxa — a mesma lógica se aplica.
- **Veredito:** vale reabrir **se** a questão fiscal virar o gargalo. Não
  como solução de entrega.

---

## O problema que nenhuma das opções resolve sozinha

Gatear a entrega tira o arquivo do **site**. Não o tira do **repositório**.

O produto base é um arquivo autorado, não gerado: `gerar-completo.js`
produz o build completo a partir dele, e `gerar-demo.js` produz a demo,
mas o base em si é a fonte. O gate de paridade precisa lê-lo do disco para
comparar os dois motores.

Ou seja: **o repositório precisa conter o arquivo para a CI funcionar.** Se
o repositório é público, o arquivo é público — independentemente de como o
site o serve.

Só há uma saída: o repositório fica privado. E aí esbarra num fato do
GitHub:

> GitHub Pages está disponível em repositórios públicos com GitHub Free.
> [...] Qualquer site publicado no GitHub Pages será **automaticamente
> despublicado** ao tornar o repositório privado.

Tornar privado num plano gratuito **derruba o site**. As saídas são pagar
o GitHub Pro, ou hospedar em outro lugar que sirva repositório privado de
graça.

O Cloudflare Pages faz isso: o plano gratuito **suporta repositório privado**,
com banda ilimitada e 500 builds por mês.

---

## Recomendação

**Cloudflare Pages (site) + Cloudflare Worker (entrega) + repositório GitHub
privado.** Um fornecedor, uma conta, R$ 0 por mês.

Ela é a única combinação que fecha os seis requisitos ao mesmo tempo:

| Requisito | Como fica |
|---|---|
| Manter o site público | Cloudflare Pages, banda ilimitada, grátis |
| HTML pago fora do alcance público | Só existe como resposta do Worker |
| Confirmar que houve pagamento | API do Stripe, `payment_status === 'paid'` |
| Liberar só para comprador | O `session_id` é a credencial, verificada |
| Máxima automação | Nenhum passo manual por venda |
| Sem backend complexo nem custo recorrente | Um arquivo; R$ 0/mês |

E resolve de quebra o pedido antigo que nunca foi atendido — "não quero ser
open source" — **sem pagar o GitHub Pro**.

### O custo que essa escolha tem, e que não é dinheiro

O endereço muda. `kaiohomem.github.io` vira `algo.pages.dev`, a menos que
se compre um domínio. Isso quebra as URLs do sitemap e o pouco de
indexação que exista.

Com o tráfego em ~0, este é **o momento mais barato que vai existir** para
fazer essa troca. Daqui a seis meses com tráfego, o mesmo movimento custa
audiência.

---

## Fontes

Todas lidas via ferramenta de busca, não diretamente (ver ressalva no topo).

- Stripe — cumprimento de pedido: <https://docs.stripe.com/checkout/fulfillment>
- Stripe — depois do pagamento de um Payment Link: <https://docs.stripe.com/payment-links/post-payment>
- Stripe — Checkout Sessions na referência da API: <https://docs.stripe.com/api/checkout/sessions>
- Stripe — SendOwl no Marketplace: <https://marketplace.stripe.com/apps/sendowl>
- GitHub — o que é o GitHub Pages (disponibilidade por plano): <https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages>
- GitHub — visibilidade de repositório: <https://docs.github.com/en/github/administering-a-repository/setting-repository-visibility>
- Cloudflare — integração com Git no Pages: <https://developers.cloudflare.com/pages/get-started/git-integration/>
- Cloudflare — preços do R2: <https://developers.cloudflare.com/r2/pricing/>

Os limites exatos dos planos gratuitos (100.000 requisições/dia no Workers,
10 GB no R2, 500 builds/mês no Pages) vieram de páginas comparativas de
terceiros, **não das tabelas oficiais de preço**. Tratar como ordem de
grandeza e reconferir antes de depender do número.
