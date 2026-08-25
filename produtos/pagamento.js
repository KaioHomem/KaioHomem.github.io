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
  entrega: 'https://kaiohomem.github.io/produtos/obrigado.html',

  /* O order bump: um segundo link de pagamento, com o programa e o
     módulo de rescisão juntos.

     O "produtos recomendados" do Stripe faz isso dentro do checkout, e
     também serve. Este aqui acontece antes: uma caixa na página de
     venda que troca qual dos dois links o botão usa. A vantagem é que o
     comprador lê o que está levando na página que já estava lendo, em
     vez de decidir numa linha pequena no meio do formulário de cartão.

     Enquanto `link` estiver vazio a caixa não aparece — a página fica
     exatamente como está hoje. Crie o segundo link no Stripe com os
     dois produtos e o mesmo redirecionamento de obrigado-completo.html.  */
  combo: {
    link: '',
    preco: 'R$ 164',
    diferenca: '+ R$ 67',
    rotulo: 'Levar também o módulo de rescisão',
    detalhe: 'Compara os cinco desfechos do mesmo contrato e imprime o termo. ' +
             'Dá para adicionar depois pelo mesmo preço.',
    entrega: 'https://kaiohomem.github.io/produtos/obrigado-completo.html'
  }
};

(function () {
  'use strict';
  var cfg = window.PAGAMENTO || {};
  var bt = document.getElementById('btComprar');
  var nota = document.getElementById('notaCompra');
  var caixaBump = document.getElementById('bump');
  var valor = document.querySelector('.preco-caixa .valor');
  if (!bt) return;

  function stripe(u) { return typeof u === 'string' && /^https:\/\/buy\.stripe\.com\//.test(u); }

  var combo = cfg.combo || {};
  var temBump = stripe(cfg.link) && stripe(combo.link) && caixaBump && valor;
  var precoBase = valor ? valor.textContent : '';

  if (temBump) {
    caixaBump.innerHTML =
      '<label class="bump-caixa" for="btBump">' +
        '<input type="checkbox" id="btBump">' +
        '<span class="bump-texto">' +
          '<strong>' + combo.rotulo + '</strong>' +
          '<span class="bump-detalhe">' + combo.detalhe + '</span>' +
        '</span>' +
        '<span class="bump-preco">' + combo.diferenca + '</span>' +
      '</label>';

    var marca = document.getElementById('btBump');
    marca.addEventListener('change', function () {
      var levando = marca.checked;
      bt.href = levando ? combo.link : cfg.link;
      valor.textContent = levando ? combo.preco : precoBase;
    });
  }

  if (stripe(cfg.link)) {
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
