document.addEventListener('DOMContentLoaded', () => {

    emailjs.init({
  publicKey: 'P9ostrZVqVC9oI3Q1',
});
    // --- CONFIGURAÇÃO DO EMAILJS ---
    // Substitua com suas chaves do EmailJS.
    // Vá para o seu painel do EmailJS -> Account -> API Keys para encontrar sua Public Key.
    // Service ID e Template ID estão nas seções de Email Services e Email Templates, respectivamente.
    const EMAILJS_PUBLIC_KEY = 'P9ostrZVqVC9oI3Q1';
    const EMAILJS_SERVICE_ID = 'service_7wvjkaa';
    const EMAILJS_TEMPLATE_ID = 'template_3p626pb';

    // --- MENU HAMBÚRGUER (MOBILE) ---
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const navbar = document.querySelector('.navbar');

    hamburgerMenu.addEventListener('click', () => {
        navbar.classList.toggle('active');
    });

    // Fecha o menu mobile ao clicar em um link
    document.querySelectorAll('.navbar a').forEach(link => {
        link.addEventListener('click', () => {
            if (navbar.classList.contains('active')) {
                navbar.classList.remove('active');
            }
        });
    });

    // --- NAVEGAÇÃO ATIVA E SCROLL SUAVE ---
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.navbar a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (pageYOffset >= sectionTop - 150) { // O valor 150 é um offset para ajustar a ativação
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

    // --- ANIMAÇÃO DE FADE-IN AO ROLAR A PÁGINA ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1 // A seção se torna visível quando 10% dela está na tela
    });

    sections.forEach(section => {
        observer.observe(section);
    });

    // --- VALIDAÇÃO E ENVIO DO FORMULÁRIO DE CONTATO ---
    const contactForm = document.getElementById('contact-form');
    const nameInput = document.getElementById('from_name');
    const emailInput = document.getElementById('from_email');
    const messageInput = document.getElementById('message');
    
    const nameError = document.getElementById('name-error');
    const emailError = document.getElementById('email-error');
    const messageError = document.getElementById('message-error');
    const formStatus = document.getElementById('form-status');

    function validateField(input, errorElement, message) {
        if (input.value.trim() === '') {
            errorElement.textContent = message;
            return false;
        }
        errorElement.textContent = '';
        return true;
    }

    function validateEmail() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value.trim())) {
            emailError.textContent = 'Por favor, insira um e-mail válido.';
            return false;
        }
        emailError.textContent = '';
        return true;
    }

    contactForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Impede o envio padrão do formulário

        // Limpa mensagens de status anteriores
        formStatus.textContent = '';
        formStatus.className = 'form-status';

        // Executa a validação
        const isNameValid = validateField(nameInput, nameError, 'O campo nome é obrigatório.');
        const isEmailFormatValid = validateEmail();
        const isMessageValid = validateField(messageInput, messageError, 'O campo mensagem é obrigatório.');

        if (!isNameValid || !isEmailFormatValid || !isMessageValid) {
            return; // Interrompe se a validação falhar
        }

        // Se a validação passar, mostra status de envio e envia o e-mail
        formStatus.textContent = 'Enviando...';
        const submitButton = contactForm.querySelector('.btn-submit');
        submitButton.disabled = true;

        emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, this)
            .then(() => {
                formStatus.textContent = 'Mensagem enviada com sucesso!';
                formStatus.classList.add('success');
                contactForm.reset(); // Limpa o formulário
                submitButton.disabled = false;
            }, (error) => {
                formStatus.textContent = 'Falha ao enviar. Tente novamente mais tarde.';
                formStatus.classList.add('error');
                console.log('FAILED...', error);
                submitButton.disabled = false;
            });
    });
});
