# Segurança

Este documento responde à lista de 20 itens que foi passada, item por
item, dizendo o que foi feito, o que já estava certo e o que **não se
aplica** — e por quê.

A parte mais importante vem primeiro, porque muda o significado de metade
da lista.

## O que este sistema é

Um site estático no GitHub Pages. **Não existe servidor, banco de dados,
login, sessão, cookie de autenticação, upload nem API.** As calculadoras
rodam no navegador do visitante. O produto vendido é um arquivo HTML que
roda no computador do comprador, offline.

Isso não é limitação: é a arquitetura. Um produto de folha de pagamento
sem servidor não tem base de dados de salários para ser vazada, porque
não existe base de dados. Vários itens da lista defendem componentes que
aqui não existem, e implementá-los produziria só a aparência de
segurança.

---

## Itens em que houve trabalho real

### 14. Validar todas as entradas de dados — **defeito corrigido**

Havia um bug de verdade. O produto importa backup em JSON, e a validação
checava só se `funcionarios` era uma lista. Um backup sem o objeto
`empresa` passava, era **gravado**, e só então `preencher()` estourava em
`dados.empresa.nome`.

Resultado: o alerta dizia "arquivo inválido" com o arquivo inválido já
salvo por cima do bom. Na abertura seguinte a app quebrava de novo, e
ficava inutilizável até alguém saber limpar o armazenamento do navegador.

Reproduzido em navegador antes de corrigir, com este backup:

```json
{"funcionarios":[{"nome":"Ana","salario":2400}]}
```

Agora existe um `normalizar()` usado nos dois pontos de entrada — a
importação e a carga do armazenamento. Nada vem direto do arquivo: cada
campo é reconstruído com o tipo certo, limitado em tamanho e em faixa.
Se o arquivo não der um estado válido, **nada é gravado**.

Oito casos verificados em navegador: JSON truncado, `funcionarios` que
não é lista, `null`, tipos errados, funcionário nulo no meio da lista,
payload de XSS, backup sem empresa e backup bom. Todos rejeitam sem
gravar ou normalizam e sobrevivem a um recarregamento.

### 18. Cabeçalhos de segurança — **CSP nova no produto, e ela vale algo**

O argumento de venda do Folha Simples é que a folha não sai do computador
do comprador. Isso era uma promessa. Agora é imposto pelo navegador:

```
default-src 'none'; connect-src 'none'; form-action 'none';
base-uri 'none'; object-src 'none'; frame-src 'none';
```

Verificado em navegador: `fetch`, `XMLHttpRequest` e imagem remota — os
três bloqueados. Mesmo que um script hostil escapasse da validação e do
escape, **não teria para onde enviar nada**.

`script-src` precisa de `'unsafe-inline'` porque o programa é um arquivo
único com o script embutido. É o custo de rodar offline sem instalar
nada, e está registrado como tal.

As outras 14 páginas do site já tinham CSP. `produtos/obrigado.html`
ganhou a dela nesta passagem.

**Limitação real:** GitHub Pages não serve cabeçalho HTTP. `frame-ancestors`
e HSTS só funcionam em header, não em `<meta>` — por isso existem
`vercel.json` e `_headers` no PR #4, para quando o site sair do Pages.

### 20. Varredura de dependências — **não rodava**

`npm audit` falhava com `ENOLOCK`: não havia `package-lock.json`. Sem
lockfile, a CI resolvia versões novas a cada execução — um gate rodando
contra código diferente do revisado.

Feito: lockfile gerado, CI passou a usar `npm ci` em vez de
`npm install`, e `npm audit --audit-level=high` entrou como passo.
Resultado atual: **0 vulnerabilidades**.

Nível baixo e moderado não derrubam o build de propósito: a única
dependência é o Playwright, que roda só na CI e nunca chega ao navegador
de um visitante. Travar o deploy por aviso menor treinaria todo mundo a
ignorar o passo.

E há um gate novo afirmando o que de fato importa: **o site publicado tem
zero dependências de produção**. Não há cadeia de suprimentos para
comprometer. Se alguém adicionar uma, a CI para e obriga a decisão a ser
consciente.

### 5. Criptografar dados sensíveis — **implementado onde tem efeito**

O backup exportado é a única parte da folha que sai do computador: vai
por e-mail para o contador, para um pendrive, para a pasta que sincroniza
com a nuvem. Ali o salário de todo mundo viajava em texto puro.

Agora a exportação pede senha e cifra o arquivo com **PBKDF2-SHA256,
310.000 iterações** (recomendação da OWASP), derivando **AES-GCM de 256
bits**. A contagem de iterações vai dentro do arquivo, para que um backup
antigo continue abrindo quando o número subir.

Verificado em navegador: o arquivo cifrado não contém nada em texto puro,
a senha certa abre, a senha errada é recusada **sem importar nada**.
`crypto.subtle` funciona em `file://` porque o navegador trata `file:`
como contexto seguro — conferido, não presumido.

**O localStorage ficou de fora de propósito.** Cifrar dado que a própria
página tem de ler exigiria a chave junto do código: obfuscação, não
criptografia. Pedir a senha a cada abertura protegeria de verdade, mas num
programa usado uma vez por mês é o atrito que faz a pessoa voltar para a
planilha. E quem tem acesso ao navegador do dono já tem acesso à máquina
do dono.

---

