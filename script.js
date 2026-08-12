/**
 * Kaio Felipe — Portfolio
 * script.js
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ===================================================
     EMAIL JS
     =================================================== */
  // Guarded on purpose: this runs before the section-reveal observer below.
  // If the EmailJS CDN is blocked (ad blocker) or down, an uncaught error
  // here would abort the whole DOMContentLoaded handler — and every section
  // would stay at opacity 0, leaving the page blank below the hero.
  let emailjsPronto = false;
  try {
    emailjs.init({ publicKey: 'P9ostrZVqVC9oI3Q1' });
    emailjsPronto = true;
  } catch (e) {
    console.warn('EmailJS indisponível — o formulário de contato ficará desativado.');
  }

  const EMAILJS_SERVICE_ID  = 'service_wgl6b44';
  const EMAILJS_TEMPLATE_ID = 'template_3p626pb';


  /* ===================================================
     HAMBURGER MENU
     =================================================== */
  const hamburger = document.getElementById('hamburger');
  const navbar    = document.getElementById('navbar');

  hamburger.addEventListener('click', () => {
    const isOpen = navbar.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  // Close menu on nav link click
  navbar.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navbar.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });


  /* ===================================================
     ACTIVE NAV LINK ON SCROLL
     =================================================== */
  const sections  = document.querySelectorAll('section[id]');
  const navLinks  = navbar.querySelectorAll('a');

  function updateActiveLink() {
    const scrollY = window.scrollY;

    sections.forEach(section => {
      const top    = section.offsetTop - 80;
      const bottom = top + section.offsetHeight;

      if (scrollY >= top && scrollY < bottom) {
        const id = section.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });


  /* ===================================================
     SECTION REVEAL (IntersectionObserver)
     =================================================== */
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // animate once
        }
      });
    },
    { threshold: 0.08 }
  );

  document.querySelectorAll('.section').forEach(section => {
    observer.observe(section);
  });


  /* ===================================================
     CONTACT FORM
     =================================================== */
  const form         = document.getElementById('contact-form');
  const nameInput    = document.getElementById('from_name');
  const emailInput   = document.getElementById('from_email');
  const messageInput = document.getElementById('message');
  const nameError    = document.getElementById('name-error');
  const emailError   = document.getElementById('email-error');
  const msgError     = document.getElementById('message-error');
  const formStatus   = document.getElementById('form-status');
  const submitBtn    = document.getElementById('submit-btn');

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setError(errorEl, msg) {
    errorEl.textContent = msg;
  }

  function clearError(errorEl) {
    errorEl.textContent = '';
  }

  // i18n helpers — falls back to PT strings if translations.js not loaded
  const t = window.__t || {};
  const msg = {
    val_name:    t.val_name    || 'Nome é obrigatório.',
    val_email:   t.val_email   || 'Digite um e-mail válido.',
    val_msg:     t.val_msg     || 'Mensagem é obrigatória.',
    sending:     t.form_sending || 'Enviando...',
    success:     t.form_success || '✓ Mensagem enviada com sucesso!',
    error:       t.form_error   || 'Erro ao enviar. Tente novamente ou me contate diretamente.',
    submit_html: (t.form_submit || 'Enviar mensagem') + ' <i class="fa-solid fa-paper-plane"></i>',
  };

  function validate() {
    let valid = true;

    if (!nameInput.value.trim()) {
      setError(nameError, msg.val_name);
      valid = false;
    } else {
      clearError(nameError);
    }

    if (!EMAIL_REGEX.test(emailInput.value.trim())) {
      setError(emailError, msg.val_email);
      valid = false;
    } else {
      clearError(emailError);
    }

    if (!messageInput.value.trim()) {
      setError(msgError, msg.val_msg);
      valid = false;
    } else {
      clearError(msgError);
    }

    return valid;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();

    formStatus.textContent = '';
    formStatus.className   = 'form-status';

    if (!validate()) return;

    if (!emailjsPronto) {
      formStatus.textContent = msg.error;
      formStatus.classList.add('error');
      return;
    }

    submitBtn.disabled    = true;
    submitBtn.textContent = msg.sending;

    emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form)
      .then(() => {
        formStatus.textContent = msg.success;
        formStatus.classList.add('success');
        form.reset();
      })
      .catch(err => {
        formStatus.textContent = msg.error;
        formStatus.classList.add('error');
        console.error('EmailJS error:', err);
      })
      .finally(() => {
        submitBtn.disabled  = false;
        submitBtn.innerHTML = msg.submit_html;
      });
  });

});
