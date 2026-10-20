# Roteiro do redesign — kaiohomem.github.io

Branch: `redesign`. O site atual continua no ar até este branch ser aprovado e mesclado.

## Intenção

Quem entra no site leva um "tapa na cara" nos primeiros cinco segundos: impacto visual de produção, movimento com cara de After Effects e um objeto CGI de verdade, sem virar um site pesado ou poluído.

A referência técnica é o site do Maximilian Feix (`maximilianfeix.github.io`). O repositório dele não tem licença, então nada do código dele é copiado: o que entrou aqui foram as técnicas (tipografia gigante, coreografia por scroll, um único arquivo de movimento, fallback de acessibilidade), reconstruídas do zero e com identidade própria.

## Identidade: "Render"

O Kaio faz motion e CGI (Blender + HyperFrames no repo `Motion-sfx-ae`). O site trata a própria página como uma composição sendo renderizada:

- **Timecode** no canto da tela (`00:00:00:00`) que avança com o scroll, como a régua de uma timeline.
- **Seções numeradas como composições** (`COMP 01 — WORK`), com marcadores em losango (keyframes).
- **Abertura em forma de fila de render**: frames contando até 100%, depois a cortina abre.
- **Monograma KF em cromo**, renderizado no Blender (Cycles) e controlado pelo scroll frame a frame. É a peça que o site de referência não tem: CGI de verdade.
- **Tipografia variável que estica** (Archivo, eixo de largura): o nome entra condensado e expande, como um keyframe de escala no After Effects.

Paleta: preto quase puro (`#0a0a0b`), branco frio (`#eceef0`), cinzas neutros e um único violeta de sinal (`#8b5cf6`, era laranja `#ff5a1f` até 20/10/2026), a cor do "REC" e do playhead. Fontes: Archivo (display, variável) e JetBrains Mono (já usada no site antigo, mantém continuidade).

## Seções

1. **Render queue** (abertura, ~1,6 s, uma vez por sessão; qualquer tecla ou clique pula).
2. **Hero**: "KAIO FELIPE" gigante, monograma CGI atrás, timecode, frase curta e botão para entrar.
3. **Manifesto pinado**: quatro palavras, uma por tela — TREINA / REPETE / REFINA / ENTREGA — a ideia que já estava no "Sobre" do site antigo (do Jiu-Jitsu: consistência supera talento). Cada palavra entra e sai com uma transição diferente (estica, racha, aberração cromática, a câmera atravessa).
4. **Work**: projetos como clipes de uma timeline, cada um com ponto de entrada, tags e link.
5. **Sobre**: foto, texto e fatos (IFSC, inglês C1, alemão, Jiu-Jitsu faixa azul, 3º lugar na OBA).
6. **Stack**: em formato de painel de efeitos.
7. **Trajetória**: formação e experiência.
8. **Contato**: frase gigante, formulário EmailJS (mesmas chaves do site antigo), e-mail, LinkedIn, GitHub e CV no idioma ativo.

Idiomas: PT (padrão), EN e DE, com detecção pelo navegador e escolha salva, como no site antigo.

## Leveza

- O impacto vem de HTML, CSS e GSAP. Nada de Three.js: o CGI é uma sequência de imagens WebP pré-renderizada, desenhada num `<canvas>` 2D. A GPU do visitante quase não trabalha.
- A sequência CGI carrega depois da primeira tela e só se o aparelho e a conexão aguentam; caso contrário fica um único frame estático.
- `prefers-reduced-motion`: sem abertura, sem scroll suave, sem pin; todo o conteúdo continua lá.
- Sons de interface são sintetizados por código (sem arquivos), desligados por padrão.

## Stack

- Next.js (App Router) com `output: "export"`, em `site/`.
- Tailwind CSS 4, GSAP + ScrollTrigger, Lenis.
- Dois componentes do Spell UI (MIT): `TiltCard` e `Marquee`.
- `@emailjs/browser` para o formulário.

## Estrutura do repositório

As ferramentas (`ferramentas/`), o produto (`produtos/`), o painel (`painel/`), `privacidade.html`, `robots.txt`, `sitemap.xml` e os CVs continuam na raiz, sem mudança de URL. O app novo mora em `site/`.

O deploy (`.github/workflows/pages.yml`) compila `site/`, copia os arquivos estáticos da raiz para dentro da saída e publica tudo no GitHub Pages. O workflow antigo do Jekyll sai.

Os arquivos do site antigo (`index.html`, `style.css`, `styles.css`, `script.js`, `translations.js`) saem do repositório; o histórico do git guarda tudo.

## CGI

Script Blender em `site/cgi/kf_monogram.py`, no mesmo padrão do `Motion-sfx-ae/tools/blender`: Cycles na GPU, fundo transparente, cartões de luz para o cromo ter o que refletir. Saída em PNG, convertida para WebP com ffmpeg em `site/public/cgi/`.

## Decisões que o Kaio deve conferir

- Lista de projetos: entraram só os que já são públicos ou já estavam no site antigo. Projetos privados (Motion-sfx-ae, Orion/MANTO, trading, compressbase) não aparecem com nome; o trabalho de motion aparece de forma genérica, sem citar clientes.
- Stack: inclui o que aparece nos repositórios (TypeScript, React, Next.js, GSAP, Blender, HyperFrames, ffmpeg). Remover o que não quiser assumir.
- Telefone: mantido no contato, como no site antigo.
- Textos novos (manifesto, frases do hero) em PT/EN/DE: revisar o tom.

## Próximas fases (fora deste branch)

- Tornar públicos dois ou três projetos fortes e ganhar uma seção "Open source" com números do GitHub atualizados por workflow.
- README de perfil (`KaioHomem/KaioHomem`, hoje privado) apontando para o site.
- Uma vinheta em vídeo (HyperFrames) para redes sociais, feita com o mesmo monograma.
