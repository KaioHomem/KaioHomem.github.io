# Guia do projeto — Folha Simples

**Isto não é o estado do trabalho.** Estado — branch, HEAD, fila, o que
fazer agora — vive em `HARNESS.md` e se recalcula com
`npm run harness:status`. Comece por lá.

Aqui fica o que não muda a cada sessão: por que a arquitetura é assim, o
que cada arquivo faz, e as armadilhas que já custaram tempo a alguém.

| Procurando | Vá para |
|---|---|
| como trabalhar, o que é proibido, como verificar | `HARNESS.md` |
| onde o trabalho parou, a fila | `npm run harness:status` |
| os invariantes que não se enfraquecem | `.harness/CONSTITUTION.md` |
| por que cada decisão foi tomada | `conhecimento/decisoes.md` |
| números do negócio e o que é hipótese | `conhecimento/estado-do-negocio.md` |

## Leia isto primeiro: dois bloqueios

Nenhum dos dois é técnico. Os dois dependem de uma ação do dono, e enquanto
não forem resolvidos o resto do trabalho não vira dinheiro nem segurança.

### 1. O repositório está público, com o produto pago dentro dele

Confirmado pela API do GitHub em 2026-08-24: `"private": false`,
`"visibility": "public"`.

Você pediu duas vezes — *"Tire esse repositorio publico agoraa"* e *"nao
quero ser opencode"* — e **isso não foi feito**. Não foi esquecimento de uma
sessão só: está aberto desde então.

O produto pago está exposto em **três lugares ao mesmo tempo**:

- `produtos/folha-simples-fc86aa480de7f81c.html` (47 KB) e
  `produtos/folha-simples-completo-fc86aa480de7f81c.html` (72 KB) estão
  **listados na árvore do repositório**. São os arquivos de R$ 97 e R$ 164.
- O rodapé do site linka para o repositório: `ferramentas/app.js:121` e
  `produtos/folha-de-pagamento.html:349`. A página de venda ensina o caminho.
- O `robots.txt` **anuncia o caminho** em voz alta:
  `Disallow: /produtos/folha-simples`. Ele existe para tirar o arquivo da
  busca, e o efeito colateral é que qualquer pessoa que abra o robots.txt
  lê onde o produto mora. O comentário no próprio arquivo já admite:
  *"Isto é obscuridade, não segurança"*.

O hash no nome era a única obscuridade, e nenhum dos três lugares a preserva.

#### A premissa que estava errada aqui

A versão anterior deste documento dizia que "tirar o arquivo do repositório
e entregar pelo Stripe" resolveria o problema. **Isso era palpite meu, e é
falso.**

Verificado na documentação oficial: **o Stripe não hospeda nem entrega
arquivos digitais.** Não existe campo para anexar arquivo a um produto. A
página oficial de pós-pagamento de Payment Link lista exatamente duas
opções — mensagem de confirmação, ou redirecionamento para uma URL sua. Não
há terceira. O próprio Marketplace do Stripe indica um parceiro (SendOwl)
para fazer entrega de bem digital, o que uma plataforma não faria se ela
mesma fizesse.

A pesquisa inteira, com fontes e as cinco arquiteturas comparadas, está em
[`conhecimento/achados/entrega-do-produto-pago.md`](conhecimento/achados/entrega-do-produto-pago.md).

#### Os dois problemas são separados

Confundir os dois foi o erro da versão anterior:

| Problema | O que resolve |
|---|---|
| O arquivo é **servido publicamente** pelo site | Gatear a entrega — exige verificar o pagamento, e verificar exige a chave secreta, que não pode ir para o navegador. **Não existe versão estática disso.** |
| O arquivo está **legível no repositório** | Repositório privado. Só isso. |

E o segundo esbarra num fato do GitHub: no plano gratuito, o Pages só
funciona em repositório público, e tornar privado **despublica o site
automaticamente**.

#### As opções reais

