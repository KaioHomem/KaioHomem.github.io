# HANDOFF — Folha Simples

Escrito em 2026-08-24, na branch `claude/visual-pagina-venda`.
**Revisado no mesmo dia**, depois de a premissa de entrega pelo Stripe ser
verificada contra a documentação oficial e se revelar falsa — ver bloqueio 1.

Este é o documento de entrada. Quem chegar numa sessão nova lê isto antes de
qualquer outra coisa e não precisa de mais nenhum contexto para continuar.

Ele não repete o registro de decisões — esse vive em
[`conhecimento/decisoes.md`](conhecimento/decisoes.md) e é a memória longa do
projeto. Aqui está o estado, a arquitetura, as armadilhas e o que falta.

---

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
| Cloudflare Pages + Worker de entrega + repo privado | **Os dois** | **R$ 0/mês** |
| Serviço pronto (SendOwl, Lemon Squeezy, Gumroad) | Os dois | mensalidade ou taxa maior; em compensação um merchant of record assume a parte fiscal |

**Recomendação: a terceira.** Um fornecedor, uma conta, R$ 0 por mês. O
Worker é um arquivo de ~60 linhas: recebe o `session_id` que o Stripe passa
no redirecionamento, pergunta à API do Stripe se aquela sessão foi paga, e
só então devolve os bytes. A chave secreta mora num secret do Cloudflare,
nunca no repositório. E o plano gratuito do Cloudflare Pages serve
repositório privado, o que atende ao "não quero ser open source" **sem
pagar o GitHub Pro**.

O custo dessa escolha não é dinheiro, é endereço: `kaiohomem.github.io`
vira `algo.pages.dev` a menos que se compre um domínio, e isso quebra as
URLs do sitemap. Com tráfego em ~0, **este é o momento mais barato que vai
existir para trocar.**

> **Nada disso foi implementado.** A decisão é do dono e está pendente.

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

## Estado atual

