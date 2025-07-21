document.addEventListener('DOMContentLoaded', () => {

    emailjs.init({
      publicKey: 'P9ostrZVqVC9oI3Q1',
    });

    const EMAILJS_PUBLIC_KEY = 'P9ostrZVqVC9oI3Q1';
    const EMAILJS_SERVICE_ID = 'service_7wvjkaa';
    const EMAILJS_TEMPLATE_ID = 'template_3p626pb';

  
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const navbar = document.querySelector('.navbar');

    hamburgerMenu.addEventListener('click', () => {
        navbar.classList.toggle('active');
    });

   
    document.querySelectorAll('.navbar a').forEach(link => {
        link.addEventListener('click', () => {
            if (navbar.classList.contains('active')) {
                navbar.classList.remove('active');
            }
        });
    });

    
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.navbar a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (pageYOffset >= sectionTop - 150) { 
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

    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1 
    });

    sections.forEach(section => {
        observer.observe(section);
    });

    
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
            emailError.textContent = 'Please enter a valid email address.';
            return false;
        }
        emailError.textContent = '';
        return true;
    }

    contactForm.addEventListener('submit', function(event) {
        event.preventDefault(); 

        
        formStatus.textContent = '';
        formStatus.className = 'form-status';

        
        const isNameValid = validateField(nameInput, nameError, 'The name field is required.');
        const isEmailFormatValid = validateEmail();
        const isMessageValid = validateField(messageInput, messageError, 'The message field is required.');

        if (!isNameValid || !isEmailFormatValid || !isMessageValid) {
            return; 
        }

        
        formStatus.textContent = 'Sending...';
        const submitButton = contactForm.querySelector('.btn-submit');
        submitButton.disabled = true;

        emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, this)
            .then(() => {
                formStatus.textContent = 'Message sent successfully!';
                formStatus.classList.add('success');    
                submitButton.disabled = false;
            }, (error) => {
                formStatus.textContent = 'Failed to send. Please try again later.';
                formStatus.classList.add('error');
                console.log('FAILED...', error);
                submitButton.disabled = false;
            });
    });
});