| Opção | Fecha os requisitos? | Custo |
|---|---|---|
| Não fazer nada | Não | R$ 0, e o produto continua copiável |
| GitHub Pro + repo privado | Só o segundo problema | ~US$ 4/mês; a URL do arquivo continua servindo para qualquer um |
| **Worker único com Static Assets + repo privado** | **Os dois** | **R$ 0/mês** |
| Serviço pronto (SendOwl, Lemon Squeezy, Gumroad) | Os dois | mensalidade ou taxa maior; em compensação um merchant of record assume a parte fiscal |

**Recomendação: a terceira.** Um projeto na Cloudflare, R$ 0 por mês.

Um Worker único serve o site estático (a partir de `dist/`) **e** roda o
código de entrega, na mesma origem — então não existe CORS para configurar
errado. Os arquivos pagos ficam **fora** de `dist/` e entram no bundle como
módulos `Text`: viram string dentro do código compilado, sem URL que os
alcance. O bundle grátis aguenta 3 MB comprimido e os dois produtos somam
119 KB antes de comprimir.

`/api/baixar` recebe o `session_id` que o Stripe passa no redirecionamento,
pergunta à API do Stripe se a sessão foi paga **e se corresponde a este
produto** (por `metadata` do Payment Link, com `line_items` como segunda
barreira), e só então devolve os bytes com `Content-Disposition: attachment`.
Conferir só `payment_status === "paid"` não basta: qualquer sessão paga da
conta passaria, e o plano é ter quatro links de pagamento.

A chave secreta mora num secret do Cloudflare. O Workers Builds conecta
**repositório privado**, o que atende ao "não quero ser open source" sem
pagar o GitHub Pro.

**Meios de pagamento no lançamento: cartão e Pix. Boleto desligado.** Os
dois primeiros confirmam na hora, e é isso que torna o webhook dispensável
na v0.1. O boleto é, nas palavras do Stripe, um *delayed notification
payment method* — 1 a 3 dias úteis — e com ele ligado o comprador chega à
página de obrigado antes de o pagamento constar, leva 403 e não recebe o
que pagou. Esse acoplamento é invisível e precisa estar escrito no
`ATIVAR-VENDA.md`.

**Dois gates que essa mudança exige** (nenhum existe ainda):
`verificar-publicacao`, que reprova se o produto pago aparecer em `dist/` —
por nome **e** por assinatura de conteúdo, porque glob não sobrevive a
renomeação; e a migração dos gates de página para lerem o `dist/`
construído, senão eles testam a origem enquanto o visitante recebe o build,
que é a mesma classe de defeito que o gate de paridade existe para impedir.

O custo dessa escolha não é dinheiro, é endereço: `kaiohomem.github.io`
vira `algo.pages.dev` a menos que se compre um domínio, e isso quebra as
URLs do sitemap. Com tráfego em ~0, **este é o momento mais barato que vai
existir para trocar.**

### Estado

Construído e verde; **nada migrado**. O estado item a item está em
`npm run harness:status`, não aqui.

### A ordem da migração termina no repositório privado

Torná-lo privado **primeiro** derruba o site: no plano gratuito o GitHub
Pages despublica ao virar privado, e não haveria substituto de pé.

A sequência completa está em `.harness/mission.md`, e cada passo virou um
item em `.harness/work-items.json`, todos `blocked_human`.

### 2. Os quatro links do Stripe estão vazios

Quatro campos, e **só um deles destrava receita**:

| Campo | Arquivo | O que destrava |
|---|---|---|
| `PAGAMENTO.link` | `produtos/pagamento.js:19` | **A venda inteira.** Sem ele o botão de compra fica desabilitado. |
| `PAGAMENTO.combo.link` | `produtos/pagamento.js:42` | O order bump (R$ 164). Vale zero enquanto não houver venda. |
| `FUNIL.upsell.link` | `produtos/funil.js` | O upsell pós-compra (R$ 67). Idem. |
| `FUNIL.downsell.link` | `produtos/funil.js` | O downsell parcelado (2× R$ 37). Idem. |

