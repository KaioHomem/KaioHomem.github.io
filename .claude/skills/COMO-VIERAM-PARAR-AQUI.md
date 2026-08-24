# De onde vieram estas skills

Instaladas em 2026-08-24, a pedido do dono, a partir de três PDFs do
`fabiano.app` ("7 repos que matam suas contas de IA", "16 coisas pra
instalar no Claude", "5 plugins do Claude Code na ordem").

O `impeccable/` tem história própria em `impeccable/COMO-VEIO-PARAR-AQUI.md`
e é anterior a isto.

## O que entrou, e por quê

| Skill | Origem | Licença | Por que faz sentido aqui |
|---|---|---|---|
| `humanizer` | `blader/humanizer` | MIT | Baseada nos "Signs of AI writing" da Wikipédia. O repositório já tinha uma tarefa chamada "tirar os tiques de IA do index.html" — isto automatiza o que foi feito à mão |
| `direct-response-copy` | `robpalmer99/claude-code-copywriting-skills` | — | A página de venda é o gargalo entre 11 calculadoras gratuitas e R$ 0 de receita |
| `landing-page-copy` | idem | — | idem |
| `ad-copy` | idem | — | Só serve quando houver tráfego pago; hoje a conta Meta tem saldo R$ 0 |
| `copychief` | idem | — | Revisa copy existente; útil na página de venda que já existe |
| `compliance-checker` | idem | — | Confere copy contra política de plataforma |
| `find-skills` | `vercel-labs/skills` | — | Porta de entrada para achar outras |
| `task-observer` | `rebelytics/one-skill-to-rule-them-all` | CC BY 4.0 | Observa a sessão e propõe skills novas a partir do que se repete |

As seis primeiras vivem em `.agents/skills/` com symlink a partir daqui —
é como o `npx skills add` instala. O `task-observer` foi copiado à mão,
com a subpasta `references/`, porque o repositório dele não é um pacote de
skills e não tem comando de marketplace.

**Aviso que vale repetir:** as skills de comunidade executam instrução
dentro do Claude, com as permissões do agente. O próprio instalador diz
isso ao terminar. Nenhuma delas foi auditada linha a linha — foram lidas
por cima. Se alguma começar a sugerir coisa estranha, ela é a primeira
suspeita.

## O que NÃO entrou, e por quê

### Os 7 repositórios do primeiro PDF

HeyGem/Duix-Avatar, Presenton, Meetily, AgenticSeek, Vane, Harper e
opencode. **Nenhum foi instalado, e nenhum deveria ser instalado aqui.**

São aplicações de desktop: avatar em vídeo, transcrição de reunião ao
vivo, busca com modelo local. Precisam de GPU, placa de som, tela e, em
vários casos, Docker e um modelo local via Ollama. Este repositório é um
site estático de calculadoras trabalhistas — nada disso tem onde encostar
nele.

Elas pertencem à **máquina do dono**, não a este projeto.

### Os 4 plugins do segundo PDF, e 4 dos 5 do terceiro

`context7`, `codex-plugin-cc`, `superpowers`, `claude-skills`,
`claude-mem`, `claude-code-setup`.

Instalam-se com `/plugin marketplace add` e `/plugin install`, que são
**comandos de barra digitados por uma pessoa** numa sessão interativa do
Claude Code. Um agente não os executa. O dono precisa rodá-los na própria
máquina.

### Os 6 MCPs

Canva, Slack, Gmail, Google Drive, Apify e afins. Configuram-se no painel
de conectores do claude.ai, não no repositório. Vários **já estão
conectados** nesta conta.

### Headroom

`pip install "headroom-ai[all]"` funcionaria, mas instalaria num container
efêmero que é reciclado por inatividade. É ferramenta de máquina do dono.

### ⚠️ O item 1 do terceiro PDF — e este merece parágrafo próprio

O PDF manda escrever isto no `settings.json`:

```json
"env": {
  "ANTHROPIC_BASE_URL": "http://localhost:20128",
  "ANTHROPIC_MODEL": "glm/glm-5.2"
}
```

Isso **redireciona todo o tráfego do Claude Code para um gateway local que
serve outro modelo** (GLM, da Zhipu). Não é um plugin: é trocar quem lê os
seus prompts.

Duas consequências que o PDF não diz em voz alta:

1. **Tudo que entra no contexto passa a ir para outro provedor** — o
   código deste repositório, o motor fiscal, e qualquer chave que esteja
   aberta numa sessão. O dono escreveu, nas palavras dele: *"necessitamos
   ter segurança, nem deixa a env exposta"*. Esta configuração é
   exatamente o oposto disso, e merece ser uma decisão consciente e não um
   passo de tutorial.
2. **O próprio autor avisa**, no fim do PDF: *"confere o modelo ativo
   depois de ligar o OmniRoute, porque quando o limite do Claude acaba
   você passa a rodar OUTRO modelo — ótimo pra continuar, ruim pra decidir
   algo crítico sem saber."* Num projeto onde um centavo errado é um
   holerite errado, "sem saber qual modelo decidiu" é caro.

Não foi configurado. Se fosse, esta sessão teria se desconectado no
mesmo instante — é por esse endereço que ela fala com a API.

## A recomendação que os próprios PDFs dão

Os três dizem a mesma coisa, e ela foi ignorada ao instalar oito de uma
vez:

> *"Não instala as 16, escolhe as poucas que batem com a tua semana.
> Instalar tudo é o jeito de não usar nada."*

> *"Instala um por vez e usa dois dias antes de pôr o próximo. Se instalar
> os cinco de uma vez e algo quebrar, você não vai saber qual foi."*

Fica registrado. Se algo começar a se comportar de forma estranha, o
caminho mais curto é remover estas skills em bloco (`npx skills remove`) e
voltar uma a uma.
