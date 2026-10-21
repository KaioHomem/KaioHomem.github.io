// Every visible string on the page, in the three languages the old site already had.
// Facts (dates, places, results) come from the previous version of the site.

export type Lang = "pt" | "en" | "de";
export const LANGS: Lang[] = ["pt", "en", "de"];

export type Project = {
  id: string;
  title: string;
  kind: string;
  year: string;
  desc: string;
  tags: string[];
  href?: string;
  linkLabel?: string;
  image: string;
  imageAlt: string;
};

const projects = {
  pt: [
    {
      id: "ferramentas",
      title: "Ferramentas BR",
      kind: "Calculadoras trabalhistas",
      year: "2026",
      desc: "Onze calculadoras (salário líquido, rescisão, férias, 13º, CLT vs PJ, financiamento…) com as tabelas fiscais de 2026. Motor de cálculo puro, coberto por testes que rodam no CI a cada mudança, e uma revisão mensal automática das tabelas.",
      tags: ["JavaScript", "Testes", "GitHub Actions", "SEO"],
      href: "/ferramentas/",
      linkLabel: "Abrir as calculadoras",
      image: "/img/ferramentas-preview.svg",
      imageAlt: "Prévia do hub de calculadoras do Ferramentas BR.",
    },
    {
      id: "folha",
      title: "Folha Simples",
      kind: "Produto digital",
      year: "2026",
      desc: "Gerador de holerite e folha de pagamento que roda offline, vendido como produto. Carrega uma cópia do mesmo motor das calculadoras, e o CI confere que a cópia nunca envelhece errada.",
      tags: ["Produto", "JavaScript", "Offline"],
      href: "/produtos/folha-de-pagamento.html",
      linkLabel: "Ver o produto",
      image: "/img/tela-folha.webp",
      imageAlt: "Tela da folha de pagamento do Folha Simples.",
    },
    {
      id: "motion",
      title: "Motion & CGI",
      kind: "Vídeos para clientes",
      year: "2026",
      desc: "Vídeos no estilo After Effects: planos 3D renderizados no Blender por script (Cycles na GPU), montagem em HyperFrames e sound design em Python. O monograma do topo desta página saiu desse mesmo pipeline.",
      tags: ["Blender", "HyperFrames", "Python", "ffmpeg"],
      image: "/cgi/kf_066.webp",
      imageAlt: "Monograma KF em cromo, renderizado no Blender.",
    },
    {
      id: "guia",
      title: "Guia da Serra",
      kind: "Site acessível",
      year: "2026",
      desc: "Guia turístico de Lages e da Serra Catarinense, responsivo e acessível, em HTML, CSS e JavaScript puro. Avaliação de Desenvolvimento Web no IFSC.",
      tags: ["HTML", "CSS", "JavaScript", "Acessibilidade"],
      href: "https://kaiohomem.github.io/guia-da-serra/",
      linkLabel: "Abrir o site",
      image: "/img/guia-da-serra.webp",
      imageAlt: "Página inicial do Guia da Serra.",
    },
    {
      id: "chat",
      title: "ChatDeConversa",
      kind: "Redes · Python",
      year: "2026",
      desc: "Aplicação de chat multi-protocolo em Python, organizada em módulos (chat, FTP, IoT) com um ponto de entrada central. Projeto do curso de Ciências da Computação.",
      tags: ["Python", "Sockets", "FTP", "IoT"],
      href: "https://github.com/KaioHomem/ChatDeConversa",
      linkLabel: "Ver no GitHub",
      image: "/img/chatdeconversa-preview.png",
      imageAlt: "Prévia do ChatDeConversa.",
    },
  ],
  en: [
    {
      id: "ferramentas",
      title: "Ferramentas BR",
      kind: "Labour-law calculators",
      year: "2026",
      desc: "Eleven calculators for Brazilian payroll (net salary, severance, vacation, 13th salary, employee vs contractor, loans…) on the 2026 tax tables. A pure calculation core, covered by tests that run in CI on every change, plus an automatic monthly review of the tables.",
      tags: ["JavaScript", "Tests", "GitHub Actions", "SEO"],
      href: "/ferramentas/",
      linkLabel: "Open the calculators",
      image: "/img/ferramentas-preview.svg",
      imageAlt: "Preview of the Ferramentas BR calculator hub.",
    },
    {
      id: "folha",
      title: "Folha Simples",
      kind: "Digital product",
      year: "2026",
      desc: "A payslip and payroll generator that runs offline, sold as a product. It ships a copy of the calculators' engine, and CI checks that the copy never drifts from the original.",
      tags: ["Product", "JavaScript", "Offline"],
      href: "/produtos/folha-de-pagamento.html",
      linkLabel: "See the product",
      image: "/img/tela-folha.webp",
      imageAlt: "Payroll screen of Folha Simples.",
    },
    {
      id: "motion",
      title: "Motion & CGI",
      kind: "Client videos",
      year: "2026",
      desc: "After Effects–style videos: 3D shots rendered in Blender by script (Cycles on the GPU), edited in HyperFrames, with sound design in Python. The monogram at the top of this page came out of the same pipeline.",
      tags: ["Blender", "HyperFrames", "Python", "ffmpeg"],
      image: "/cgi/kf_066.webp",
      imageAlt: "Chrome KF monogram rendered in Blender.",
    },
    {
      id: "guia",
      title: "Guia da Serra",
      kind: "Accessible website",
      year: "2026",
      desc: "A responsive, accessible travel guide to Lages and the Santa Catarina highlands, in plain HTML, CSS and JavaScript. Web Development assignment at IFSC.",
      tags: ["HTML", "CSS", "JavaScript", "Accessibility"],
      href: "https://kaiohomem.github.io/guia-da-serra/",
      linkLabel: "Open the site",
      image: "/img/guia-da-serra.webp",
      imageAlt: "Home page of Guia da Serra.",
    },
    {
      id: "chat",
      title: "ChatDeConversa",
      kind: "Networking · Python",
      year: "2026",
      desc: "A multi-protocol chat application in Python, organised in modules (chat, FTP, IoT) with one central entry point. Computer Science course project.",
      tags: ["Python", "Sockets", "FTP", "IoT"],
      href: "https://github.com/KaioHomem/ChatDeConversa",
      linkLabel: "View on GitHub",
      image: "/img/chatdeconversa-preview.png",
      imageAlt: "Preview of ChatDeConversa.",
    },
  ],
  de: [
    {
      id: "ferramentas",
      title: "Ferramentas BR",
      kind: "Arbeitsrecht-Rechner",
      year: "2026",
      desc: "Elf Rechner für die brasilianische Lohnabrechnung (Nettogehalt, Abfindung, Urlaub, 13. Gehalt, Angestellt vs. Selbstständig, Finanzierung …) mit den Steuertabellen 2026. Ein reiner Rechenkern, abgesichert durch Tests, die bei jeder Änderung in der CI laufen, und eine automatische monatliche Prüfung der Tabellen.",
      tags: ["JavaScript", "Tests", "GitHub Actions", "SEO"],
      href: "/ferramentas/",
      linkLabel: "Rechner öffnen",
      image: "/img/ferramentas-preview.svg",
      imageAlt: "Vorschau der Rechner-Übersicht von Ferramentas BR.",
    },
    {
      id: "folha",
      title: "Folha Simples",
      kind: "Digitales Produkt",
      year: "2026",
      desc: "Ein Generator für Lohnzettel und Lohnabrechnung, der offline läuft und als Produkt verkauft wird. Er enthält eine Kopie des Rechenkerns, und die CI prüft, dass die Kopie nie vom Original abweicht.",
      tags: ["Produkt", "JavaScript", "Offline"],
      href: "/produtos/folha-de-pagamento.html",
      linkLabel: "Produkt ansehen",
      image: "/img/tela-folha.webp",
      imageAlt: "Lohnabrechnungsansicht von Folha Simples.",
    },
    {
      id: "motion",
      title: "Motion & CGI",
      kind: "Videos für Kunden",
      year: "2026",
      desc: "Videos im After-Effects-Stil: 3D-Einstellungen per Skript in Blender gerendert (Cycles auf der GPU), in HyperFrames geschnitten, Sounddesign in Python. Das Monogramm oben auf dieser Seite stammt aus derselben Pipeline.",
      tags: ["Blender", "HyperFrames", "Python", "ffmpeg"],
      image: "/cgi/kf_066.webp",
      imageAlt: "In Blender gerendertes KF-Monogramm aus Chrom.",
    },
    {
      id: "guia",
      title: "Guia da Serra",
      kind: "Barrierearme Website",
      year: "2026",
      desc: "Ein responsiver, barrierearmer Reiseführer für Lages und das Hochland von Santa Catarina, in reinem HTML, CSS und JavaScript. Prüfungsprojekt in Webentwicklung am IFSC.",
      tags: ["HTML", "CSS", "JavaScript", "Barrierefreiheit"],
      href: "https://kaiohomem.github.io/guia-da-serra/",
      linkLabel: "Website öffnen",
      image: "/img/guia-da-serra.webp",
      imageAlt: "Startseite von Guia da Serra.",
    },
    {
      id: "chat",
      title: "ChatDeConversa",
      kind: "Netzwerke · Python",
      year: "2026",
      desc: "Eine Multi-Protokoll-Chat-Anwendung in Python, in Module gegliedert (Chat, FTP, IoT) mit einem zentralen Einstiegspunkt. Projekt aus dem Informatikstudium.",
      tags: ["Python", "Sockets", "FTP", "IoT"],
      href: "https://github.com/KaioHomem/ChatDeConversa",
      linkLabel: "Auf GitHub ansehen",
      image: "/img/chatdeconversa-preview.png",
      imageAlt: "Vorschau von ChatDeConversa.",
    },
  ],
} satisfies Record<Lang, Project[]>;

