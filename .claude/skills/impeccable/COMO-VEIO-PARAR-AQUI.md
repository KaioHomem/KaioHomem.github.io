# Por que este diretório está commitado

O `npx impeccable install` baixa as skills de `https://impeccable.style`,
e o proxy de saída deste ambiente responde 403 para esse domínio. Só o
motor de detecção vem pelo pacote npm; a doutrina de design — o `SKILL.md`
e os arquivos de `reference/` — vinha do download bloqueado.

O código-fonte está aberto em <https://github.com/pbakaus/impeccable>
(Apache 2.0), e foi de lá que este diretório saiu: `plugin/skills/impeccable`
do clone, na versão marcada no cabeçalho do `SKILL.md`.

Ficou commitado por dois motivos:

1. **A CI depende dele.** `ferramentas/verificar-design.js` chama
   `scripts/detect.mjs` daqui. Sem o diretório no repositório, o job
   "Detector de design" não roda.
2. **A próxima sessão não precisa refazer o achado.** Sem isto, quem
   abrir este repositório de novo esbarra no mesmo 403 e provavelmente
   conclui que a ferramenta não está disponível.

## Como atualizar

```
git clone --depth 1 https://github.com/pbakaus/impeccable /tmp/imp
rm -rf .claude/skills/impeccable
cp -r /tmp/imp/plugin/skills/impeccable .claude/skills/impeccable
cp -r /tmp/imp/plugin/agents/. .claude/agents/
cp /tmp/imp/LICENSE .claude/skills/impeccable/LICENSE
```

Depois rode `npm run design` e confira o que mudou de regra.

## Ambiente

O detector precisa de um Chromium. O `puppeteer` está nas
devDependencies e baixa o dele no `npm ci`. Onde o download não é
possível, aponte `PUPPETEER_EXECUTABLE_PATH` para um navegador já
instalado — foi assim que ele rodou aqui.
