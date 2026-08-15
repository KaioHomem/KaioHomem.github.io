/* ===================================================
   PAINEL — REGISTRY OF INTEGRATIONS

   One entry per external service the owner can connect.
   The Conexões screen is rendered entirely from here, so
   adding an integration means adding an object — not
   touching the UI.

   SECURITY MODEL — read before adding anything:

   This repository is PUBLIC. Anything committed here is
   world-readable, forever, including in git history.

   - `publico: true`  → the value is designed to be public
     (GA4 measurement id, OAuth *client* id). Safe to commit.
   - `publico: false` → secret (access tokens, client
     secrets, API keys). NEVER committed. They live only in
     the owner's own browser via localStorage, or in GitHub
     Secrets when a workflow needs them.

   `navegador: true` means the service's API can be called
   straight from the browser (CORS allowed + an auth flow
   that needs no client secret). When false, the data has
   to come through a GitHub Action instead.
   =================================================== */

window.CONEXOES = [

  {
    id: 'github',
    nome: 'GitHub',
    icone: '🐙',
    resumo: 'Saúde do site: build, testes, último deploy e tarefas de manutenção em aberto.',
    navegador: true,
    obrigatorio: false,
    jaFunciona: true,
    porQue:
      'É a única fonte que já funciona sem você configurar nada. A API pública do GitHub ' +
      'responde direto do navegador, então o painel mostra o estado do site assim que abre.',
    entrega: [
      'Se o último deploy passou ou quebrou',
      'Resultado da suíte de testes das calculadoras',
      'Issues de manutenção abertas pelos agentes',
      'Quando o site foi atualizado pela última vez'
    ],
    campos: [
      {
        chave: 'github_token',
        rotulo: 'Token de acesso (opcional)',
        publico: false,
        tipo: 'password',
        dica:
          'Sem token funciona, mas a API pública limita a 60 consultas por hora. ' +
          'Um token fine-grained só-leitura sobe para 5.000.',
        placeholder: 'github_pat_...'
      }
    ],
    passos: [
      'O painel já funciona sem nada aqui — só preencha se bater no limite de consultas.',
      'Em github.com/settings/personal-access-tokens, criar um token "fine-grained".',
      'Dar acesso apenas a este repositório, permissão Contents: Read-only.',
      'Colar acima. Fica só no seu navegador.'
    ]
  },

  {
    id: 'search-console',
    nome: 'Google Search Console',
    icone: '🔍',
    resumo: 'Quantas pessoas acham o site no Google, por qual busca, e em que posição.',
    navegador: true,
    obrigatorio: true,
    jaFunciona: false,
    porQue:
      'É a fonte mais importante do projeto inteiro. Calculadora vive de busca orgânica: ' +
      'o Search Console diz exatamente quais termos já trazem gente, quais estão na página 2 ' +
      '(a dois passos de virar tráfego real) e quais páginas o Google ainda não indexou. ' +
      'É o que transforma "espero que dê certo" em "sei onde mexer".',
    entrega: [
      'Cliques e impressões por termo de busca',
      'Posição média de cada calculadora',
      'Termos na posição 5–20 — onde um ajuste de conteúdo rende mais',
      'Páginas com problema de indexação'
    ],
    campos: [
      {
        chave: 'google_client_id',
        rotulo: 'OAuth Client ID',
        publico: true,
        tipo: 'text',
        dica: 'Não é segredo — client id de app web é público por design.',
        placeholder: '123456789-abc.apps.googleusercontent.com'
      }
    ],
    passos: [
      'Em search.google.com/search-console, adicionar a propriedade https://kaiohomem.github.io.',
      'Verificar a posse. O método mais simples aqui é a meta tag HTML — me mande o código que eu coloco no site.',
      'Em console.cloud.google.com, criar um projeto e ativar a "Search Console API".',
      'Em Credenciais, criar um OAuth client ID do tipo "Aplicativo da Web".',
      'Em "Origens JavaScript autorizadas", adicionar https://kaiohomem.github.io e http://localhost:8899.',
      'Colar o Client ID acima e clicar em Conectar.'
    ],
    espera: 'O Search Console leva de 2 a 3 dias para começar a mostrar dados depois da verificação.'
  },

  {
    id: 'ga4',
    nome: 'Google Analytics 4',
    icone: '📊',
    resumo: 'Comportamento de quem chega: quantos usam a calculadora, de onde vêm, em que aparelho.',
    navegador: true,
    obrigatorio: false,
    jaFunciona: false,
    porQue:
      'O Search Console mostra quem clicou para chegar. O GA4 mostra o que a pessoa fez depois. ' +
      'Para o AdSense render, o que importa é quanto tempo ela fica e quantas páginas vê — ' +
      'e é isso que o GA4 mede.',
    entrega: [
      'Visitantes por dia e por página',
      'Taxa de quem calcula de fato versus quem só abre',
      'Origem do tráfego: busca, direto, redes sociais',
      'Proporção de celular — decisivo para posicionar anúncio'
    ],
    campos: [
      {
        chave: 'ga4_measurement_id',
        rotulo: 'Measurement ID',
        publico: true,
        tipo: 'text',
        dica: 'Público por natureza — fica visível no HTML de qualquer site que usa GA4.',
        placeholder: 'G-XXXXXXXXXX'
      },
      {
        chave: 'ga4_property_id',
        rotulo: 'Property ID (numérico)',
        publico: true,
        tipo: 'text',
        dica: 'Necessário para o painel ler os dados via API.',
        placeholder: '123456789'
      }
    ],
    passos: [
      'Em analytics.google.com, criar uma propriedade GA4 para o site.',
      'Copiar o Measurement ID (formato G-XXXXXXXXXX) e colar acima.',
      'Me avisar: eu adiciono o script de medição nas páginas e ajusto a CSP.',
      'Em console.cloud.google.com, ativar a "Google Analytics Data API" no mesmo projeto do Search Console.',
      'O painel reaproveita o OAuth Client ID já configurado ali.'
    ],
    aviso:
      'GA4 coloca cookies de terceiros. Com tráfego brasileiro isso entra na LGPD: ' +
      'vou precisar adicionar um aviso de cookies e uma política de privacidade antes de ativar.'
  },

  {
    id: 'adsense',
    nome: 'Google AdSense',
    icone: '💵',
    resumo: 'A receita em si: quanto o site faturou, por dia e por página.',
    navegador: true,
    obrigatorio: true,
    jaFunciona: false,
    porQue:
      'É o caixa. Também é a conexão que mais depende de você: a conta é aberta no seu CPF, ' +
      'o pagamento cai na sua conta bancária e o imposto é seu. Nenhuma automação contorna isso.',
    entrega: [
      'Faturamento de hoje, do mês e acumulado',
      'RPM — quanto o site rende a cada mil visitas',
      'Qual calculadora rende mais por visita',
      'Quanto falta para o mínimo de saque (US$ 100)'
    ],
    campos: [
      {
        chave: 'adsense_publisher_id',
        rotulo: 'Publisher ID',
        publico: true,
        tipo: 'text',
        dica: 'Vai no HTML das páginas de qualquer forma — é público.',
        placeholder: 'ca-pub-0000000000000000'
      }
    ],
    passos: [
      'PRÉ-REQUISITO: o site precisa de conteúdo real e algum tráfego. Aplicar cedo demais gera reprovação, e reaplicar tem carência.',
      'Em adsense.google.com, cadastrar https://kaiohomem.github.io.',
      'Cadastrar endereço e dados fiscais — a análise costuma levar de dias a algumas semanas.',
      'Aprovado: criar 3 blocos de display e pegar os IDs dos slots.',
      'Colar o Publisher ID acima e os slots em ferramentas/monetizacao.js, e virar ativo: true.',
      'Ativar a "AdSense Management API" no Google Cloud para o painel ler o faturamento.'
    ],
    espera: 'Aprovação: de alguns dias a algumas semanas. Primeiro pagamento: só ao passar de US$ 100.'
  },

  {
    id: 'meta',
    nome: 'Meta — Instagram e Facebook',
    icone: '📱',
    resumo: 'Distribuição: publicar automaticamente e medir o tráfego que vem das redes.',
    navegador: false,
    obrigatorio: false,
    jaFunciona: false,
    porQue:
      'Serve para trazer visita enquanto o SEO ainda não maturou — e SEO leva meses. ' +
      'Não gera receita direta: é um cano de tráfego para as calculadoras, que é onde o anúncio está. ' +
      'Sendo honesto sobre a ordem: só vale o esforço depois que Search Console e AdSense estiverem de pé.',
    entrega: [
      'Publicação automática quando uma calculadora nova sai',
      'Alcance e cliques de cada publicação',
      'Quanto do tráfego do site veio das redes'
    ],
    campos: [
      {
        chave: 'meta_page_id',
        rotulo: 'ID da Página',
        publico: true,
        tipo: 'text',
        placeholder: '1234567890'
      }
    ],
    passos: [
      'Ter uma Página do Facebook e uma conta Instagram Profissional vinculada a ela.',
      'Em developers.facebook.com, criar um app do tipo "Empresa".',
      'Adicionar os produtos "Instagram Graph API" e "Facebook Login".',
      'Gerar um token de longa duração da Página.',
      'Guardar o token em Secrets do repositório (Settings > Secrets > Actions) — NUNCA no código.',
      'A publicação roda por GitHub Action, não pelo navegador.'
    ],
    aviso:
      'A Graph API da Meta não permite chamada direta do navegador (CORS bloqueia e o token ' +
      'vazaria). Por isso essa conexão roda por Action, com o token em GitHub Secrets.'
  }

];