O passo a passo está em [`produtos/ATIVAR-VENDA.md`](produtos/ATIVAR-VENDA.md).
Resumo: a conta Stripe (`acct_1TaKZ2RvYSQ7CX5v`) já tem o produto
`prod_V5oja6iUM74PXV` e o preço `price_1U5d5bRvYSQ7CX5vJXbMmmxn` criados, mas
o onboarding da conta precisa ser concluído por uma pessoa — nome do negócio,
telefone, termos de uso, conta bancária. Nenhum processador de pagamento aceita
que um agente faça isso, e é bom que não aceite.

⚠️ **Correção ao `ATIVAR-VENDA.md`:** aquele arquivo diz *"Eu já tenho acesso
de escrita à conta"* e oferece criar o link de pagamento pela API. Isso não
vale mais em toda sessão — o conector do Stripe pede autorização e, quando ele
não está autorizado, **nenhum agente cria link nenhum**. Conte com criar o
link você mesmo pelo painel; se o conector estiver ligado, é um bônus.

Enquanto os links estiverem vazios, nada quebra: o botão fica desabilitado com
um aviso e um e-mail, e as ofertas de funil simplesmente não aparecem. Isso é
deliberado — um 404 na hora de pagar é o pior primeiro contato possível.

**Não invente um link para "testar".** Já aconteceu uma vez: um teste de
navegador quebrou antes de restaurar o arquivo e deixou `buy.stripe.com/combo`
no disco. Existe hoje um gate em `verificar-consistencia.js` que reprova
qualquer link que não case com `^https://buy\.stripe\.com/` e qualquer link
com cara de exemplo (`base`, `combo`, `teste`, `test`, `exemplo`, `example`,
`fake`, `demo`).

---

## O objetivo

Um sistema de renda que venda sem a presença do dono.

O produto é o **Folha Simples**: um gerador de folha de pagamento em
**arquivo HTML único, offline**, vendido a **R$ 97**, pagamento único, sem
mensalidade e sem instalação. O comprador baixa um arquivo e abre no navegador.

O funil de entrada são **11 calculadoras trabalhistas gratuitas** no mesmo
site, que existem para ranquear na busca e trazer quem já tem o problema.

Duas das 11 miram quem compra (o empregador) e não quem trabalha: **custo de
funcionário** e **custo de demissão**. As outras nove atendem o trabalhador e
servem de porta de entrada.

---

## Arquitetura

Três ideias sustentam o resto. Se você entender estas três, o resto do código
se explica sozinho.

### 1. Um motor fiscal, uma única fonte da verdade

`ferramentas/nucleo.js` (1.116 linhas) contém **toda** a matemática fiscal do
projeto: INSS, IRRF com o redutor da Lei 15.270/2025, FGTS, rescisão, 13º,
férias, seguro-desemprego, horas extras, Simples Nacional, CLT vs PJ, custo de
funcionário, custo de demissão.

Ele roda nos dois mundos: exporta `window.FerramentasBR` no navegador e
`module.exports` no Node. As 11 calculadoras públicas o carregam por `<script>`;
os testes o carregam por `require`.

**Regra:** nenhuma conta fiscal é escrita em outro lugar. Se uma página precisa
de um número, ela pede ao núcleo.

### 2. O produto é gerado, não escrito

O comprador baixa um HTML único e offline — então o produto não pode carregar
`nucleo.js` por `<script>`. A matemática precisa estar **dentro** do arquivo.

Isso cria um risco óbvio: duas cópias da mesma lei, divergindo com o tempo. A
resposta é um **gate de paridade**, não disciplina humana:

```
ferramentas/nucleo.js  ──┐
                         ├──> produtos/verificar-motor.js  ──> reprova se divergirem
produto (HTML único)   ──┘
```

