# Registro de decisões

Ordem cronológica inversa. **Decisão revogada não se apaga** — o motivo de
alguém ter mudado de ideia costuma valer mais que a conclusão atual.

---

## 2026-08-24 (noite) — A demo passa a ser limitada por ausência

**Decisão (Classe B):** `produtos/demo.html` deixa de ser o produto com um
flag por cima. O 13º salário e as férias — a capacidade que o base vende
além do que a demo mostra — são **removidos do arquivo** na geração.

**O problema, medido e não suposto.** O `DEMO` do produto controlava três
coisas: a chave do localStorage, a marca d'água do holerite e o teto de 2
funcionários. Nada mais. `var DEMO=null` devolvia o produto de R$ 97
inteiro. A comparação entre base e demo achava **zero** identificadores ou
frases exclusivos do base — a demo o continha por completo.

Trava que se desfaz num editor de texto não é trava.

**Alternativas consideradas.**

*Manter e documentar o limite.* Rejeitada: a página de venda oferece a demo
como amostra, e a amostra era o produto. Documentar não muda isso.

*Cifrar ou ofuscar a capacidade dentro da demo.* Rejeitada: o comprador
roda tudo no navegador dele, então a chave viajaria junto. É DRM
impossível, e C14 proíbe prometer o que não se cumpre.

*Servir a demo por trás do Worker.* Rejeitada por custo/benefício: a demo
existe para ser aberta sem atrito, e gatear a amostra derruba a conversão
para proteger o que é isca.

*Remover a capacidade paga do artefato gratuito.* **Escolhida.** É o mesmo
padrão que o projeto já usava para a rescisão, ao contrário: o
`gerar-completo.js` **acrescenta** um modo ao base; agora o
`gerar-demo.js` **remove** dois.

**Como.** O produto base marca 18 regiões com sentinelas `/*«PAGO»*/`. O
gerador remove entre elas e recusa se a contagem mudar — assim, apagar uma
sentinela ao editar o produto vira erro barulhento em vez de capacidade
paga vazando para a demo em silêncio.

**Trade-off aceito.** A demo demonstra menos: folha mensal para até dois
funcionários, sem 13º e sem férias. Perde poder de convencimento, ganha
honestidade — e o que ela mostra continua sendo o cálculo real, com o mesmo
layout e o mesmo holerite.

**Rollback.** `git revert` do commit. A demo volta a ser gerada por flag, e
o gate `separacao` volta a reprovar — que é o comportamento correto para
aquele estado.

**O gate deriva as assinaturas do próprio produto**, a cada execução, em
vez de tê-las escritas à mão. Uma lista fixa envelhece: renomear a função
no produto faria o gate procurar para sempre por algo que ninguém escreve,
e passar por estar cego. Derivando, renomear a função renomeia a
assinatura junto. Ele também reprova se sobrarem poucas assinaturas — a
cegueira é detectada, não sofrida.

**Três defeitos meus, achados pelos próprios testes:**

1. Uma sentinela mal posicionada engoliu o valor de `mensal` em
   `CAMPOS_POR_MODO` e gerou `mensal: };`. A demo saiu com `SyntaxError` e
   **todos os outros gates continuaram verdes**, porque nenhum executava o
   script. Virou a checagem de sintaxe do gate.
2. Sobraram leituras de `fMeses`, `fDias` e `fVendidos` de elementos que eu
   já havia removido — `limparCampos()` daria `TypeError` no clique. Achado
   pelo gate, não por leitura.
3. O gate conferia a capacidade gratuita com `indexOf('folhaDe')`, que acha
   as chamadas mesmo com a função removida. Passou a exigir
   `function folhaDe(`.

**Efeito colateral registrado:** quatro âncoras do `gerar-completo.js`
colidiram com as sentinelas novas. O gerador **recusou** em vez de produzir
build quebrado — o desenho de falhar alto se pagou.

---

## 2026-08-24 (noite) — A entrega gateada, construída

**Decisão:** um Worker único da Cloudflare com Static Assets serve o site e
entrega o produto pago, e o site publicado passa a ser um `dist/` gerado a
partir de um allowlist. Aprovada pelo dono depois de ele conferir a
documentação da Cloudflare e do Stripe por conta própria.

Nada foi migrado. Código, build, testes e documentação prontos e verdes; as
ações nas contas são do dono.

**Duas correções dele, e as duas estavam certas.**

*A ordem da migração.* Eu tinha listado "tornar o repositório privado" como
passo. Ele apontou que isso derruba o site antes de existir substituto —
GitHub Pages em plano gratuito despublica ao virar privado. A ordem correta
termina com o repositório privado, não começa: implementar, CI verde,
Cloudflare configurada, testar preview, testar pagamento em modo de teste,
produção, confirmar, **então** privado, então desligar o Pages.

