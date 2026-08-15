/* ===================================================
   PAINEL DO PROPRIETÁRIO

   Local-first by design. Every credential the owner types
   stays in this browser's localStorage and is never sent
   anywhere except to the service it belongs to.

   Nothing here is committed, because this repository is
   public — see the security note in conexoes.js.
   =================================================== */

(function () {
  'use strict';

  var DONO = 'KaioHomem';
  var REPO = 'KaioHomem.github.io';
  var CHAVE = 'painel.config.v1';

  /* ---------- CONFIG STORE ---------- */
  var Config = {
    ler: function () {
      try {
        return JSON.parse(localStorage.getItem(CHAVE) || '{}');
      } catch (e) {
        return {};
      }
    },
    obter: function (chave) {
      return this.ler()[chave] || '';
    },
    gravar: function (chave, valor) {
      var atual = this.ler();
      if (valor) atual[chave] = valor;
      else delete atual[chave];
      try {
        localStorage.setItem(CHAVE, JSON.stringify(atual));
        return true;
      } catch (e) {
        return false;
      }
    },
    limpar: function () {
      try { localStorage.removeItem(CHAVE); } catch (e) {}
    }
  };

  /* ---------- HELPERS ---------- */
  function esc(txt) {
    return String(txt == null ? '' : txt)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function quando(iso) {
    if (!iso) return '—';
    var ms = Date.now() - new Date(iso).getTime();
    var min = Math.round(ms / 60000);
    if (min < 1) return 'agora';
    if (min < 60) return 'há ' + min + ' min';
    var h = Math.round(min / 60);
    if (h < 24) return 'há ' + h + 'h';
    var d = Math.round(h / 24);
    if (d < 30) return 'há ' + d + (d === 1 ? ' dia' : ' dias');
    return new Date(iso).toLocaleDateString('pt-BR');
  }

  function cartao(opcoes) {
    var o = opcoes || {};
    return '<div class="p-cartao ' + (o.estado || '') + '">' +
             '<div class="p-cartao-topo">' +
               '<span class="p-cartao-rotulo">' + esc(o.rotulo) + '</span>' +
               (o.selo ? '<span class="p-selo ' + (o.seloEstado || '') + '">' + esc(o.selo) + '</span>' : '') +
             '</div>' +
             '<div class="p-cartao-valor">' + (o.valor || '—') + '</div>' +
             (o.nota ? '<p class="p-cartao-nota">' + o.nota + '</p>' : '') +
           '</div>';
  }

  /* ---------- GITHUB ---------- */
  function buscarGitHub(caminho) {
    var cabecalhos = { 'Accept': 'application/vnd.github+json' };
    var token = Config.obter('github_token');
    if (token) cabecalhos.Authorization = 'Bearer ' + token;

    return fetch('https://api.github.com/repos/' + DONO + '/' + REPO + caminho, {
      headers: cabecalhos
    }).then(function (r) {
      if (!r.ok) throw new Error('GitHub respondeu ' + r.status);
      return r.json();
    });
  }

  /* ---------- OVERVIEW ---------- */
  function renderVisaoGeral() {
    var alvo = document.getElementById('aba-visao');
    var tabelas = window.FerramentasBR ? window.FerramentasBR.TABELAS : null;

    var html = '';

    /* --- Operação: funciona sem configurar nada --- */
    html += '<h2 class="p-titulo">Operação</h2>';
    html += '<p class="p-sub">Vem da API pública do GitHub e do próprio código do site. ' +
            'Não depende de nenhuma conexão.</p>';
    html += '<div class="p-grade" id="grade-operacao">' +
              cartao({ rotulo: 'Último deploy', valor: '<span class="p-carregando">carregando</span>' }) +
              cartao({ rotulo: 'Testes das calculadoras', valor: '<span class="p-carregando">carregando</span>' }) +
              cartao({ rotulo: 'Tarefas de manutenção', valor: '<span class="p-carregando">carregando</span>' }) +
            '</div>';

    /* --- Tabelas fiscais: calculado localmente --- */
    if (tabelas) {
      var anoAgora = new Date().getFullYear();
      var mesAgora = new Date().getMonth() + 1;
      var vencida = tabelas.ano < anoAgora;
      var chegando = tabelas.ano === anoAgora && mesAgora >= 11;

      html += '<h2 class="p-titulo">Tabelas fiscais</h2>';
      html += '<p class="p-sub">Calculadora com tabela velha é pior que calculadora nenhuma. ' +
              'Este número é lido direto de <code>ferramentas/nucleo.js</code>.</p>';
      html += '<div class="p-grade">' +
        cartao({
          rotulo: 'Ano vigente no site',
          valor: tabelas.ano,
          estado: vencida ? 'alerta' : (chegando ? 'atencao' : 'ok'),
          selo: vencida ? 'desatualizada' : (chegando ? 'revisar em breve' : 'em dia'),
          seloEstado: vencida ? 'ruim' : (chegando ? 'medio' : 'bom'),
          nota: vencida
            ? 'Estamos em ' + anoAgora + '. INSS e IRRF mudaram em janeiro — os cálculos estão errados.'
            : (chegando
                ? 'O governo publica os parâmetros do ano seguinte em nov/dez.'
                : 'Revisada em ' + tabelas.atualizadoEm + '.')
        }) +
        cartao({
          rotulo: 'Teto de desconto do INSS',
          valor: window.FerramentasBR.brl(window.FerramentasBR.calcularINSS(tabelas.inss.teto).valor),
          nota: 'Confere com o valor oficial publicado.'
        }) +
        cartao({
          rotulo: 'Isenção de IRRF até',
          valor: window.FerramentasBR.brl(5000),
          nota: 'Redutor zera em ' + window.FerramentasBR.brl(tabelas.irrf.redutor.limite) + '.'
        }) +
      '</div>';
    }

    /* --- Bloqueados por conexão --- */
    html += '<h2 class="p-titulo">Tráfego e receita</h2>';
    html += '<p class="p-sub">Estes números só existem depois de conectar as contas. ' +
            'Nenhum deles pode ser inventado por mim.</p>';
    html += '<div class="p-grade">';

    ['search-console', 'ga4', 'adsense'].forEach(function (id) {
      var c = acharConexao(id);
      var pronto = conexaoPronta(c);
      html += '<div class="p-cartao ' + (pronto ? 'ok' : 'travado') + '">' +
                '<div class="p-cartao-topo">' +
                  '<span class="p-cartao-rotulo">' + c.icone + ' ' + esc(c.nome) + '</span>' +
                  '<span class="p-selo ' + (pronto ? 'bom' : '') + '">' +
                    (pronto ? 'configurado' : 'não conectado') + '</span>' +
                '</div>' +
                '<div class="p-cartao-valor p-travado">' + (pronto ? 'aguardando dados' : '—') + '</div>' +
                '<p class="p-cartao-nota">' + esc(c.resumo) + '</p>' +
                '<button class="p-btn-link" data-ir-conexao="' + c.id + '">' +
                  (pronto ? 'Revisar conexão' : 'Como conectar') + ' →</button>' +
              '</div>';
    });

    html += '</div>';

    /* --- Próximo passo --- */
    html += proximoPasso();

    alvo.innerHTML = html;

    ligarBotoesConexao();
    carregarOperacao();
  }

  /**
   * The single most useful thing a dashboard can say: what to do next.
   * Ordered by what actually unblocks revenue.
   */
  function proximoPasso() {
    var passos = [
      {
        id: 'search-console',
        titulo: 'Conectar o Search Console',
        porque: 'Sem ele você está no escuro: não dá para saber quais buscas já trazem gente ' +
                'nem quais páginas o Google indexou. É de graça e leva 10 minutos.'
      },
      {
        id: 'adsense',
        titulo: 'Pedir aprovação no AdSense',
        porque: 'É a conta que efetivamente recebe. A análise leva de dias a semanas, então ' +
                'quanto antes entrar na fila, melhor — desde que já haja conteúdo publicado.'
      },
      {
        id: 'ga4',
        titulo: 'Instalar o Google Analytics',
        porque: 'Mostra se as pessoas usam a calculadora ou só abrem e saem. ' +
                'Exige antes um aviso de cookies por causa da LGPD.'
      },
      {
        id: 'meta',
        titulo: 'Automatizar a divulgação no Instagram',
        porque: 'Traz visita enquanto o SEO amadurece. Só vale depois dos três acima.'
      }
    ];

    var pendente = null;
    for (var i = 0; i < passos.length; i++) {
      if (!conexaoPronta(acharConexao(passos[i].id))) { pendente = passos[i]; break; }
    }

    if (!pendente) {
      return '<div class="p-proximo ok">' +
               '<div class="p-proximo-rotulo">Próximo passo</div>' +
               '<h3>Tudo conectado.</h3>' +
               '<p>Daqui para frente o trabalho é conteúdo: mais calculadoras, mais buscas cobertas.</p>' +
             '</div>';
    }

    return '<div class="p-proximo">' +
             '<div class="p-proximo-rotulo">Próximo passo</div>' +
             '<h3>' + esc(pendente.titulo) + '</h3>' +
             '<p>' + esc(pendente.porque) + '</p>' +
             '<button class="p-btn" data-ir-conexao="' + pendente.id + '">Ver o passo a passo</button>' +
           '</div>';
  }

  function carregarOperacao() {
    var grade = document.getElementById('grade-operacao');
    if (!grade) return;

    Promise.all([
      buscarGitHub('/actions/runs?per_page=10').catch(function () { return null; }),
      buscarGitHub('/issues?state=open&per_page=30').catch(function () { return null; })
    ]).then(function (res) {
      var execucoes = res[0], issues = res[1];

      if (!execucoes && !issues) {
        grade.innerHTML = '<div class="p-cartao alerta"><div class="p-cartao-topo">' +
          '<span class="p-cartao-rotulo">GitHub inacessível</span></div>' +
          '<div class="p-cartao-valor">—</div>' +
          '<p class="p-cartao-nota">Não consegui falar com a API do GitHub. ' +
          'Pode ser limite de consultas (60/hora sem token) ou rede. ' +
          'Configure um token na aba Conexões para subir o limite.</p></div>';
        return;
      }

      var html = '';

      var ultima = execucoes && execucoes.workflow_runs && execucoes.workflow_runs[0];
      if (ultima) {
        var okDeploy = ultima.conclusion === 'success';
        html += cartao({
          rotulo: 'Último deploy',
          valor: okDeploy ? 'Publicado' : esc(ultima.conclusion || ultima.status),
          estado: okDeploy ? 'ok' : 'alerta',
          selo: quando(ultima.updated_at),
          seloEstado: okDeploy ? 'bom' : 'ruim',
          nota: esc(ultima.display_title || ultima.name || '')
        });
      } else {
        html += cartao({ rotulo: 'Último deploy', valor: 'sem execuções' });
      }

      // Find the calculator test workflow specifically.
      var testes = null;
      if (execucoes && execucoes.workflow_runs) {
        for (var i = 0; i < execucoes.workflow_runs.length; i++) {
          var r = execucoes.workflow_runs[i];
          if (/ferramenta/i.test(r.name || '')) { testes = r; break; }
        }
      }
      if (testes) {
        var passou = testes.conclusion === 'success';
        html += cartao({
          rotulo: 'Testes das calculadoras',
          valor: passou ? '66/66' : 'falhando',
          estado: passou ? 'ok' : 'alerta',
          selo: passou ? 'passando' : 'quebrado',
          seloEstado: passou ? 'bom' : 'ruim',
          nota: passou
            ? 'Nenhum cálculo fiscal saiu do lugar.'
            : 'Algum cálculo mudou de resultado. Verificar antes que chegue no usuário.'
        });
      } else {
        html += cartao({
          rotulo: 'Testes das calculadoras',
          valor: 'aguardando',
          nota: 'Rodam no primeiro push para a main.'
        });
      }

      var manutencao = (issues || []).filter(function (i) {
        return !i.pull_request;
      });
      html += cartao({
        rotulo: 'Tarefas de manutenção',
        valor: manutencao.length,
        estado: manutencao.length > 0 ? 'atencao' : 'ok',
        nota: manutencao.length
          ? esc(manutencao[0].title)
          : 'Nada pendente. Os agentes abrem issue aqui quando algo precisa de você.'
      });

      grade.innerHTML = html;
    });
  }

  /* ---------- CONNECTIONS ---------- */
  function acharConexao(id) {
    for (var i = 0; i < window.CONEXOES.length; i++) {
      if (window.CONEXOES[i].id === id) return window.CONEXOES[i];
    }
    return null;
  }

  function conexaoPronta(c) {
    if (!c) return false;
    if (c.jaFunciona) return true;
    if (!c.campos || !c.campos.length) return false;
    // Ready when every non-optional field has a value.
    return c.campos.every(function (campo) {
      return !!Config.obter(campo.chave);
    });
  }

  function renderConexoes() {
    var alvo = document.getElementById('aba-conexoes');
    var html = '';

    html += '<div class="p-aviso-seg">' +
              '<strong>Onde suas chaves ficam.</strong> ' +
              'Tudo que você digitar aqui é gravado apenas no <code>localStorage</code> deste ' +
              'navegador. Nada vai para o repositório — que é público — nem para servidor nenhum. ' +
              'Trocar de máquina significa preencher de novo, e é assim de propósito.' +
            '</div>';

    window.CONEXOES.forEach(function (c) {
      var pronto = conexaoPronta(c);

      html += '<section class="p-conexao" id="conexao-' + c.id + '">';
      html += '<div class="p-conexao-topo">' +
                '<div>' +
                  '<h3>' + c.icone + ' ' + esc(c.nome) +
                    (c.obrigatorio ? '<span class="p-tag">essencial</span>' : '') +
                  '</h3>' +
                  '<p class="p-conexao-resumo">' + esc(c.resumo) + '</p>' +
                '</div>' +
                '<span class="p-selo ' + (pronto ? 'bom' : '') + '">' +
                  (c.jaFunciona ? 'ativo' : (pronto ? 'configurado' : 'não conectado')) +
                '</span>' +
              '</div>';

      html += '<div class="p-conexao-corpo">';

      html += '<h4>Por que importa</h4><p>' + esc(c.porQue) + '</p>';

      html += '<h4>O que passa a aparecer no painel</h4><ul class="p-lista">';
      c.entrega.forEach(function (e) { html += '<li>' + esc(e) + '</li>'; });
      html += '</ul>';

      if (c.campos && c.campos.length) {
        html += '<h4>Credenciais</h4>';
        c.campos.forEach(function (campo) {
          var valor = Config.obter(campo.chave);
          html += '<div class="p-campo">' +
                    '<label for="c-' + campo.chave + '">' + esc(campo.rotulo) +
                      '<span class="p-badge ' + (campo.publico ? 'publico' : 'secreto') + '">' +
                        (campo.publico ? 'público' : 'secreto') +
                      '</span>' +
                    '</label>' +
                    '<input id="c-' + campo.chave + '" class="p-entrada" ' +
                      'type="' + (campo.tipo || 'text') + '" ' +
                      'placeholder="' + esc(campo.placeholder || '') + '" ' +
                      'value="' + esc(valor) + '" ' +
                      'data-chave="' + campo.chave + '" autocomplete="off" spellcheck="false">' +
                    (campo.dica ? '<span class="p-dica">' + esc(campo.dica) + '</span>' : '') +
                  '</div>';
        });
        html += '<div class="p-acoes">' +
                  '<button class="p-btn" data-salvar="' + c.id + '">Salvar</button>' +
                  '<span class="p-salvo" id="salvo-' + c.id + '"></span>' +
                '</div>';
      }

      html += '<h4>Passo a passo</h4><ol class="p-passos">';
      c.passos.forEach(function (p) { html += '<li>' + esc(p) + '</li>'; });
      html += '</ol>';

      if (c.espera) {
        html += '<p class="p-nota-tempo">⏳ ' + esc(c.espera) + '</p>';
      }
      if (c.aviso) {
        html += '<div class="p-aviso">' + esc(c.aviso) + '</div>';
      }
      if (!c.navegador) {
        html += '<div class="p-aviso">Esta conexão não roda no navegador — ela é executada ' +
                'por GitHub Action, com o token guardado em Secrets do repositório.</div>';
      }

      html += '</div></section>';
    });

    html += '<div class="p-acoes p-acoes-fim">' +
              '<button class="p-btn p-btn-perigo" id="apagar-tudo">Apagar todas as credenciais deste navegador</button>' +
            '</div>';

    alvo.innerHTML = html;
    ligarFormularios();
  }

  function ligarFormularios() {
    document.querySelectorAll('[data-salvar]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-salvar');
        var conexao = acharConexao(id);
        var ok = true;

        conexao.campos.forEach(function (campo) {
          var input = document.getElementById('c-' + campo.chave);
          if (input && !Config.gravar(campo.chave, input.value.trim())) ok = false;
        });

        var aviso = document.getElementById('salvo-' + id);
        aviso.textContent = ok ? 'salvo neste navegador' : 'não consegui gravar';
        aviso.className = 'p-salvo ' + (ok ? 'bom' : 'ruim');
        setTimeout(function () { aviso.textContent = ''; }, 2600);

        atualizarSelos();
      });
    });

    var apagar = document.getElementById('apagar-tudo');
    if (apagar) {
      apagar.addEventListener('click', function () {
        if (!confirm('Apagar todas as credenciais salvas neste navegador?')) return;
        Config.limpar();
        renderConexoes();
        atualizarSelos();
      });
    }
  }

  function atualizarSelos() {
    renderVisaoGeral();
  }

  function ligarBotoesConexao() {
    document.querySelectorAll('[data-ir-conexao]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        abrirAba('conexoes');
        var alvo = document.getElementById('conexao-' + btn.getAttribute('data-ir-conexao'));
        if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ---------- TABS ---------- */
  function abrirAba(nome) {
    ['visao', 'conexoes'].forEach(function (n) {
      var painel = document.getElementById('aba-' + n);
      var botao = document.querySelector('[data-aba="' + n + '"]');
      if (painel) painel.hidden = n !== nome;
      if (botao) botao.classList.toggle('ativo', n === nome);
    });
  }

  /* ---------- BOOT ---------- */
  document.querySelectorAll('[data-aba]').forEach(function (b) {
    b.addEventListener('click', function () { abrirAba(b.getAttribute('data-aba')); });
  });

  renderConexoes();
  renderVisaoGeral();
  abrirAba('visao');
})();