`produtos/verificar-motor.js` carrega os **dois** motores e compara:

- 1.326 salários
- 1.074 cenários de 13º
- 1.420 cenários de férias
- **6.000 cenários de rescisão** (5 tipos × 3 regimes × 4 tempos de casa)
- 3 âncoras absolutas

Tolerância de R$ 0,011. Se um centavo divergir, o CI fica vermelho.

### 3. Dois arquivos, não um com trava

O módulo de rescisão **não** é uma flag dentro do produto base. São dois
arquivos distintos:

| Arquivo | Preço | Conteúdo |
|---|---|---|
| `folha-simples-fc86aa480de7f81c.html` | R$ 97 | folha, 13º, férias, holerite |
| `folha-simples-completo-fc86aa480de7f81c.html` | R$ 164 | o de cima **+** rescisão |

O motivo: o comprador baixa o HTML e pode abrir num editor de texto.
`if (comprouOUpsell)` é uma linha que qualquer pessoa apaga. O arquivo base
**não contém o código do módulo em lugar nenhum** — não há o que destravar.

O build completo é gerado por `produtos/gerar-completo.js`, que injeta
`modulo-rescisao.js` (motor) e `modulo-rescisao-ui.js` (interface) no base em
**9 pontos de ancoragem**. Rodar com `--verificar` confere se o build no disco
está em dia com o base e com o módulo, sem reescrever nada.

---

## Estrutura de arquivos