*O enquadramento do webhook.* Eu havia escrito "cartão + Pix dispensa
webhook" como se fosse propriedade do Stripe. Não é. O Stripe recomenda
webhook como mecanismo confiável, ponto. O que estamos escolhendo é uma
v0.1 em que o download é **puxado** pelo comprador e o Worker consulta o
estado naquele instante — e isso funciona porque não há nada a perder no
caminho se ele fechar o navegador. Para meio de confirmação atrasada a
premissa cai. É decisão de escopo, e está escrita como tal no
`ATIVAR-VENDA.md`.

**O buraco que ele achou antes de eu construir.** Conferir só
`payment_status === "paid"` aceita qualquer sessão paga da conta. Com quatro
links de pagamento previstos, quem comprasse o mais barato levaria o mais
caro. A autorização passou a ser cumulativa: sessão válida, paga, `app` e
`produto` na metadata, e preço registrado para aquele produto.

**A decisão de desenho que fecha o buraco de vez:** *não existe parâmetro de
produto na API*. O arquivo sai da metadata da sessão paga, que só o Stripe
escreve. Um endpoint que aceitasse `?produto=completo` seria uma palavra na
barra de endereço entre R$ 97 e R$ 164 — e validar esse parâmetro depois é
mais frágil que nunca aceitá-lo. Há um teste que reprova se alguém o
introduzir.

**Falhar fechado, em dois lugares.** Sem `STRIPE_SECRET_KEY`, e sem lista de
preços, o endpoint responde 503 em vez de entregar. A tentação de deixar
passar enquanto não está configurado é exatamente como se entrega um produto
de graça sem ninguém perceber.

**Allowlist, não denylist.** O `dist/` é construído a partir de uma lista do
que entra. Um denylist erra por omissão — arquivo novo no lugar errado é
publicado porque ninguém lembrou de proibi-lo. Um allowlist erra por
ausência: o arquivo não aparece, alguém percebe, e adiciona. Erro que
esconde conteúdo é recuperável; erro que publica o produto pago, não.

**O achado que reduz o valor do que foi construído, e precisa ser dito.**
Ao escolher as assinaturas do gate anti-vazamento, medi quais trechos
existem no produto base e não na demonstração gratuita. **Zero.** Nenhum
identificador, nenhuma frase. O motivo é o desenho da demo: `gerar-demo.js`
troca `var DEMO=null` por `var DEMO={limite:2}` e não remove nada.

Ou seja: a demo é o produto inteiro com um limite por cima, e voltar a linha
ao original entrega o base de R$ 97. Isso já estava registrado em
`estado-do-negocio.md` como restrição conhecida, mas ganha peso agora — a
entrega gateada protege **de verdade** o módulo de rescisão (que não existe
na demo nem no base) e protege o base apenas contra o caminho preguiçoso.

Não foi corrigido porque não foi pedido, e porque a correção é de produto,
não de infraestrutura: a demo teria de ser gerada **removendo** código em
vez de sinalizando um limite. Fica registrado como escolha consciente.

**Três defeitos meus, pegos pelos próprios testes:**

1. As duas páginas de obrigado tinham `connect-src 'none'` na CSP, e a
   entrega usa `fetch`. Teria sido bloqueado no navegador de todo comprador.
   Achado ao ler o arquivo antes de editar, não por teste.
2. O teste do Stripe fora do ar passava contra o Stripe são: o Worker
   recebia `fetch` por valor ao ser carregado, então trocar o simulado depois
   não o alcançava. Passava verde testando a coisa errada — a mesma família
   do `undefined` contra `undefined` de 24/08.
3. Os identificadores de sessão dos testes eram curtos demais para o formato
   real do Stripe. A validação estava certa; os fixtures é que não pareciam
   sessões de verdade. Corrigi os fixtures, não a regra.

**O `robots.txt` perdeu os `Disallow`.** Ele anunciava o caminho do produto
pago para quem o lesse. Agora o arquivo não é servido, então a linha só
ensinaria onde ele ficava. Entrega e demonstração continuam fora da busca
por `noindex` na própria página, que é mais forte — `Disallow` impede
rastrear, e um robô que não rastreia nunca lê o `noindex`.

---

## 2026-08-24 (tarde) — A conta que eu ia vender já era gratuita

**O que descobri antes de escrever a página de oferta:** a calculadora
`ferramentas/custo-demissao.html` já faz, de graça, exatamente o que eu
tinha escrito na oferta do módulo — verbas, INSS patronal, FGTS, total
que sai do caixa. Vender "a conta que você não sabe fazer" por R$ 67
seria mentira verificável em dois cliques, no mesmo site.

