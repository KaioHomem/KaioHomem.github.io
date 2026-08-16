# Segurança e segredos

## A regra que decide tudo

**Se o navegador precisa ler, não é segredo.**

Não importa se o repositório é privado, se o host é pago, ou se o arquivo tem
nome de `.env`. Qualquer valor que chega ao navegador é legível por quem visita
a página — basta *ver código-fonte* ou abrir a aba de rede.

Repositório privado esconde o **código-fonte**. Não esconde o que é **servido**.

Essa confusão é a origem da maioria dos vazamentos de chave em projetos web.

---

## Classificação

| Valor | É segredo? | Onde vive |
|---|---|---|
| Publisher ID do AdSense | Não | No HTML, de propósito |
| Measurement ID do GA4 | Não | No HTML, de propósito |
| OAuth **client id** | Não | No HTML — é público por desenho |
| OAuth **client secret** | **Sim** | Variável de ambiente do servidor |
| Chave `service_role` do Supabase | **Sim** | Servidor. Ela ignora RLS. |
| Chave `anon` do Supabase | Não | Cliente — protegida por RLS, não por sigilo |
| Chave secreta do Stripe | **Sim** | Servidor |
| Token de página da Meta | **Sim** | GitHub Secrets ou servidor |
| Chave de API de LLM | **Sim** | Servidor. Nunca no cliente. |

A linha do Supabase merece atenção: `anon` é feita para ir ao cliente, e o que
a protege é **Row Level Security**, não o segredo da chave. Se você desligar RLS
achando que a chave é secreta, seu banco fica aberto.

---

## Onde cada segredo mora

**Nunca em arquivo commitado.** Nem em repositório privado — colaborador,
token vazado e backup mal configurado são cenários reais.

| Contexto | Lugar certo |
|---|---|
| Deploy (Vercel, Cloudflare, Netlify) | Environment Variables do projeto |
| GitHub Actions | Settings → Secrets and variables → Actions |
| Desenvolvimento local | `.env`, que está no `.gitignore` |
| Painel do proprietário | `localStorage` do navegador dele — nunca no repo |

`.env.example` existe para documentar **quais** variáveis existem, com valores
vazios. Ele é commitado; `.env` nunca.

---

## Por que sair do GitHub Pages

Não é pelo repositório ser público — o site é estático e não tem segredo algum
para vazar hoje.

É porque **GitHub Pages não permite cabeçalhos HTTP.** Sem isso não existe:

- CSP de verdade (em `<meta>` o navegador ignora `frame-ancestors`)
- HSTS
- `X-Content-Type-Options: nosniff`
- Proteção real contra clickjacking

`vercel.json` e `_headers` neste repositório trazem todos eles. Os dois arquivos
têm o mesmo conteúdo de propósito: trocar de host não deve exigir reescrever a
segurança.

---

## Quando existir backend

Hoje não há. Quando houver — pagamento, banco, agentes com chave de LLM — a
regra é uma só:

```
navegador → sua função de servidor → serviço externo
```

A chave fica na função. O navegador nunca a vê. Ele pede à sua função, e ela
decide o que fazer.

O caminho errado, e comum:

```
navegador → serviço externo direto, com a chave embutida
```

Isso vaza a chave para todo visitante, e o repositório privado não muda nada.

---

## Antes de trocar de domínio

O site acabou de ser publicado e está sendo indexado. Mudar de endereço agora
zera esse processo.

O jeito de não pagar esse preço duas vezes: **registrar um domínio próprio
antes de migrar**. Aí o endereço fica estável e o host vira detalhe — dá para
trocar de Vercel para Cloudflare sem o Google perceber.

Migrar sem domínio próprio significa migrar de novo depois, e pagar o custo de
reindexação duas vezes.

---

## Checklist antes de qualquer deploy

- [ ] `.env` está no `.gitignore` e não aparece em `git status`
- [ ] Nenhuma chave secreta em arquivo dentro de `ferramentas/` ou `painel/`
- [ ] `node ferramentas/verificar-consistencia.js` passa — ele varre padrões de
      token do GitHub, client secret do Google e chave privada
- [ ] Cabeçalhos conferidos em securityheaders.com depois do deploy