## Itens que já estavam corretos — verificados, não presumidos

### 1. Ocultar chaves de API

Não há chave secreta no código servido. O que existe é público por
desenho:

| Valor | Segredo? |
|---|---|
| Publisher ID do AdSense (`ca-pub-…`) | Não — identifica o publisher, é público |
| Chave pública do EmailJS | Não — é literalmente a chave pública |
| OAuth **client id** | Não |
| OAuth **client secret**, `service_role`, chave de LLM | **Sim** — nunca commitados |

O único segredo real do projeto é opcional: o token do GitHub que o dono
pode colar no painel para subir o limite da API. Ele vive apenas no
`localStorage` do navegador dele, a página é `noindex` e está fora do
sitemap, e a própria tela diz isso.

Num site estático não há alternativa: não existe servidor para guardar o
token. A opção honesta é a que está lá — deixar claro onde ele fica.

### 2. Remover segredos do histórico do Git — **histórico limpo**

Varridos os **47 commits de todas as branches** procurando token do
GitHub (`ghp_`, `github_pat_`), client secret do Google (`GOCSPX-`),
chave de API do Google (`AIza`), chave privada PEM e chave do Stripe
(`sk_live_`, `sk_test_`):

**Zero ocorrências reais.** As únicas aparições dessas strings são um
`placeholder` na interface do painel e os próprios padrões de detecção do
`verificar-consistencia.js`.

Houve um vazamento antes, de outra natureza: o ID da conta de anúncios e
o valor gasto entraram num `MARKETING.md`. Foram removidos, o commit foi
corrigido e o force-push verificado nas quatro branches remotas.

O gate de segredos roda em toda execução da CI e cobre `ferramentas/`,
`painel/` e `produtos/`.

### 15. Escapar conteúdo enviado pelos usuários — **verificado com payloads reais**

Nome de funcionário, cargo, razão social e CNPJ passam por `esc()` em
**todos os seis pontos de renderização** do produto — as três tabelas e
os três recibos.

Testado com quatro payloads (`<img onerror>`, `<script>`, `<svg onload>`,
`<iframe src=javascript:>`) em campos de empresa e de funcionário, e
depois impresso: **script executado: nenhum. Elementos injetados no DOM:
zero.** Tudo renderiza como texto literal.

### 19. Forçar HTTPS

GitHub Pages serve HTTPS e redireciona HTTP com "Enforce HTTPS" ativo.
Nenhuma página carrega recurso `http://` — há um gate de auditoria
verificando isso a cada execução.

### 13. Consultas parametrizadas · 16. Restringir uploads

Não há SQL nem upload. O único arquivo que entra no sistema é o backup
JSON colado pelo usuário no próprio navegador dele — coberto pelo item 14.

---

## Itens que não se aplicam

Não porque foram dispensados, mas porque **o componente não existe**.
Implementá-los produziria arquivos com nome bonito e nenhum efeito.

| Item | Por que não se aplica |
|---|---|
| 3. Chave pública para o banco | Não há banco |
| 4. Row-Level Security | Não há banco nem linhas |
| 6. Autenticação no servidor | Não há servidor nem autenticação |
| 7. Restringir acesso a registros | Não há registros compartilhados: cada folha vive no navegador de quem a digitou |
| 8. Impedir adulteração de campos | Não há limite de confiança cliente/servidor. O usuário adultera o próprio dado, no próprio computador — não há outra parte para enganar |
| 9. Proteger cookies de sessão | Não há sessão nem cookie de autenticação |
| 10. Hash de senhas | Não há conta nem senha (a senha do backup não é armazenada em lugar nenhum: é derivada em memória e descartada) |
| 11. Limitar tentativas de login | Não há login |
| 12. Proteção contra bots | Não há formulário que grave nada nem endpoint que consuma recurso |
| 17. Devolver só o necessário na API | Não há API própria |

Se o site algum dia ganhar backend — e há um `agentes/esquema.sql`
esperando por isso —, os itens 3, 4, 6, 7, 9 e 17 passam a valer de
imediato, e o `esquema.sql` já traz RLS como premissa em vez de remendo.

---

## Como isso é mantido

Seis gates rodam a cada push, e cada um foi testado ao contrário —
reintroduzindo o defeito que ele existe para pegar:

| Gate | Pega |
|---|---|
| `testes.js` | conta fiscal errada |
| `verificar-consistencia.js` | segredo commitado, dependência de produção nova, CSP do produto removida, moeda comparada como texto |
| `auditoria.js` | recurso `http://`, link quebrado, página obesa |
| `verificar-motor.js` | motor do produto divergindo do testado |
| `verificar-paginas.js` | erro de JavaScript no navegador de verdade |
| `npm audit` | vulnerabilidade alta ou crítica nas ferramentas |

Um detalhe que vale registrar, porque quase passou: a primeira versão do
gate da CSP procurava as diretivas em qualquer lugar do arquivo — e
casava com o **comentário que explica a CSP**, logo acima dela. Passava
verde com a diretiva removida. Agora ele extrai o conteúdo da meta tag e
testa lá dentro, e cada diretiva foi verificada removendo-a uma a uma.

Gate que passa quando não deveria é pior que gate nenhum: dá confiança
falsa. Foi o segundo desta natureza no projeto — o primeiro disparava na
própria documentação da armadilha que ele descrevia.
