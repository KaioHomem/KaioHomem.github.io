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
    titulo: 'Falta a conta mais cara do ano',
    // O argumento é o que o produto ainda NÃO faz — e a página de venda
    // já admite isso em texto. Prometer o que não entrega seria pior.
    corpo: 'O Folha Simples calcula folha, 13º e férias. Não calcula rescisão — ' +
           'e rescisão é a conta que reúne saldo de salário, aviso proporcional, ' +
           '13º, férias, terço e multa do FGTS, cada uma com uma regra própria. ' +
           'O módulo acrescenta os cinco tipos de desligamento, o custo para a ' +
           'empresa e o termo pronto para imprimir.',
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

  function valido(o) {
    return o && typeof o.link === 'string' && /^https:\/\/buy\.stripe\.com\//.test(o.link);
  }

  // Sem link de upsell não há oferta nenhuma. O downsell sozinho não faz
  // sentido: ele existe como resposta a uma recusa.
  if (!valido(cfg.upsell)) return;

  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function oferta(o, id) {
    return '<div class="oferta" id="' + id + '">' +
      '<h2>' + esc(o.titulo) + '</h2>' +
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