**Decisão:** em vez de escrever uma página que exagera, fazer o módulo
valer o preço. O que ele passa a ter e não existe em lugar nenhum é a
**comparação dos cinco desfechos do mesmo contrato**, lado a lado. É a
pergunta que o dono faz antes de decidir como encerrar, não depois. Mais
o termo impresso, o cadastro já digitado e o funcionamento offline.

A página de oferta diz isso em voz alta, numa seção chamada "O que já é
de graça", antes de pedir dinheiro — e há uma tabela grátis-contra-módulo
onde duas das sete linhas dizem "sim" nos dois lados.

**Dois erros de desenho que eu mesmo cometi e corrigi:**

1. A comparação ganhou um selo verde de "mais barato", e ele caía em
   **justa causa** — lendo como recomendação de registrar dispensa como
   justa causa para economizar. Isso é fraude trabalhista, e o aviso ao
   pé da própria tabela dizia isso. Desenho trabalhando contra o próprio
   texto. O selo saiu.

2. Na página, o número grande em vermelho media dispensa contra justa
   causa — R$ 25 mil enquadrados como "escolha". Justa causa é um fato
   sobre o que aconteceu, não uma opção. O número passou a medir
   **dispensa contra o acordo do art. 484-A**, que é a única comparação
   da tabela que é decisão de verdade. Número menor e certo.

**Order bump, versão que funciona sem servidor:** uma caixa na página de
venda que troca qual link de pagamento o botão usa — R$ 97 sozinho ou
R$ 164 com o módulo. Precisa de um segundo link no Stripe. O
"produtos recomendados" do Stripe também serve e faz o mesmo dentro do
checkout; este acontece antes, na página que a pessoa já estava lendo.

**Vazamento que virou gate:** um teste de navegador quebrou antes de
restaurar o arquivo de configuração e deixou `buy.stripe.com/combo` no
disco; a execução seguinte leu isso como valor real. O
`verificar-consistencia.js` agora reprova link de pagamento de teste e
qualquer link que não seja do Stripe, e os testes restauram em
`finally`. Um link inventado em produção manda quem confiou dinheiro
para um 404.

---

## 2026-08-24 — Construir upsell e downsell, e o que não dá para construir

**Decisão:** módulo de rescisão como upsell pós-compra, parcelamento
como downsell, e order bump pelo "produtos recomendados" do Stripe.
Revoga o adiamento registrado em 18/08 — o dono pediu duas vezes, e
prioridade é dele.

**O que existe de verdade e o que não existe.** O Payment Link do Stripe
faz order bump. Não faz upsell de 1 clique nem downsell: os dois exigem
cobrar de novo sem o cartão ser digitado outra vez, o que precisa de
servidor. O que foi construído é oferta pós-compra na página de
obrigado, com o cartão sendo digitado de novo. Converte menos que um OTO
de verdade e é o que este site comporta.

**Por que rescisão.** É a única coisa que o comprador precisa a seguir e
o produto não faz — a página de venda já admite isso em texto. O motor
já estava escrito e testado no `nucleo.js`.

**Por que dois arquivos e não um com trava.** O comprador baixa o HTML e
pode abrir num editor. `if (comprouOUpsell)` é uma linha que qualquer
pessoa apaga. `folha-simples-completo-<hash>.html` é gerado do base mais
o módulo, e o base não contém o código do módulo em lugar nenhum.

**Por que o downsell é parcelamento e não desconto.** O que impede
alguém de comprar rescisão logo depois de comprar a folha não é preço: é
que ninguém está demitindo hoje. Isso é objeção de momento, e desconto
não resolve objeção de momento — só ensina o comprador a recusar a
primeira oferta para ganhar a segunda. O total parcelado é maior que o à
vista, e o texto da oferta diz isso em voz alta.

**Erro que quase foi para produção.** Portei o `custoDemissao` de
memória em vez de ler o retorno real do `nucleo.js`. A forma era outra,
então a comparação do gate era `undefined` contra `undefined` — e
`Math.abs(undefined - undefined) > 0.011` é `false`. O gate passava
verde sem comparar nada. Três defeitos estavam embaixo: custo calculado
sobre o líquido em vez dos proventos, Simples pagando CPP, e RAT padrão
de 1% em vez de 2%. Achado só porque o teste ao contrário existia. O
`conferir()` do gate agora reprova valor não numérico.

**Preços em aberto.** R$ 67 e 2× R$ 37 são o que veio configurado, não
uma recomendação medida — não há venda nenhuma para calibrar em cima.
Estão em `produtos/funil.js` para o dono trocar.

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
