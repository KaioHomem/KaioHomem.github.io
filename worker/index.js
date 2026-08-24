/* ===================================================
   WORKER — site estático e entrega do produto pago

   Um Worker só faz as duas coisas:

     tudo que não é /api/  ->  Static Assets (o dist/)
     /api/status           ->  a página de obrigado pergunta o estado
     /api/baixar           ->  entrega o arquivo, se houver direito

   Mesma origem para os dois, então não existe CORS aqui —
   e essa ausência é o principal motivo de ser um Worker e
   não um Pages mais um Worker. Cabeçalho de CORS é o tipo
   de coisa que alguém afrouxa para "*" num dia de pressa e
   nunca mais aperta. O que não existe não afrouxa.

   >>> O produto pago NÃO está no dist/.

   Ele entra aqui como módulo de texto (a regra `Text` no
   wrangler.toml), o que o transforma numa string dentro do
   código compilado. Não há URL que o alcance: só sai por
   /api/baixar, e só depois de o Stripe confirmar.
   =================================================== */

import produtoBase from '../produtos/folha-simples-fc86aa480de7f81c.html';
import produtoCompleto from '../produtos/folha-simples-completo-fc86aa480de7f81c.html';

/* ---------- O CATÁLOGO ----------

   `metadata.produto` da Checkout Session escolhe a linha desta
   tabela. O navegador não escolhe nada — ver o comentário em
   `resolverDireito`.                                             */
const CATALOGO = {
  base: {
    corpo: produtoBase,
    nome: 'folha-simples.html',
    rotulo: 'Folha Simples',
    precosEnv: 'PRECOS_BASE'
  },
  completo: {
    corpo: produtoCompleto,
    nome: 'folha-simples-completo.html',
    rotulo: 'Folha Simples Completo',
    precosEnv: 'PRECOS_COMPLETO'
  }
};

// Um segundo produto qualquer nesta conta Stripe não pode destravar o
// Folha Simples só por ter sido pago. A metadata carrega o nome do
// aplicativo além do produto.
const APP = 'folha-simples';

const STRIPE = 'https://api.stripe.com/v1/checkout/sessions/';

/* ---------- ERROS ----------

   Motivo em código curto, para a página de obrigado decidir o que
   dizer, e mensagem em português para quem cair direto no endpoint.

   402 e não 403 para "ainda não pago": são situações diferentes e a
   página reage diferente. 403 é "esta sessão não dá direito a este
   arquivo", que não melhora esperando. 402 é "o pagamento ainda não
   consta", que pode melhorar em segundos — e mandar alguém embora com
   "proibido" logo depois de ter pago é a pior leitura possível.     */
class Recusa extends Error {
  constructor(status, motivo, mensagem) {
    super(mensagem);
    this.status = status;
    this.motivo = motivo;
  }
}

function lerSessionId(url) {
  const bruto = url.searchParams.get('session_id');
  if (!bruto) {
    throw new Recusa(400, 'sem_sessao',
      'Falta o identificador da sessão de pagamento.');
  }
  // Formato do Stripe. Barrar aqui evita mandar lixo para a API e
  // evita que um valor esquisito vire parte de uma URL montada.
  if (!/^cs_[A-Za-z0-9_]{10,}$/.test(bruto)) {
    throw new Recusa(400, 'sessao_malformada',
      'O identificador da sessão não tem o formato do Stripe.');
  }
  return bruto;
}

/* ---------- STRIPE ---------- */

async function buscarSessao(id, env) {
  if (!env.STRIPE_SECRET_KEY) {
    // Falha fechada, e barulhenta. A alternativa — entregar quando não
    // há como conferir — é a única que não pode existir.
    throw new Recusa(503, 'sem_configuracao',
      'A entrega não está configurada. Nada é entregue sem conferir o pagamento.');
  }

  // line_items expandido: é a segunda barreira, e ela precisa vir na
  // mesma chamada. Uma segunda ida à API seria mais uma coisa capaz de
  // falhar entre a verificação e a entrega.
  const resposta = await fetch(
    STRIPE + encodeURIComponent(id) + '?expand[]=line_items.data.price',
    { headers: { Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY } }
  );

  if (resposta.status === 404) {
    throw new Recusa(404, 'nao_encontrada',
      'Essa sessão de pagamento não existe.');
  }
  if (!resposta.ok) {
    // Nunca repassar o corpo do erro do Stripe: ele pode citar a conta,
    // e um endpoint público não é lugar para isso.
    throw new Recusa(502, 'stripe_indisponivel',
      'Não consegui confirmar o pagamento agora. Tente de novo em instantes.');
  }
  return resposta.json();
}