| Item | Estado |
|---|---|
| Site | no ar em `https://kaiohomem.github.io`, desde 2026-08-18 |
| Produto base (R$ 97) | pronto, gerado, verificado |
| Módulo de rescisão (R$ 67) | pronto, gerado, verificado |
| Build completo (R$ 164) | gerado a partir do base + módulo |
| Página de venda | pronta, passou pelo detector de design |
| Order bump / upsell / downsell | construídos, **desligados por falta de link** |
| Tráfego | ~0 |
| Vendas | **0** |
| Stripe | conta criada, produto e preço criados, **link não criado** |
| Repositório | **público** (ver bloqueio 1) |
| Branch de trabalho | `claude/visual-pagina-venda`, **12 commits** à frente de `main` |
| PR | [#6](https://github.com/KaioHomem/KaioHomem.github.io/pull/6), **draft**, `mergeable_state: clean`, CI verde em `1d24475` |
| Sitemap | 16 URLs; a página de oferta entrou, os arquivos do produto ficam de fora |
| Entrega do produto | **decisão pendente** — ver bloqueio 1 |

**Nenhuma métrica de conversão deste negócio existe.** Qualquer número sobre
desempenho é hipótese ou benchmark de mercado, nunca fato. Isso está registrado
em `conhecimento/estado-do-negocio.md` e deve continuar registrado até existir
a primeira venda.

### Pull requests abertos

Todos em draft, nenhum mesclado:

| PR | Branch | Assunto | Observação |
|---|---|---|---|
| [#6](https://github.com/KaioHomem/KaioHomem.github.io/pull/6) | `claude/visual-pagina-venda` | Design do site inteiro, módulo de rescisão, funil | 12 commits. CI verde. O corpo do PR ainda diz "onze commits" — foi escrito antes do HANDOFF entrar. |
| [#4](https://github.com/KaioHomem/KaioHomem.github.io/pull/4) | `claude/hospedagem-segura` | Cabeçalhos de segurança e política de segredos | |
| [#3](https://github.com/KaioHomem/KaioHomem.github.io/pull/3) | `claude/agentes-fase-0` | Fundação de agentes e Fase 0 | |
| [#2](https://github.com/KaioHomem/KaioHomem.github.io/pull/2) | `claude/agente-marketing-roas` | Calculadora de ROAS/CPA e doutrina de tráfego pago | **Conflita com #6** em `ferramentas/app.js` e `ferramentas/index.html` |

Os PRs #2, #3 e #4 saíram de uma base antiga (`4b3b45f`). Quem for mesclar
deve começar pelo #6, que é o mais recente e o maior, e rebasear os outros em
cima — não o contrário.

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
│   ├── auditoria.js ........... 327 checagens de peso, SEO, meta, orçamento
│   └── gerar-sitemap.js ....... usa a data do commit de cada arquivo como lastmod
│
├── produtos/ .................. o que se vende
│   ├── folha-de-pagamento.html ...... PÁGINA DE VENDA (R$ 97)
│   ├── oferta-rescisao.html ......... PÁGINA DE OFERTA do módulo (R$ 67)
│   ├── pagamento.js ................. ⚠️ link do Stripe + order bump — EDITAR AQUI
│   ├── funil.js ..................... ⚠️ upsell + downsell — EDITAR AQUI
│   ├── comparador-rescisao.js ....... comparador ao vivo na oferta, usa nucleo.js
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

| Comando | O que faz | Quanto passa hoje |
|---|---|---|
| `npm run teste` | testes do motor fiscal | 187/187 |
| `npm run consistencia` | links, textos, configuração, gate do Stripe | 455 |
| `npm run auditoria` | peso, SEO, meta tags, orçamento de bytes | 327 |
| `npm run motor` | paridade produto × núcleo | ~9.820 cenários |
| `npm run completo` | build completo em dia com base + módulo | — |
| `npm run paginas` | navegador real, 22 páginas | 143 |
| `npm run design` | detector do impeccable, 22 páginas | 22 |
| `npm run sitemap` | regenera `sitemap.xml` | — |

`npm run paginas` leva ~4 minutos **neste container**, que é compartilhado.
No runner do GitHub o mesmo gate fecha em ~40 segundos. Se estranhar a
diferença, é isso: a prova de que ele rodou é a contagem impressa no fim
(143 checagens / 22 páginas), não a duração. Já levou 9 minutos — armadilha 4.

O CI (`.github/workflows/ferramentas.yml`) roda `npm run verificar` em Node 22,
em push para `main`, em pull request, e no primeiro dia de cada mês às 09:00 UTC.
A execução mensal existe porque tabela fiscal muda sozinha.

---

## Regras que não se quebram

Estas não são preferências. Cada uma nasceu de um erro concreto.

1. **A matemática fiscal vive só em `nucleo.js`.** Cópias existem apenas dentro
   do produto, e o gate de paridade prova que são idênticas.

2. **Um gate que passa quando não deveria é pior que gate nenhum.** Todo gate
   novo precisa ser testado ao contrário: quebre a coisa de propósito e
   confirme que ele reprova. Todos os gates atuais foram negativados assim —
   8 mutações no motor, `--text-3: #6e7681`, `opacity: 0.75`, a fonte Inter, um
   link de teste, um link fora do Stripe, e o orçamento de peso nas duas
   direções.

3. **Nada de botão morto.** Link vazio → botão desabilitado com um caminho
   alternativo. Nunca um 404, muito menos depois de a pessoa ter pago.

4. **Nada de número inventado.** Se não há venda, não há taxa de conversão. Os
   arquivos em `conhecimento/` marcam a origem de cada número
   (fato / hipótese / mercado), e essa marcação é obrigatória.

5. **O desenho não pode contradizer o texto.** O caso fundador: a comparação de
   rescisões ganhou um selo verde de "mais barato" que caía em **justa causa** —
   virando um convite a registrar dispensa como justa causa para economizar,
   exatamente a fraude que o aviso ao pé da tabela proibia. O selo saiu. Há um
   comentário longo em `produtos/modulo-rescisao-ui.js` explicando por quê, para
   ninguém "melhorar" a página recolocando-o.

6. **Admitir o que já é de graça.** A página de oferta do módulo tem uma seção
   chamada "O que já é de graça", e na tabela grátis-contra-módulo **duas das
   sete linhas dizem "sim" nos dois lados**. Vender o que o próprio site
   entrega sem cobrar é mentira verificável em dois cliques.

7. **Medida de leitura em `em`, não em `ch`.** A fórmula do impeccable é
   `largura ÷ (tamanho da fonte × 0,5)`, então `36em` dá ~72 caracteres em
   qualquer tamanho. O token é `--medida` em `ferramentas/tools.css`.

---

## Armadilhas conhecidas

Treze coisas que já custaram tempo. Se algo parecer inexplicável, procure aqui
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

13. **`custo-demissao.html` já entrega de graça a conta que o módulo cobraria.**
    Descoberto antes de escrever a página de oferta. O valor do módulo teve de
    ser reconstruído em cima da **comparação dos cinco desfechos**, não da conta
    de uma rescisão. Se alguém for reescrever a oferta, checar primeiro o que a
    calculadora gratuita já faz.

---

## Decisões rejeitadas

Registradas para não voltarem por esquecimento. O motivo completo está em
`conhecimento/decisoes.md`.

| Rejeitado | Quando | Por quê |
|---|---|---|
| Plano multi-empresa a R$ 297 | 2026-08-18 | Sem uma única venda de R$ 97, um degrau de preço é fantasia; e multi-empresa exige estado que o arquivo único não tem |
| Migrar para Kiwify / Hotmart | 2026-08-18 | Taxa 2× maior que a do Stripe; a única vantagem real (afiliados) não serve com zero tráfego |
| Publicar preço de concorrente na página de venda | 2026-08-18 | Números de terceiros sem fonte primária; envelhecem e viram mentira |
| Vender modelos de documentos de RH | 2026-08-18 | Produto jurídico sem revisão jurídica |
| Trava por flag dentro do arquivo único | 2026-08-24 | `if (comprou)` é uma linha que se apaga num editor de texto |
| Downsell por desconto | 2026-08-24 | A objeção é de momento ("ninguém está demitindo hoje"), não de preço; desconto só ensina a recusar a primeira oferta |
| Selo de "mais barato" na comparação | 2026-08-24 | Caía em justa causa e lia como recomendação de fraude trabalhista |
| Manchete medindo dispensa × justa causa | 2026-08-24 | Justa causa é um fato sobre o que aconteceu, não uma opção; a comparação honesta é dispensa × acordo do art. 484-A |

| Entregar o arquivo pago pelo próprio Stripe | 2026-08-24 | **Não existe.** O Stripe não hospeda arquivos; a documentação oficial de pós-pagamento só oferece mensagem ou redirecionamento. Era palpite meu escrito como fato na primeira versão deste documento |
| Depósito de objetos (R2 / S3) para o arquivo | 2026-08-24 | Os dois arquivos somam 119 KB. Depósito de objetos existe para mover gigabytes; aqui seria mais um serviço e mais um par de credenciais para não ganhar nada |
| Webhook + e-mail com link assinado, **agora** | 2026-08-24 | É a arquitetura mais robusta e continua sendo o segundo passo certo. Mas são três serviços em vez de um, antes de existir uma única venda |

Também **revogada:** o adiamento de bump/upsell registrado em 2026-08-18. O
dono pediu duas vezes, e prioridade é dele. Construídos em 2026-08-24.

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

## Próximos passos, na ordem

A ordem importa. Os três primeiros são do dono e nenhum agente pode fazer por
ele; do quarto em diante é trabalho normal.

1. **Concluir o onboarding do Stripe.** Dez minutos, uma vez. Passo a passo em
   `produtos/ATIVAR-VENDA.md`. Sem isso não existe link, e sem link não existe
   venda.

2. **Criar o link de pagamento e colar em `produtos/pagamento.js`.** Um campo.
   É o commit que liga a receita.

3. **Decidir a arquitetura de entrega** — ver bloqueio 1 e o achado que o
   sustenta. A recomendação é Cloudflare Pages + Worker + repositório privado,
   R$ 0/mês. A decisão é sua e **nada foi implementado**.

4. **Mesclar o PR #6.** Está verde e limpo. Depois dele, rebasear #2 (que
   conflita), #3 e #4.

5. **Criar os outros três links** (combo, upsell, downsell) — mas só depois de
   existir a primeira venda. Otimizar ticket com zero vendas é otimizar zero.

6. **Publicar o Instagram.** 17 cartões prontos em `marketing/posts/`, a conta
   não existe. É o único canal com material feito e custo zero.

7. **Investigar a pergunta 1** (dono ou contador). É a que mais muda o produto.

8. **Domínio `folhasimples.app`.** Nunca comprado. Vale pouco antes da primeira
   venda, mas é o passo que separa "página no GitHub" de "produto".

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