export const content = {
  pt: {
    htmlLang: "pt-BR",
    cv: "/cv-kaio-felipe.pdf",
    nav: { work: "Trabalhos", about: "Sobre", journey: "Trajetória", contact: "Contato", soundOn: "Som on", soundOff: "Som off", skip: "Pular para o conteúdo" },
    intro: { title: "KAIO_FELIPE.comp", steps: ["Carregando composição", "Renderizando frames", "Aplicando motion blur", "Pronto"], done: "Render concluído" },
    hero: {
      status: "Disponível para estágio & primeiro emprego",
      place: "Brasil",
      edition: "Portfólio · 2026",
      lead: "Dev, motion e CGI.",
      sub: "Construo sites, ferramentas e vídeos que funcionam de verdade, e capricho em cada frame.",
      side: "Ciências da Computação no IFSC. Código de dia, Blender de noite.",
      cta: "Dar play",
    },
    manifesto: {
      label: "Método · do tatame pro código",
      a11y: "Como eu trabalho: treina, repete, refina, entrega.",
      words: [
        { word: "Treina", line: "Todo dia, mesmo sem vontade." },
        { word: "Repete", line: "Até o movimento sair sem pensar." },
        { word: "Refina", line: "Cada detalhe, frame a frame." },
        { word: "Entrega", line: "Coisa que funciona, no ar." },
      ],
    },
    work: { comp: "COMP 02", label: "Trabalhos", title: ["Trabalho", "selecionado"], private: "Trabalho para clientes · privado", more: "Mais no GitHub" },
    about: {
      comp: "COMP 03",
      label: "Sobre",
      title: "Eu sou o Kaio.",
      paragraphs: [
        "Tenho 19 anos e curso Ciências da Computação no IFSC. Quero entender como as coisas funcionam de verdade, não só copiar e colar uma solução.",
        "Falo inglês em nível C1, fruto de dez anos de estudo, e aprendo alemão por conta própria. Leio documentação, converso com gente de fora e acompanho tudo em inglês sem esforço.",
        "Fora do teclado sou faixa azul de Jiu-Jitsu e treino musculação. O tatame me ensinou que consistência supera talento, e é assim que eu estudo e trabalho.",
      ],
      facts: [
        { k: "Formação", v: "Ciências da Computação — IFSC, 4ª fase" },
        { k: "Idiomas", v: "Português nativo · Inglês C1 · Alemão básico" },
        { k: "Prêmio", v: "3º lugar — Olimpíada Brasileira de Astronomia" },
        { k: "Tatame", v: "Faixa azul de Jiu-Jitsu" },
      ],
    },
    stack: {
      comp: "COMP 04",
      label: "Stack",
      title: "Painel de efeitos",
      groups: [
        { name: "Linguagens", items: ["Java", "Python", "JavaScript", "TypeScript", "HTML", "CSS", "SQL", "Assembly"] },
        { name: "Web", items: ["React", "Next.js", "Node.js", "GSAP", "Tailwind", "Bootstrap"] },
        { name: "Motion & 3D", items: ["Blender", "HyperFrames", "ffmpeg", "Three.js"] },
        { name: "Ferramentas", items: ["Git", "GitHub Actions", "Playwright", "MySQL", "VS Code", "IntelliJ"] },
      ],
    },
    journey: {
      comp: "COMP 05",
      label: "Trajetória",
      title: "Linha do tempo",
      items: [
        { when: "2025 — agora", what: "Ciências da Computação", where: "IFSC — Instituto Federal de Santa Catarina", desc: "Programação, lógica, estruturas de dados, banco de dados e sistemas operacionais." },
        { when: "2023 — 2024", what: "Suporte Operacional", where: "Gihdak", desc: "Gestão de estoque, organização operacional, suporte administrativo e acompanhamento de processos internos." },
        { when: "2022 — 2023", what: "Suporte Administrativo", where: "Espaço Dani K", desc: "Rotinas administrativas, fiscais e financeiras, organização de documentos e apoio à operação." },
      ],
    },
    contact: {
      comp: "COMP 06",
      label: "Contato",
      big: ["Bora", "construir", "algo?"],
      sub: "Procuro minha primeira oportunidade em tecnologia. Tem uma vaga, um projeto ou só quer trocar ideia? Manda mensagem.",
      cv: "Baixar CV (PDF)",
      form: { name: "Nome", namePh: "Seu nome", email: "E-mail", emailPh: "seu@email.com", msg: "Mensagem", msgPh: "Olá Kaio…", send: "Enviar mensagem", sending: "Enviando…", ok: "Mensagem enviada. Respondo logo.", err: "Não foi. Tenta de novo ou me chama direto no e-mail.", invalid: "Preencha nome, um e-mail válido e a mensagem." },
    },
    footer: { built: "Next.js, GSAP e um monograma renderizado no Blender.", source: "Código deste site", privacy: "Privacidade", tools: "Calculadoras", top: "Voltar ao topo" },
    notFound: { title: "Frame perdido", text: "Essa página não está na timeline.", back: "Voltar ao início" },
  },
  en: {
    htmlLang: "en",
    cv: "/cv-kaio-felipe-en.pdf",
    nav: { work: "Work", about: "About", journey: "Journey", contact: "Contact", soundOn: "Sound on", soundOff: "Sound off", skip: "Skip to content" },
    intro: { title: "KAIO_FELIPE.comp", steps: ["Loading composition", "Rendering frames", "Applying motion blur", "Ready"], done: "Render complete" },
    hero: {
      status: "Open to internships & a first job",
      place: "Brazil",
      edition: "Portfolio · 2026",
      lead: "Dev, motion and CGI.",
      sub: "I build websites, tools and videos that actually work, and I care about every frame.",
      side: "Computer Science at IFSC. Code by day, Blender by night.",
      cta: "Press play",
    },
    manifesto: {
      label: "Method · from the mat to the code",
      a11y: "How I work: train, repeat, refine, ship.",
      words: [
        { word: "Train", line: "Every day, especially when I don't feel like it." },
        { word: "Repeat", line: "Until the move comes without thinking." },
        { word: "Refine", line: "Every detail, frame by frame." },
        { word: "Ship", line: "Something that works, live." },
      ],
    },
    work: { comp: "COMP 02", label: "Work", title: ["Selected", "work"], private: "Client work · private", more: "More on GitHub" },
    about: {
      comp: "COMP 03",
      label: "About",
      title: "I'm Kaio.",
      paragraphs: [
        "I'm 19 and study Computer Science at IFSC. I want to understand how things really work, not just copy and paste a solution.",
        "I speak English at C1 level, the result of ten years of study, and I'm teaching myself German. I read documentation, talk with people abroad and follow everything in English with ease.",
        "Away from the keyboard I'm a Jiu-Jitsu blue belt and I lift. The mat taught me that consistency beats talent, and that's how I study and work.",
      ],
      facts: [
        { k: "Education", v: "Computer Science — IFSC, 4th semester" },
        { k: "Languages", v: "Portuguese native · English C1 · Basic German" },
        { k: "Award", v: "3rd place — Brazilian Astronomy Olympiad" },
        { k: "Mat", v: "Jiu-Jitsu blue belt" },
      ],
    },
    stack: {
      comp: "COMP 04",
      label: "Stack",
      title: "Effects panel",
      groups: [
        { name: "Languages", items: ["Java", "Python", "JavaScript", "TypeScript", "HTML", "CSS", "SQL", "Assembly"] },
        { name: "Web", items: ["React", "Next.js", "Node.js", "GSAP", "Tailwind", "Bootstrap"] },
        { name: "Motion & 3D", items: ["Blender", "HyperFrames", "ffmpeg", "Three.js"] },
        { name: "Tools", items: ["Git", "GitHub Actions", "Playwright", "MySQL", "VS Code", "IntelliJ"] },
      ],
    },
    journey: {
      comp: "COMP 05",
      label: "Journey",
      title: "Timeline",
      items: [
        { when: "2025 — now", what: "Computer Science", where: "IFSC — Federal Institute of Santa Catarina", desc: "Programming, logic, data structures, databases and operating systems." },
        { when: "2023 — 2024", what: "Operations Support", where: "Gihdak", desc: "Inventory management, operational organisation, administrative support and internal process tracking." },
        { when: "2022 — 2023", what: "Administrative Support", where: "Espaço Dani K", desc: "Administrative, tax and financial routines, document organisation and day-to-day support." },
      ],
    },
    contact: {
      comp: "COMP 06",
      label: "Contact",
      big: ["Let's", "build", "something."],
      sub: "I'm looking for my first opportunity in tech. Have a position, a project, or just want to talk? Send me a message.",
      cv: "Download CV (PDF)",
      form: { name: "Name", namePh: "Your name", email: "Email", emailPh: "you@email.com", msg: "Message", msgPh: "Hi Kaio…", send: "Send message", sending: "Sending…", ok: "Message sent. I'll reply soon.", err: "That didn't go through. Try again or email me directly.", invalid: "Please fill in your name, a valid email and a message." },
    },
    footer: { built: "Next.js, GSAP and a monogram rendered in Blender.", source: "Source of this site", privacy: "Privacy", tools: "Calculators", top: "Back to top" },
    notFound: { title: "Lost frame", text: "This page isn't on the timeline.", back: "Back to start" },
  },
  de: {
    htmlLang: "de",
    cv: "/cv-kaio-felipe-de.pdf",
    nav: { work: "Arbeiten", about: "Über mich", journey: "Werdegang", contact: "Kontakt", soundOn: "Ton an", soundOff: "Ton aus", skip: "Zum Inhalt springen" },
    intro: { title: "KAIO_FELIPE.comp", steps: ["Komposition wird geladen", "Frames werden gerendert", "Bewegungsunschärfe", "Bereit"], done: "Rendern abgeschlossen" },
    hero: {
      status: "Offen für Praktikum & Einstiegsstelle",
      place: "Brasilien",
      edition: "Portfolio · 2026",
      lead: "Dev, Motion und CGI.",
      sub: "Ich baue Websites, Tools und Videos, die wirklich funktionieren – mit Liebe zu jedem Frame.",
      side: "Informatik am IFSC. Tagsüber Code, nachts Blender.",
      cta: "Abspielen",
    },
    manifesto: {
      label: "Methode · von der Matte zum Code",
      a11y: "Wie ich arbeite: üben, wiederholen, verfeinern, liefern.",
      words: [
        { word: "Üben", line: "Jeden Tag, auch ohne Lust." },
        { word: "Wiederholen", line: "Bis die Bewegung von allein kommt." },
        { word: "Verfeinern", line: "Jedes Detail, Frame für Frame." },
        { word: "Liefern", line: "Etwas, das funktioniert – live." },
      ],
    },
    work: { comp: "COMP 02", label: "Arbeiten", title: ["Ausgewählte", "Arbeiten"], private: "Kundenarbeit · privat", more: "Mehr auf GitHub" },
    about: {
      comp: "COMP 03",
      label: "Über mich",
      title: "Ich bin Kaio.",
      paragraphs: [
        "Ich bin 19 und studiere Informatik am IFSC. Ich will verstehen, wie Dinge wirklich funktionieren, statt nur eine Lösung zu kopieren.",
        "Ich spreche Englisch auf C1-Niveau, das Ergebnis von zehn Jahren Lernen, und bringe mir selbst Deutsch bei. Dokumentation, Gespräche mit Leuten aus dem Ausland, Inhalte auf Englisch – alles kein Problem.",
        "Abseits der Tastatur bin ich Blaugurt im Jiu-Jitsu und trainiere im Fitnessstudio. Die Matte hat mir beigebracht, dass Konsequenz Talent schlägt – so lerne und arbeite ich.",
      ],
      facts: [
        { k: "Studium", v: "Informatik — IFSC, 4. Semester" },
        { k: "Sprachen", v: "Portugiesisch Muttersprache · Englisch C1 · Deutsch Grundkenntnisse" },
        { k: "Auszeichnung", v: "3. Platz — Brasilianische Astronomie-Olympiade" },
        { k: "Matte", v: "Blaugurt im Jiu-Jitsu" },
      ],
    },
    stack: {
      comp: "COMP 04",
      label: "Stack",
      title: "Effekte-Panel",
      groups: [
        { name: "Sprachen", items: ["Java", "Python", "JavaScript", "TypeScript", "HTML", "CSS", "SQL", "Assembly"] },
        { name: "Web", items: ["React", "Next.js", "Node.js", "GSAP", "Tailwind", "Bootstrap"] },
        { name: "Motion & 3D", items: ["Blender", "HyperFrames", "ffmpeg", "Three.js"] },
        { name: "Werkzeuge", items: ["Git", "GitHub Actions", "Playwright", "MySQL", "VS Code", "IntelliJ"] },
      ],
    },
    journey: {
      comp: "COMP 05",
      label: "Werdegang",
      title: "Zeitleiste",
      items: [
        { when: "2025 — heute", what: "Informatik", where: "IFSC — Bundesinstitut Santa Catarina", desc: "Programmierung, Logik, Datenstrukturen, Datenbanken und Betriebssysteme." },
        { when: "2023 — 2024", what: "Betriebliche Unterstützung", where: "Gihdak", desc: "Lagerverwaltung, betriebliche Organisation, Verwaltungsunterstützung und interne Prozesse." },
        { when: "2022 — 2023", what: "Verwaltungsassistenz", where: "Espaço Dani K", desc: "Verwaltung, Steuern und Finanzen, Dokumentenorganisation und Unterstützung im Tagesgeschäft." },
      ],
    },
    contact: {
      comp: "COMP 06",
      label: "Kontakt",
      big: ["Lass uns", "was", "bauen."],
      sub: "Ich suche meine erste Stelle in der Tech-Branche. Eine Stelle, ein Projekt oder einfach Lust auf ein Gespräch? Schreib mir.",
      cv: "Lebenslauf (PDF)",
      form: { name: "Name", namePh: "Dein Name", email: "E-Mail", emailPh: "du@email.com", msg: "Nachricht", msgPh: "Hallo Kaio …", send: "Nachricht senden", sending: "Wird gesendet …", ok: "Nachricht gesendet. Ich melde mich bald.", err: "Das hat nicht geklappt. Versuch es nochmal oder schreib mir direkt.", invalid: "Bitte Name, eine gültige E-Mail und eine Nachricht angeben." },
    },
    footer: { built: "Next.js, GSAP und ein in Blender gerendertes Monogramm.", source: "Quellcode dieser Seite", privacy: "Datenschutz", tools: "Rechner", top: "Nach oben" },
    notFound: { title: "Verlorener Frame", text: "Diese Seite ist nicht auf der Zeitleiste.", back: "Zum Anfang" },
  },
};

export type Dict = (typeof content)["pt"];

export const contactInfo = {
  email: "kaiokateto@gmail.com",
  phone: "+55 49 99136-5411",
  phoneHref: "tel:+5549991365411",
  linkedin: "https://www.linkedin.com/in/kaio-homem/",
  github: "https://github.com/KaioHomem",
  repo: "https://github.com/KaioHomem/KaioHomem.github.io",
};

export const emailjsConfig = {
  publicKey: "P9ostrZVqVC9oI3Q1",
  serviceId: "service_wgl6b44",
  templateId: "template_3p626pb",
};

export function getContent(lang: Lang) {
  return { ...content[lang], projects: projects[lang] };
}