```
/
├── HANDOFF.md ................. este arquivo
├── README.md .................. visão geral do repositório
├── SEGURANCA.md ............... política de segredos e cabeçalhos
├── package.json ............... só scripts de verificação; o site não usa npm
├── index.html ................. portfólio pessoal (anterior ao negócio)
├── sitemap.xml ................ gerado por ferramentas/gerar-sitemap.js
│
├── conhecimento/ .............. MEMÓRIA LONGA — leia antes de pesquisar
│   ├── INDICE.md .............. achados de pesquisa + fila de perguntas abertas
│   ├── decisoes.md ............ registro cronológico inverso; decisão revogada NÃO se apaga
│   ├── estado-do-negocio.md ... números reais, infraestrutura, canais, taxas
│   └── achados/
│       └── entrega-do-produto-pago.md  ⭐ sustenta o bloqueio 1
│
├── ferramentas/ ............... as 11 calculadoras gratuitas + toda a verificação
│   ├── nucleo.js .............. ⭐ MOTOR FISCAL — fonte única da verdade (1.116 linhas)
│   ├── tools.css .............. design system compartilhado (tokens, --medida: 36em)
│   ├── app.js ................. shell comum das páginas (cabeçalho, rodapé, lista)
│   ├── pg-*.js ................ um por calculadora; só interface, zero matemática
│   ├── *.html ................. as 11 páginas
│   ├── consentimento.js ....... banner de consentimento
│   ├── monetizacao.js ......... chamadas para o produto dentro das calculadoras
│   ├── testes.js .............. 187 verificações do motor
│   ├── verificar-tabelas.js ... confere as tabelas fiscais de 2026
│   ├── verificar-consistencia.js  455 checagens (inclui o gate de link do Stripe)
│   ├── verificar-paginas.js ... 143 checagens de navegador em 22 páginas
│   ├── verificar-design.js .... detector do impeccable nas 22 páginas
│   ├── publico.js ............. ⭐ ALLOWLIST: o que pode ser publicado
│   ├── gerar-dist.js .......... constrói o dist/ a partir dele
│   ├── verificar-publicacao.js  reprova produto pago no dist/
│   ├── testar-gate-publicacao.js  prova que o gate acima reprova mesmo
│   ├── auditoria.js ........... 327 checagens, agora sobre o dist/
│   └── gerar-sitemap.js ....... usa a data do commit de cada arquivo como lastmod
│
├── worker/ .................... a entrega gateada
│   ├── index.js ............... ⭐ serve o dist/ e o /api/baixar
│   └── testes.js .............. 20 testes, Stripe simulado
├── wrangler.toml .............. config do Worker; NENHUM segredo aqui
├── dist/ ...................... gerado, fora do git; é o que se publica
│
├── produtos/ .................. o que se vende
│   ├── folha-de-pagamento.html ...... PÁGINA DE VENDA (R$ 97)
│   ├── oferta-rescisao.html ......... PÁGINA DE OFERTA do módulo (R$ 67)
│   ├── pagamento.js ................. ⚠️ link do Stripe + order bump — EDITAR AQUI
│   ├── funil.js ..................... ⚠️ upsell + downsell — EDITAR AQUI
│   ├── comparador-rescisao.js ....... comparador ao vivo na oferta, usa nucleo.js
│   ├── entrega.js ................... fala com /api/status e monta o botão
│   ├── obrigado.html ................ entrega do base + upsell
│   ├── obrigado-completo.html ....... entrega do completo
│   ├── demo.html .................... demonstração gratuita, limitada a 2 funcionários
│   ├── modulo-rescisao.js ........... motor da rescisão (puro, sem DOM)
│   ├── modulo-rescisao-ui.js ........ interface da rescisão (com DOM)
│   ├── gerar-completo.js ............ injeta o módulo no base em 9 âncoras
│   ├── gerar-demo.js ................ gera a demo a partir do base
│   ├── gerar-capturas.js ............ gera as capturas de tela .webp
│   ├── verificar-motor.js ........... ⭐ GATE DE PARIDADE entre produto e núcleo
│   ├── ATIVAR-VENDA.md .............. passo a passo do Stripe
│   ├── folha-simples-*.html ......... 🔒 O PRODUTO (ver bloqueio 1)
│   └── tela-*.webp .................. capturas usadas nas páginas de venda
│
├── marketing/
│   ├── instagram.md ........... plano de conteúdo
│   ├── gerar-posts.js ......... gera os cartões
│   └── posts/ ................. 17 cartões PNG prontos, nunca publicados
│
├── painel/ .................... painel interno de acompanhamento
│
├── .impeccable/config.json .... 3 waivers documentados de low-contrast
├── .claude/skills/impeccable/ . toolkit de design vendorizado (Apache 2.0, v4.1.1)
├── .claude/agents/ ............ 5 subagentes (4 do impeccable + pesquisa-crescimento)
└── .github/workflows/
    ├── ferramentas.yml ........ o CI: roda npm run verificar
    └── jekyll-gh-pages.yml .... publicação
```

---

## Como rodar

Tudo de uma vez:

```bash
CHROMIUM_PATH=/opt/pw-browsers/chromium \
PUPPETEER_EXECUTABLE_PATH=/opt/pw-browsers/chromium \
npm run verificar
```

As duas variáveis de ambiente só são necessárias nos gates que abrem navegador
(`paginas` e `design`). Sem elas, o puppeteer tenta baixar o Chromium e falha.

Individualmente:

| Comando | O que faz |
|---|---|
| `npm run harness:check` | o Harness ainda descreve a realidade |
| `npm run dist` | constrói o diretório publicado |
| `npm run teste` | motor fiscal |
| `npm run consistencia` | navegação, links, configuração, Worker |
| `npm run motor` | paridade entre produto e núcleo |
| `npm run completo` · `demo` | os builds gerados estão em dia |
| `npm run entrega` | autorização do download, Stripe simulado |
| `npm run separacao` | capacidade paga ausente da demo |
| `npm run publicacao` | nada pago no `dist/` |
| `npm run gate-*` | provam que os gates acima reprovam mesmo |
| `npm run auditoria` | peso, SEO, meta, links — no `dist/` |
| `npm run bundle` | mede o Worker (`wrangler --dry-run`) |
| `npm run paginas` · `design` | navegador real e detector de design |

