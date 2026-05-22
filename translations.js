/**
 * i18n — Auto language detection
 * Detects browser language (PT / EN / DE) and applies translations.
 * No geolocation. No user input needed.
 */
(function () {

  /* ── Language detection ─────────────────────────────── */
  const raw  = (navigator.language || 'pt').toLowerCase();
  const lang = raw.startsWith('de') ? 'de' : raw.startsWith('en') ? 'en' : 'pt';

  window.__lang = lang; // expose to script.js

  document.documentElement.lang =
    lang === 'pt' ? 'pt-BR' : lang === 'de' ? 'de' : 'en';

  /* ── Translation dictionary ─────────────────────────── */
  const T = {

    /* ====== PORTUGUÊS ====== */
    pt: {
      cv_file:          'cv-kaio-felipe.pdf',

      nav_about:        'Sobre',
      nav_stack:        'Stack',
      nav_projects:     'Projetos',
      nav_experience:   'Experiência',
      nav_contact:      'Contato',

      hero_badge:       'Disponível para estágio & primeiro emprego',
      hero_role:        '<span class="mono">dev</span> — Estudante de Ciências da Computação',
      hero_desc:        'Desenvolvedor web em formação no IFSC. Inglês C1, disciplinado e movido por aprendizado real. Construo coisas que funcionam e quero crescer junto com uma equipe.',
      hero_cta:         'Entre em contato',
      hero_cv_btn:      'Download CV',
      hero_code:        `<span class="kw">const</span> <span class="fn">dev</span> = {\n  nome: <span class="str">"Kaio Felipe"</span>,\n  formação: <span class="str">"CC — IFSC"</span>,\n  idiomas: [<span class="str">"Português"</span>, <span class="str">"English C1"</span>],\n  stack: [<span class="str">"Java"</span>, <span class="str">"HTML/CSS/JS"</span>, <span class="str">"Python"</span>],\n  status: <span class="str">"buscando oportunidade"</span>,\n  objetivo: <span class="str">"evoluir com propósito"</span>\n};`,

      about_label:      'Sobre mim',
      about_title:      'Quem sou eu',
      about_p1:         'Tenho 19 anos e curso <strong>Ciências da Computação no IFSC</strong> — uma das instituições técnicas mais respeitadas do sul do Brasil. Sou movido pela vontade de entender como as coisas funcionam de verdade, não apenas copiar e colar soluções.',
      about_p2:         'Falo e escrevo <strong>inglês em nível avançado (C1)</strong>, resultado de dez anos de estudo dedicado. Consigo ler documentação técnica, participar de conversas profissionais e acompanhar conteúdo em inglês sem dificuldade. Atualmente estudo alemão de forma autônoma.',
      about_p3:         'Fora do teclado, sou <strong>faixa azul de Jiu-Jitsu</strong> e pratico musculação regularmente. Essas práticas me ensinaram que consistência supera talento — e levo esse princípio para os estudos e para o trabalho.',
      fact1_title:      'Ciências da Computação',
      fact1_sub:        'IFSC — 2024–presente · 3ª fase',
      fact2_title:      'Inglês C1 · Alemão básico',
      fact2_sub:        'Comunicação técnica e profissional',
      fact3_sub:        'Olimpíada Brasileira de Astronomia e Astronáutica',

      stack_label:      'Tecnologias',
      stack_title:      'Stack & Ferramentas',
      stack_subtitle:   'Tecnologias que estudei e utilizei em projetos reais. Sigo aprendendo constantemente.',
      stack_languages:  'Linguagens',
      stack_frameworks: 'Frameworks & Libs',
      stack_tools:      'Ferramentas',
      stack_idiomas:    'Idiomas',
      tag_en:           'Inglês — C1',
      tag_de:           'Alemão — básico',
      tag_pt:           'Português — nativo',

      proj_label:       'Projetos',
      proj_title:       'O que construí',
      proj1_title:      'Portfólio Pessoal',
      proj1_desc:       'Site pessoal desenvolvido do zero, sem frameworks. Inclui formulário de contato com EmailJS, animações com IntersectionObserver e design responsivo.',
      proj2_desc:       'Aplicação de chat multi-protocolo desenvolvida em Python. Organizada em módulos (chat, FTP, IoT) com ponto de entrada central. Projeto do IFSC — Ciências da Computação.',
      proj_more:        'Mais projetos em desenvolvimento.',
      proj_github_btn:  'Ver GitHub',

      exp_label:        'Experiência',
      exp_title:        'Trajetória',
      exp1_title:       'Ciências da Computação',
      exp1_date:        '2024 — presente · 3ª fase',
      exp1_company:     'IFSC — Instituto Federal de Santa Catarina',
      exp1_desc:        'Formação técnica em programação, lógica computacional, estruturas de dados, banco de dados e sistemas operacionais.',
      exp2_title:       'Suporte Operacional',
      exp2_desc:        'Gerenciamento de estoque, organização operacional, suporte administrativo e acompanhamento de processos internos.',
      exp3_title:       'Suporte Administrativo',
      exp3_company:     'Espaço Dani K',
      exp3_desc:        'Auxílio nas áreas administrativa, fiscal e financeira. Organização de documentos e suporte às operações do negócio.',

      contact_label:    'Contato',
      contact_title:    'Vamos conversar',
      contact_subtitle: 'Estou buscando minha primeira oportunidade em tecnologia. Se tiver uma vaga, um projeto ou só quiser trocar uma ideia — me manda uma mensagem.',
      contact_cv:       'Download CV (PDF)',
      form_name_lbl:    'Nome',
      form_name_ph:     'Seu nome',
      form_email_lbl:   'E-mail',
      form_email_ph:    'seu@email.com',
      form_msg_lbl:     'Mensagem',
      form_msg_ph:      'Olá Kaio...',
      form_submit:      'Enviar mensagem',
      form_sending:     'Enviando...',
      form_success:     '✓ Mensagem enviada com sucesso!',
      form_error:       'Erro ao enviar. Tente novamente ou me contate diretamente.',
      val_name:         'Nome é obrigatório.',
      val_email:        'Digite um e-mail válido.',
      val_msg:          'Mensagem é obrigatória.',

      footer_built:     'Desenvolvido com HTML, CSS & JavaScript',
    },

    /* ====== ENGLISH ====== */
    en: {
      cv_file:          'cv-kaio-felipe-en.pdf',

      nav_about:        'About',
      nav_stack:        'Stack',
      nav_projects:     'Projects',
      nav_experience:   'Experience',
      nav_contact:      'Contact',

      hero_badge:       'Available for internship & first job',
      hero_role:        '<span class="mono">dev</span> — Computer Science Student',
      hero_desc:        'Web developer in training at IFSC. C1 English, disciplined and driven by real learning. I build things that work and want to grow alongside a team.',
      hero_cta:         'Get in touch',
      hero_cv_btn:      'Download CV',
      hero_code:        `<span class="kw">const</span> <span class="fn">dev</span> = {\n  name: <span class="str">"Kaio Felipe"</span>,\n  education: <span class="str">"CS — IFSC"</span>,\n  languages: [<span class="str">"Portuguese"</span>, <span class="str">"English C1"</span>],\n  stack: [<span class="str">"Java"</span>, <span class="str">"HTML/CSS/JS"</span>, <span class="str">"Python"</span>],\n  status: <span class="str">"seeking opportunity"</span>,\n  goal: <span class="str">"grow with purpose"</span>\n};`,

      about_label:      'About me',
      about_title:      'Who I am',
      about_p1:         'I\'m 19 and studying <strong>Computer Science at IFSC</strong> — one of the most respected technical institutions in southern Brazil. I\'m driven by the desire to truly understand how things work, not just copy-paste solutions.',
      about_p2:         'I speak and write <strong>advanced English (C1)</strong>, the result of ten years of dedicated study. I can read technical documentation, participate in professional conversations, and follow English-language content with ease. I\'m currently learning German on my own.',
      about_p3:         'Away from the keyboard, I\'m a <strong>blue belt in Jiu-Jitsu</strong> and train at the gym regularly. These practices taught me that consistency beats talent — and I carry that principle into my studies and work.',
      fact1_title:      'Computer Science',
      fact1_sub:        'IFSC — 2024–present · 3rd semester',
      fact2_title:      'English C1 · Basic German',
      fact2_sub:        'Technical and professional communication',
      fact3_sub:        'Brazilian Olympiad of Astronomy & Astronautics',

      stack_label:      'Technologies',
      stack_title:      'Stack & Tools',
      stack_subtitle:   'Technologies I\'ve studied and used in real projects. Constantly learning more.',
      stack_languages:  'Languages',
      stack_frameworks: 'Frameworks & Libs',
      stack_tools:      'Tools',
      stack_idiomas:    'Languages',
      tag_en:           'English — C1',
      tag_de:           'German — basic',
      tag_pt:           'Portuguese — native',

      proj_label:       'Projects',
      proj_title:       'What I\'ve built',
      proj1_title:      'Personal Portfolio',
      proj1_desc:       'Personal website built from scratch, no frameworks. Includes a contact form with EmailJS, animations with IntersectionObserver and responsive design.',
      proj2_desc:       'Multi-protocol chat application built in Python. Organized in modules (chat, FTP, IoT) with a central entry point. IFSC — Computer Science project.',
      proj_more:        'More projects in development.',
      proj_github_btn:  'View GitHub',

      exp_label:        'Experience',
      exp_title:        'Career Path',
      exp1_title:       'Computer Science',
      exp1_date:        '2024 — present · 3rd semester',
      exp1_company:     'IFSC — Federal Institute of Santa Catarina',
      exp1_desc:        'Technical training in programming, computational logic, data structures, databases and operating systems.',
      exp2_title:       'Operations Support',
      exp2_desc:        'Inventory management, operational organization, administrative support and internal process tracking.',
      exp3_title:       'Administrative Support',
      exp3_company:     'Espaço Dani K',
      exp3_desc:        'Assistance in administrative, tax and financial areas. Document organization and general business support.',

      contact_label:    'Contact',
      contact_title:    'Let\'s talk',
      contact_subtitle: 'I\'m looking for my first opportunity in tech. If you have a position, a project, or just want to chat — send me a message.',
      contact_cv:       'Download CV (PDF)',
      form_name_lbl:    'Name',
      form_name_ph:     'Your name',
      form_email_lbl:   'Email',
      form_email_ph:    'your@email.com',
      form_msg_lbl:     'Message',
      form_msg_ph:      'Hello Kaio...',
      form_submit:      'Send message',
      form_sending:     'Sending...',
      form_success:     '✓ Message sent successfully!',
      form_error:       'Error sending. Please try again or contact me directly.',
      val_name:         'Name is required.',
      val_email:        'Enter a valid email address.',
      val_msg:          'Message is required.',

      footer_built:     'Built with HTML, CSS & JavaScript',
    },

    /* ====== DEUTSCH ====== */
    de: {
      cv_file:          'cv-kaio-felipe-de.pdf',

      nav_about:        'Über mich',
      nav_stack:        'Stack',
      nav_projects:     'Projekte',
      nav_experience:   'Erfahrung',
      nav_contact:      'Kontakt',

      hero_badge:       'Verfügbar für Praktikum & Einstiegsstelle',
      hero_role:        '<span class="mono">dev</span> — Informatik-Student',
      hero_desc:        'Webentwickler in Ausbildung am IFSC. Englisch C1, diszipliniert und angetrieben durch echtes Lernen. Ich baue Dinge, die funktionieren, und möchte in einem Team wachsen.',
      hero_cta:         'Kontakt aufnehmen',
      hero_cv_btn:      'CV herunterladen',
      hero_code:        `<span class="kw">const</span> <span class="fn">dev</span> = {\n  name: <span class="str">"Kaio Felipe"</span>,\n  ausbildung: <span class="str">"Informatik — IFSC"</span>,\n  sprachen: [<span class="str">"Portugiesisch"</span>, <span class="str">"Englisch C1"</span>],\n  stack: [<span class="str">"Java"</span>, <span class="str">"HTML/CSS/JS"</span>, <span class="str">"Python"</span>],\n  status: <span class="str">"suche Stelle"</span>,\n  ziel: <span class="str">"mit Zweck wachsen"</span>\n};`,

      about_label:      'Über mich',
      about_title:      'Wer bin ich',
      about_p1:         'Ich bin 19 Jahre alt und studiere <strong>Informatik am IFSC</strong> — einer der angesehensten technischen Hochschulen Südbrasiliens. Mich treibt der Wunsch an, wirklich zu verstehen, wie Dinge funktionieren – nicht nur Lösungen zu kopieren.',
      about_p2:         'Ich spreche und schreibe <strong>Englisch auf fortgeschrittenem Niveau (C1)</strong> – das Ergebnis von zehn Jahren engagiertem Studium. Außerdem lerne ich derzeit selbstständig Deutsch.',
      about_p3:         'Abseits der Tastatur bin ich <strong>Jiu-Jitsu Blaugurt</strong> und trainiere regelmäßig im Fitnessstudio. Diese Praktiken haben mir gelehrt, dass Konsequenz Talent übertrifft — dieses Prinzip nehme ich in Studium und Arbeit mit.',
      fact1_title:      'Informatik',
      fact1_sub:        'IFSC — 2024–heute · 3. Semester',
      fact2_title:      'Englisch C1 · Grundkenntnisse Deutsch',
      fact2_sub:        'Technische und professionelle Kommunikation',
      fact3_sub:        'Brasilianische Olympiade für Astronomie & Astronautik',

      stack_label:      'Technologien',
      stack_title:      'Stack & Werkzeuge',
      stack_subtitle:   'Technologien, die ich in echten Projekten studiert und verwendet habe. Ich lerne ständig dazu.',
      stack_languages:  'Programmiersprachen',
      stack_frameworks: 'Frameworks & Libs',
      stack_tools:      'Werkzeuge',
      stack_idiomas:    'Sprachen',
      tag_en:           'Englisch — C1',
      tag_de:           'Deutsch — Grundkenntnisse',
      tag_pt:           'Portugiesisch — Muttersprache',

      proj_label:       'Projekte',
      proj_title:       'Was ich gebaut habe',
      proj1_title:      'Persönliches Portfolio',
      proj1_desc:       'Persönliche Website von Grund auf ohne Frameworks gebaut. Mit Kontaktformular (EmailJS), Scroll-Animationen (IntersectionObserver) und responsivem Design.',
      proj2_desc:       'Multi-Protokoll-Chat-Anwendung in Python. Strukturiert in Module (Chat, FTP, IoT) mit zentralem Einstiegspunkt. IFSC — Informatik-Projekt.',
      proj_more:        'Weitere Projekte in Entwicklung.',
      proj_github_btn:  'GitHub ansehen',

      exp_label:        'Erfahrung',
      exp_title:        'Werdegang',
      exp1_title:       'Informatik',
      exp1_date:        '2024 — heute · 3. Semester',
      exp1_company:     'IFSC — Bundesinstitut Santa Catarina',
      exp1_desc:        'Technische Ausbildung in Programmierung, Computerlogik, Datenstrukturen, Datenbanken und Betriebssystemen.',
      exp2_title:       'Betriebliche Unterstützung',
      exp2_desc:        'Lagerverwaltung, betriebliche Organisation, Verwaltungsunterstützung und interne Prozesskontrolle.',
      exp3_title:       'Verwaltungsassistenz',
      exp3_company:     'Espaço Dani K',
      exp3_desc:        'Unterstützung in Verwaltung, Steuer- und Finanzbereich. Dokumentenorganisation und allgemeine Betriebsunterstützung.',

      contact_label:    'Kontakt',
      contact_title:    'Lass uns reden',
      contact_subtitle: 'Ich suche meine erste Stelle in der Technologiebranche. Wenn Sie eine Stelle, ein Projekt haben oder einfach chatten möchten — schreiben Sie mir.',
      contact_cv:       'CV herunterladen (PDF)',
      form_name_lbl:    'Name',
      form_name_ph:     'Ihr Name',
      form_email_lbl:   'E-Mail',
      form_email_ph:    'ihre@email.com',
      form_msg_lbl:     'Nachricht',
      form_msg_ph:      'Hallo Kaio...',
      form_submit:      'Nachricht senden',
      form_sending:     'Wird gesendet...',
      form_success:     '✓ Nachricht erfolgreich gesendet!',
      form_error:       'Fehler beim Senden. Bitte versuchen Sie es erneut oder kontaktieren Sie mich direkt.',
      val_name:         'Name ist erforderlich.',
      val_email:        'Bitte gültige E-Mail-Adresse eingeben.',
      val_msg:          'Nachricht ist erforderlich.',

      footer_built:     'Entwickelt mit HTML, CSS & JavaScript',
    }
  };

  /* ── Apply translations ─────────────────────────────── */
  const t = T[lang];
  window.__t = t; // expose to script.js for form messages

  function applyAll() {
    // Simple text
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.dataset.i18n;
      if (t[k] !== undefined) el.textContent = t[k];
    });

    // Inner HTML (elements with tags inside)
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const k = el.dataset.i18nHtml;
      if (t[k] !== undefined) el.innerHTML = t[k];
    });

    // Placeholders
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const k = el.dataset.i18nPh;
      if (t[k] !== undefined) el.placeholder = t[k];
    });

    // CV download links
    document.querySelectorAll('[data-cv-link]').forEach(el => {
      el.href = t.cv_file;
    });
  }

  // Run immediately if DOM ready, otherwise on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAll);
  } else {
    applyAll();
  }

})();
