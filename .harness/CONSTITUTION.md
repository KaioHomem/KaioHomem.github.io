# Constitution — Folha Simples

Invariantes do projeto. Um agente pode decidir quase tudo sozinho; **não
pode enfraquecer o que está aqui.** Mudar um destes itens é Classe C:
exige o dono.

Cada invariante nomeia **quem a faz cumprir**. Invariante sem mecanismo é
boa intenção — vale enquanto alguém lembra.

---

### C1 — Uma única fonte fiscal
`ferramentas/nucleo.js` é a matemática. O produto offline carrega uma
cópia porque precisa rodar sem rede; a cópia é provada idêntica, não
confiada.
> **Cumpre:** `npm run motor` — 9.820 cenários, tolerância de R$ 0,011.

### C2 — Conteúdo pago não é artefato público
Produto pago não aparece em `dist/`, no sitemap, no robots, nem como URL
estática — nem renomeado, nem colado por partes.
> **Cumpre:** `npm run publicacao` (nome, hash, trecho) + `npm run gate-publicacao`.

### C3 — A demo é limitada por ausência, não por condição
Capacidade que constitui o valor pago tem de estar **fisicamente fora** do
artefato gratuito. Apagar variável, atributo, CSS ou condição não pode
transformar demo em produto.
> **Cumpre:** `npm run separacao`.
> *Histórico: este invariante nasceu violado. Ver `DEMO-001`.*

### C4 — Autorização só em código confiável
Quem libera o produto é o Worker. Querystring, navegador, JS de cliente e
localStorage são entrada, nunca prova.
> **Cumpre:** `npm run entrega` — inclui o teste de que `?produto=` é ignorado.

### C5 — Pagamento tem de corresponder ao produto certo
`payment_status === "paid"` não basta com mais de um produto na conta. A
sessão precisa bater com o produto pedido, por metadata **e** por preço.
> **Cumpre:** `npm run entrega`.

### C6 — Falhar fechado
Sem segredo, sem configuração, sem metadata, sem preço, sem sessão, ou com
o Stripe fora do ar: **não entrega**. Nunca liberar por falta de como
conferir.
> **Cumpre:** `npm run entrega` — 503 sem chave e 503 sem lista de preços.

### C7 — Segredo nunca é versionado
Nem em Git, HTML, `dist/`, bundle, fixture ou documentação.
> **Cumpre:** `npm run consistencia` — recusa `sk_live_`/`sk_test_` no `wrangler.toml`.

### C8 — Gate não é maquiagem
Nunca alterar teste ou gate para recuperar verde. Gate crítico prova nos
dois sentidos: bom passa, ruim deliberado reprova, restaurado passa.
> **Cumpre:** `npm run gate-publicacao`, `npm run gate-separacao`, `npm run gate-harness`.

### C9 — Testar o que vai ser publicado
Produção serve `dist/`. Auditoria, navegador e design leem o `dist/`, não
a árvore de origem.
> **Cumpre:** `ferramentas/publico.js › caminhoDe()`.

### C10 — Base e completo não são níveis de privilégio
O código do módulo pago não mora no arquivo barato escondido por flag.
> **Cumpre:** `npm run publicacao` (assinaturas) + `npm run completo`.

### C11 — Honestidade comercial
Zero vendas significa conversão, CAC, ROAS e aceite de bump **desconhecidos**.
Todo número carrega origem: fato, hipótese ou benchmark externo.
> **Cumpre:** `conhecimento/estado-do-negocio.md` e revisão humana.

### C12 — Mudança recuperável
Verificável, explicável, revertível e commitada. Working tree alheio se
preserva; nada de `git add .` cego.
> **Cumpre:** Git + `npm run verificar`.

### C13 — Harness fora do runtime
`.harness/`, `HARNESS.md` e tooling operacional não entram em `dist/`.
> **Cumpre:** `ferramentas/publico.js` é allowlist — só entra o que está listado.

### C14 — Limite honesto de proteção
O projeto impede acesso pré-compra, download não autorizado, vazamento em
deploy, unlock trivial da demo e escalada entre produtos. **Não promete**
impedir cópia depois que um comprador legítimo recebe o arquivo. Não
inventar DRM impossível nem vender essa promessa.
> **Cumpre:** revisão humana do texto de venda.

---

## Classes de autoridade

**A — implementação.** Decide, implementa, verifica, registra, segue.

**B — arquitetura significativa.** Também decide sozinho. Precisa de
decisão durável proporcional ao risco em `conhecimento/decisoes.md` —
ADR só quando trade-off, blast radius ou rollback justificarem documento
próprio.

**C — constitucional ou externa.** Só o dono. Inclui enfraquecer qualquer
item acima, e todo efeito fora desta máquina: push, merge, deploy, DNS,
segredo real, conta Stripe, conta Cloudflare, tornar o repositório
privado, desligar o Pages, gasto.

Bateu em Classe C: marque o item `blocked_human`, **e procure outro
trabalho `ready`**. Blocker local não é parada global.
