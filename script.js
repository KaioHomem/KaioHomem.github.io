/**
 * Kaio Felipe — Portfolio
 * script.js
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ===================================================
     EMAIL JS
     =================================================== */
  emailjs.init({ publicKey: 'P9ostrZVqVC9oI3Q1' });

  const EMAILJS_SERVICE_ID  = 'service_7wvjkaa';
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

  function validate() {
    let valid = true;

    if (!nameInput.value.trim()) {
      setError(nameError, 'Nome é obrigatório.');
      valid = false;
    } else {
      clearError(nameError);
    }

    if (!EMAIL_REGEX.test(emailInput.value.trim())) {
      setError(emailError, 'Digite um e-mail válido.');
      valid = false;
    } else {
      clearError(emailError);
    }

    if (!messageInput.value.trim()) {
      setError(msgError, 'Mensagem é obrigatória.');
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

    submitBtn.disabled       = true;
    submitBtn.textContent    = 'Enviando...';

    emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form)
      .then(() => {
        formStatus.textContent = '✓ Mensagem enviada com sucesso!';
        formStatus.classList.add('success');
        form.reset();
      })
      .catch(err => {
        formStatus.textContent = 'Erro ao enviar. Tente novamente ou me contate diretamente.';
        formStatus.classList.add('error');
        console.error('EmailJS error:', err);
      })
      .finally(() => {
        submitBtn.disabled    = false;
        submitBtn.innerHTML   = 'Enviar mensagem <i class="fa-solid fa-paper-plane"></i>';
      });
  });

});
