/* ===================================================
   FUNIL — configuração da oferta pós-compra

   >>> DOIS CAMPOS A PREENCHER, e nada mais.

   Cole os links de pagamento do Stripe em `upsell.link` e
   `downsell.link`. Enquanto estiverem vazios, a oferta
   inteira não aparece — nada de botão morto nem de "em
   breve" na página de quem acabou de pagar.

   Mesma disciplina do pagamento.js: um link errado leva a
   um 404 logo depois de a pessoa ter confiado dinheiro a
   você, que é o pior momento possível para um 404.

   --- Sobre o downsell, com honestidade ---

   O que impede alguém de comprar o módulo de rescisão
   logo depois de comprar a folha não é o preço: é que
   ninguém está demitindo hoje. Isso é objeção de momento,
   e desconto nenhum resolve objeção de momento.

   Por isso o downsell que vem configurado é parcelamento,
   não corte de preço: baixa a barreira sem ensinar o
   comprador a recusar a primeira oferta para ganhar a
   segunda. Se você preferir outro desenho, os textos
   estão aqui e são seus para trocar.

   O total parcelado é maior que o à vista — o Stripe
   cobra pelo parcelamento. O texto abaixo diz isso em voz
   alta, e deve continuar dizendo.
   =================================================== */

window.FUNIL = {
  upsell: {
    link: '',
    preco: 'R$ 67',
    titulo: 'O mesmo contrato tem cinco desfechos',
    // A conta de UMA rescisão já é gratuita em custo-demissao.html, e o
    // comprador descobre isso em dois cliques. O argumento tem de ser o
    // que realmente não existe em outro lugar: comparar os cinco
    // desfechos, o termo impresso, e tudo dentro do arquivo que ele já
    // tem, com o cadastro que ele já digitou.
    corpo: 'A conta de uma rescisão você já faz de graça na calculadora do site. ' +
           'O que não existe em lugar nenhum é comparar os cinco desfechos do mesmo ' +
           'contrato lado a lado, imprimir o termo, e ter isso dentro do arquivo que ' +
           'você acabou de baixar — com os funcionários que você já cadastrou.',
    chamada: 'Adicionar o módulo de rescisão',
    entrega: 'https://kaiohomem.github.io/produtos/obrigado-completo.html'
  },

  downsell: {
    link: '',
    preco: '2× de R$ 37',
    titulo: 'Prefere dividir?',
    corpo: 'Mesmo módulo, em duas parcelas. O total sai R$ 74 em vez de R$ 67 — ' +
           'a diferença é o que o Stripe cobra pelo parcelamento, e prefiro dizer ' +
           'isso do que esconder.',
    chamada: 'Parcelar em 2×',
    entrega: 'https://kaiohomem.github.io/produtos/obrigado-completo.html'
  },

  // O que aparece quando a pessoa recusa as duas. Não é venda: é o
  // endereço para quando ela precisar de verdade.
  recusa: 'Sem problema. Esta página continua sua — quando precisar demitir alguém, ' +
          'o módulo está aqui.'
};

(function () {
  'use strict';

  var cfg = window.FUNIL || {};
  var caixa = document.getElementById('funil');
  if (!caixa) return;

  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function valido(o) {
    return o && typeof o.link === 'string' && /^https:\/\/buy\.stripe\.com\//.test(o.link);
  }

  // Numa página que existe para entregar o arquivo, oferta sem link
  // configurado não aparece: botão morto logo depois de a pessoa ter
  // confiado dinheiro é o pior primeiro contato possível.
  //
  // Numa página que existe PARA a oferta, o silêncio é pior: sobra um
  // texto que explica um produto e nunca diz como comprá-lo. Aí a
  // página se explica em voz alta, do mesmo jeito que a página de venda
  // já faz enquanto o Stripe não está ligado. É o `data-sempre` no
  // contêiner que diz qual das duas é.
  var sempre = caixa.hasAttribute('data-sempre');

  // Numa página que já argumentou o assunto no h1, repetir o mesmo
  // título dentro da oferta põe dois títulos idênticos na mesma tela.
  // O contêiner pode dar o seu.
  var tituloProprio = caixa.getAttribute('data-titulo');
  function tituloDe(o) { return tituloProprio || o.titulo; }

  if (!valido(cfg.upsell)) {
    if (!sempre) return;
    caixa.innerHTML =
      '<div class="oferta">' +
        '<h2>' + esc(tituloDe(cfg.upsell)) + '</h2>' +
        '<p>' + esc(cfg.upsell.corpo) + '</p>' +
        '<div class="oferta-preco">' + esc(cfg.upsell.preco) + '</div>' +
        '<p class="sem-link">O pagamento deste módulo ainda não está ativo. ' +
          'Se quiser agora, escreva para ' +
          '<a href="mailto:kaiokateto@gmail.com">kaiokateto@gmail.com</a>.</p>' +
      '</div>';
    return;
  }

  function oferta(o, id) {
    return '<div class="oferta" id="' + id + '">' +
      '<h2>' + esc(id === 'ofertaUpsell' ? tituloDe(o) : o.titulo) + '</h2>' +
      '<p>' + esc(o.corpo) + '</p>' +
      '<div class="oferta-preco">' + esc(o.preco) + '</div>' +
      '<a class="baixar oferta-cta" href="' + esc(o.link) + '">' + esc(o.chamada) + ' →</a>' +
      '</div>';
  }

  var temDownsell = valido(cfg.downsell);

  caixa.innerHTML =
    oferta(cfg.upsell, 'ofertaUpsell') +
    (temDownsell ? oferta(cfg.downsell, 'ofertaDownsell') : '') +
    '<p class="oferta-recusa"><button type="button" class="btn-recusa" id="btRecusar">' +
      (temDownsell ? 'Agora não' : 'Agora não, obrigado') +
    '</button></p>' +
    '<p class="oferta-fim" id="ofertaFim"></p>';

  var upsell = document.getElementById('ofertaUpsell');
  var downsell = document.getElementById('ofertaDownsell');
  var fim = document.getElementById('ofertaFim');
  var botao = document.getElementById('btRecusar');

  if (downsell) downsell.style.display = 'none';

  botao.addEventListener('click', function () {
    if (downsell && downsell.style.display === 'none') {
      // Primeira recusa: some a oferta cheia, entra a parcelada.
      upsell.style.display = 'none';
      downsell.style.display = '';
      botao.textContent = 'Agora não, obrigado';
      return;
    }
    // Segunda recusa (ou única, se não houver downsell): acabou. Insistir
    // uma terceira vez com quem já disse não duas é só desgaste.
    if (upsell) upsell.style.display = 'none';
    if (downsell) downsell.style.display = 'none';
    botao.style.display = 'none';
    fim.textContent = cfg.recusa || '';
  });
})();