As contagens de cada um mudam; não são copiadas para cá de propósito.
Rode e leia o número que sair.

`npm run paginas` leva ~4 minutos **neste container**, que é compartilhado.
No runner do GitHub o mesmo gate fecha em ~40 segundos. Se estranhar a
diferença, é isso: a prova de que ele rodou é a contagem impressa no fim
(143 checagens / 22 páginas), não a duração. Já levou 9 minutos — armadilha 4.

O CI (`.github/workflows/ferramentas.yml`) roda `npm run verificar` em Node 22,
em push para `main`, em pull request, e no primeiro dia de cada mês às 09:00 UTC.
A execução mensal existe porque tabela fiscal muda sozinha.

---

## Armadilhas conhecidas

Dezesseis coisas que já custaram tempo. Se algo parecer inexplicável, procure aqui
antes de investigar do zero.

1. **Portar função do núcleo de memória.** O `custoDemissao` foi portado sem
   ler o retorno real. A forma era outra, então o gate comparava `undefined`
   com `undefined` — e `Math.abs(undefined - undefined) > 0.011` é `false`.
   Passava verde sem comparar nada, escondendo três defeitos. Hoje o
   `conferir()` do gate reprova valor não numérico. **Sempre leia a
   implementação real antes de portar.**

2. **`String.replace` interpreta ``$'`` na string de substituição.** Numa string de substituição, o
   JavaScript trata ``$'`` como "todo o texto depois do trecho encontrado". O módulo
   contém `.replace('R$ ', '')` — o cifrão colado na aspa forma exatamente essa sequência —
   e injetá-lo como string duplicou metade do produto silenciosamente. `gerar-completo.js`
   usa uma **função** como substituto, nunca uma string.

3. **Âncora de injeção casando dentro de outro seletor.** `.vazio{` casou
   dentro de `td.vazio{` e produziu `td.marcar{` — CSS morto e silencioso.
   Ancore no token inteiro.

4. **`webkitBackdropFilter` é `undefined` no Chromium.** `undefined !== 'none'`
   mandava todo elemento para a rota cara de medição de contraste: 9m19s contra
   4m04s. Use `getPropertyValue('-webkit-backdrop-filter')`.

5. **Captura de página inteira desalinha os retângulos.** Um `<h2>` branco foi
   reportado como `rgb(48,54,61)`. A medição é feita por captura **de cada
   elemento**, nunca `fullPage`.

6. **O pixel modal de uma região com gradiente É o texto.** `.produto-cta h3`
   mediu 1,00:1. A medição amostra o **perímetro**, recuado 2px, espessura 2px.

7. **Duas listas de modos, não uma.** Selecionar "Rescisão" caía silenciosamente
   em `mensal` porque existem whitelists em `modoAtual()` **e** em
   `normalizar()`. As duas precisam ser estendidas.

8. **Fixture de teste vazando para o disco.** Um teste quebrado deixou
   `buy.stripe.com/combo` em `pagamento.js`; a execução seguinte leu como valor
   real. Testes restauram em `finally`, e existe gate contra links de exemplo.

9. **`68ch` renderizou 86–88 caracteres.** O "0" do IBM Plex Sans é largo.
   Use `--medida: 36em`.

10. **O impeccable descarta o alfa dos stops de gradiente** ao medir
    `low-contrast` — gerou 30 falsos positivos. A resposta foi **remover os
    gradientes**, não silenciar a regra. Os 3 waivers que restam estão
    documentados em `.impeccable/config.json` (falso positivo de
    `backdrop-filter` no logo do cabeçalho, mediana medida de 16,0:1).

11. **Estilos de componente morando no `<style>` local de uma página.** As
    regras de `.tela` estavam na página de venda; a imagem vazava na página de
    oferta. Componente compartilhado mora em `tools.css`.

