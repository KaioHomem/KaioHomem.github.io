/* ===================================================
   ENTREGA — o botão de baixar da página de obrigado

   O arquivo não tem mais endereço próprio. Ele sai por
   /api/baixar, e só depois de o Worker perguntar ao Stripe
   se aquela sessão foi paga.

   Esta página pergunta antes (/api/status) para saber o que
   mostrar. Sem isso, quem chegasse com um pagamento ainda
   não confirmado clicaria num botão e receberia um JSON de
   erro na cara — logo depois de ter pago, que é o pior
   momento possível para um site parecer quebrado.

   >>> Regra do projeto: nada de botão morto.

   Enquanto não há direito confirmado, não existe botão:
   existe uma explicação e um caminho.
   =================================================== */

(function () {
  'use strict';

  var alvo = document.getElementById('entrega');
  if (!alvo) return;

  // Qual produto esta página entrega. Serve só para o texto — quem
  // decide o arquivo é o Worker, a partir da sessão paga. Um valor
  // errado aqui muda uma palavra na tela e não destrava nada.
  var rotulo = alvo.getAttribute('data-rotulo') || 'o programa';

  function bloco(html) { alvo.innerHTML = html; }

  function aviso(titulo, corpo, extra) {
    bloco(
      '<div class="entrega-aviso">' +
        '<p class="entrega-titulo">' + titulo + '</p>' +
        '<p>' + corpo + '</p>' +
        (extra || '') +
      '</div>'
    );
  }

  var contato = '<p>Se precisar de ajuda, escreva para ' +
    '<a href="mailto:kaiokateto@gmail.com">kaiokateto@gmail.com</a> ' +
    'e me diga o e-mail que você usou na compra.</p>';

  var sessao = new URLSearchParams(location.search).get('session_id');

  if (!sessao) {
    // Caso comum e legítimo: a pessoa salvou o endereço sem o código e
    // voltou meses depois. Não é erro dela, e o texto não a trata como
    // se fosse.
    aviso(
      'Falta o código da sua compra.',
      'Este endereço só entrega o arquivo quando vem acompanhado do código que o ' +
      'Stripe adiciona logo depois do pagamento. Abra o link que apareceu na tela ' +
      'da compra, ou o do recibo que o Stripe enviou por e-mail.',
      contato
    );
    return;
  }

  bloco('<p class="entrega-carregando">Confirmando o seu pagamento…</p>');

  fetch('/api/status?session_id=' + encodeURIComponent(sessao))
    .then(function (r) {
      return r.json().then(function (dados) { return { status: r.status, dados: dados }; });
    })
    .then(function (r) {
      if (r.status === 200 && r.dados.ok) {
        bloco(
          '<a class="baixar" href="/api/baixar?session_id=' +
            encodeURIComponent(sessao) + '">Baixar ' + r.dados.produto + ' ↓</a>'
        );
        return;
      }

      // 402: pagou agora e o Stripe ainda não fechou. Recarregar
      // resolve, e o texto diz isso em vez de mandar embora.
      if (r.status === 402) {
        aviso(
          'O pagamento ainda não consta.',
          'Alguns meios levam alguns instantes para confirmar. Recarregue esta página ' +
          'em um minuto. Se você pagou por boleto, a confirmação leva de um a três ' +
          'dias úteis — e nesse caso me escreva, que eu envio o arquivo à mão.',
          contato
        );
        return;
      }

      if (r.status === 404) {
        aviso(
          'Não encontrei essa compra.',
          'O código na barra de endereço não corresponde a nenhum pagamento. Ele pode ' +
          'ter sido copiado pela metade.',
          contato
        );
        return;
      }

      if (r.status === 503) {
        aviso(
          'A entrega está sendo configurada.',
          'Você pagou e o seu arquivo está garantido — o que falta é do meu lado.',
          contato
        );
        return;
      }

      aviso(
        'Não consegui liberar o download.',
        r.dados && r.dados.mensagem ? r.dados.mensagem :
          'Algo saiu do esperado ao conferir o pagamento.',
        contato
      );
    })
    .catch(function () {
      aviso(
        'Não consegui falar com o servidor.',
        'Pode ser a sua conexão. Recarregue a página; o seu acesso não se perde.',
        contato
      );
    });
})();