/* ---------- A AUTORIZAÇÃO ----------

   Quatro exigências cumulativas. Nenhuma delas sozinha basta, e a
   ordem importa só para a mensagem de erro ser útil.               */
function resolverDireito(sessao) {
  // 1. Pago.
  if (sessao.payment_status !== 'paid') {
    throw new Recusa(402, 'nao_pago',
      'Esta sessão ainda não consta como paga.');
  }

  const meta = sessao.metadata || {};

  // 2. É desta loja.
  if (meta.app !== APP) {
    throw new Recusa(403, 'outro_app',
      'Esta compra não é do Folha Simples.');
  }

  /* 3. Qual produto — e a decisão vem DAQUI, não do navegador.

     Este é o ponto que fecha o buraco. Se o endpoint aceitasse
     `?produto=completo`, quem comprou o base de R$ 97 mudaria uma
     palavra na barra de endereço e levaria o de R$ 164. A escolha do
     arquivo sai da metadata da sessão paga, que só o Stripe escreve.
     Não existe parâmetro de produto nesta API — de propósito.       */
  const chave = meta.produto;
  const item = CATALOGO[chave];
  if (!item) {
    throw new Recusa(403, 'produto_desconhecido',
      'Esta compra não corresponde a nenhum arquivo entregável.');
  }

  return { chave, item };
}

/* 4. O preço pago é um dos registrados para este produto.

   Segunda barreira, independente da metadata. A metadata é escrita por
   quem configura o Payment Link; se alguém a copiar para o link errado,
   esta checagem ainda pega.

   Sem a variável configurada, RECUSA. É tentador deixar passar quando
   não há lista — "ainda não configurei" — mas isso é exatamente como se
   entrega um produto de graça sem ninguém perceber. Falhar fechado
   custa um erro claro durante a configuração; falhar aberto custa o
   produto.                                                          */
function conferirPreco(sessao, chave, item, env) {
  const registrados = String(env[item.precosEnv] || '')
    .split(',').map(s => s.trim()).filter(Boolean);

  if (!registrados.length) {
    throw new Recusa(503, 'sem_precos',
      'A entrega não está configurada por completo. ' +
      'Falta declarar os preços de "' + chave + '" em ' + item.precosEnv + '.');
  }

  const itens = (sessao.line_items && sessao.line_items.data) || [];
  const pagos = itens.map(li => li.price && li.price.id).filter(Boolean);
  const bate = pagos.some(id => registrados.indexOf(id) !== -1);

  if (!bate) {
    throw new Recusa(403, 'preco_nao_confere',
      'O que foi pago nesta sessão não corresponde a este produto.');
  }
}

async function autorizar(url, env) {
  const sessao = await buscarSessao(lerSessionId(url), env);
  const { chave, item } = resolverDireito(sessao);
  conferirPreco(sessao, chave, item, env);
  return item;
}

/* ---------- RESPOSTAS ---------- */

const SEM_CACHE = {
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff'
};

function json(corpo, status) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...SEM_CACHE }
  });
}

function entregar(item) {
  return new Response(item.corpo, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Nome amigável: o comprador salva "folha-simples.html", não o
      // arquivo com hash que existe só para o repositório.
      'Content-Disposition': 'attachment; filename="' + item.nome + '"',
      ...SEM_CACHE
    }
  });
}

/* ---------- ROTAS ---------- */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/status' || url.pathname === '/api/baixar') {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return json({ ok: false, motivo: 'metodo' }, 405);
      }
      try {
        const item = await autorizar(url, env);
        return url.pathname === '/api/status'
          ? json({ ok: true, produto: item.rotulo, arquivo: item.nome }, 200)
          : entregar(item);
      } catch (erro) {
        if (erro instanceof Recusa) {
          return json({ ok: false, motivo: erro.motivo, mensagem: erro.message },
                      erro.status);
        }
        // Defeito nosso. Não vaza detalhe: a mensagem de uma exceção
        // inesperada pode conter qualquer coisa que estava em memória.
        return json({ ok: false, motivo: 'erro_interno',
                      mensagem: 'Algo falhou aqui do meu lado.' }, 500);
      }
    }

    // Todo o resto é o site: o dist/, servido pelos Static Assets.
    return env.ASSETS.fetch(request);
  }
};
