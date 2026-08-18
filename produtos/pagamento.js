/* ===================================================
   PAGAMENTO — configuração do link de compra

   >>> ÚNICO ARQUIVO A EDITAR PARA COMEÇAR A VENDER.

   Cole o link de pagamento do Stripe em `link` e o botão
   se ativa sozinho. Enquanto estiver vazio, ele fica
   desabilitado com um aviso honesto em vez de levar o
   visitante para um 404 — o pior primeiro contato
   possível com um produto pago.

   Ainda não existe link porque a conta do Stripe não está
   ativada, e ativar é um passo que só o dono da conta pode
   dar. O passo a passo está em ATIVAR-VENDA.md, aqui do lado.
   =================================================== */

window.PAGAMENTO = {
  // Link de pagamento do Stripe. Formato: https://buy.stripe.com/xxxxx
  link: '',

  // Só para exibição. O preço real é o configurado no Stripe.
  preco: 'R$ 97',

  // Para onde o Stripe manda o comprador depois de pagar.
  // Configure este endereço no próprio link de pagamento, em
  // "After payment" > "Redirect customers to a page you host".
  entrega: 'https://kaiohomem.github.io/produtos/obrigado.html'
};

(function () {
  'use strict';
  var cfg = window.PAGAMENTO || {};
  var bt = document.getElementById('btComprar');
  var nota = document.getElementById('notaCompra');
  if (!bt) return;

  if (cfg.link && /^https:\/\/buy\.stripe\.com\//.test(cfg.link)) {
    bt.href = cfg.link;
    bt.classList.remove('indisponivel');
    if (nota) {
      nota.innerHTML = 'Pagamento pelo Stripe · cartão ou Pix · download imediato<br>' +
                       '<span style="color:var(--text-3)">Não serviu? Devolvo em até 7 dias.</span>';
    }
  } else {
    // Falha honesta: nada de botão que não leva a lugar nenhum.
    bt.setAttribute('aria-disabled', 'true');
    if (nota) {
      nota.innerHTML = 'O pagamento ainda não está ativo. Se quiser o programa agora, ' +
                       'escreva para <a href="mailto:kaiokateto@gmail.com">kaiokateto@gmail.com</a>.';
    }
  }
})();