12. **`<h2>` duplicado na página de oferta.** O bloco de funil injeta o próprio
    título; existe `data-titulo` para sobrescrever e `data-sempre` para a página
    de oferta mostrar a oferta mesmo sem link configurado.

13. **CSP com `connect-src 'none'` numa página que precisa de `fetch`.** As
    duas páginas de obrigado tinham isso, e a entrega nova usa `fetch` para
    perguntar o estado da sessão. Teria sido bloqueado no navegador de todo
    comprador. Pego lendo o arquivo antes de editar — nenhum gate pega CSP.

14. **Injetar `fetch` por valor num teste que troca o simulado depois.** O
    Worker guardava a função que existia no momento da carga, então o teste
    do "Stripe fora do ar" rodava contra o Stripe são e passava verde
    testando a coisa errada. Mesma família do `undefined` contra `undefined`.
    Injete uma indireção que resolve na hora da chamada.

15. **A demo é gerada removendo código, não sinalizando um flag.** Foi
    assim que ela deixou de ser o produto base com um teto por cima. O
    produto marca 18 regiões com `/*«PAGO»*/`; `gerar-demo.js` corta entre
    elas e **recusa se a contagem mudar**. Se você editar o produto e
    apagar uma sentinela sem querer, o gerador reclama — não publica uma
    demo com capacidade paga dentro. Ver `conhecimento/decisoes.md`.

16. **`custo-demissao.html` já entrega de graça a conta que o módulo cobraria.**
    Descoberto antes de escrever a página de oferta. O valor do módulo teve de
    ser reconstruído em cima da **comparação dos cinco desfechos**, não da conta
    de uma rescisão. Se alguém for reescrever a oferta, checar primeiro o que a
    calculadora gratuita já faz.

---

## Perguntas em aberto

Estão em `conhecimento/INDICE.md` e nenhuma foi investigada. As duas primeiras
mudam decisões de produto, não só de marketing:

1. **O comprador é o dono da empresa ou o contador dele?** Isso muda o produto
   inteiro, e hoje é palpite.
2. **Qual query de busca um empregador realmente usa** antes de comprar
   ferramenta de folha? As duas calculadoras de empregador foram construídas
   por inferência, sem dado de busca.
3. Order bump em Payment Link do Stripe — qual a limitação real, pela
   documentação oficial?
4. Taxa de aceite de bump/OTO em infoproduto brasileiro — existe dado com
   metodologia, ou só regra de bolso?
5. Quanto custa, de fato, um sistema de folha para empresa de até 5 funcionários?

Existe um subagente para isso: `pesquisa-crescimento`, em
`.claude/agents/pesquisa-crescimento.md`. Ele grava os achados em
`conhecimento/achados/` e atualiza o índice.

A pasta tem **um** achado: [`entrega-do-produto-pago.md`](conhecimento/achados/entrega-do-produto-pago.md),
que é o que sustenta o bloqueio 1.

**Armadilha de pesquisa nesta máquina:** `docs.stripe.com` está bloqueado
pelo proxy de egresso (403 no CONNECT), e o README do proxy manda reportar o
host em vez de contornar. A ferramenta de busca alcança o conteúdo das
mesmas páginas oficiais, então dá para pesquisar — mas é leitura de segunda
mão, e o achado marca isso explicitamente. Quem for implementar deve reabrir
os links no navegador.

---

## Onde continuar lendo

| Arquivo | O que tem |
|---|---|
| `conhecimento/decisoes.md` | **Por que** cada coisa é como é. Cronológico inverso. |
| `conhecimento/estado-do-negocio.md` | Números, infraestrutura, canais, taxas de plataforma |
| `conhecimento/INDICE.md` | Achados de pesquisa e a fila de perguntas |
| `produtos/ATIVAR-VENDA.md` | O passo a passo do Stripe |
| `SEGURANCA.md` | Política de segredos e cabeçalhos |
| `README.md` | Visão geral do repositório |
