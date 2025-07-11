document.addEventListener('DOMContentLoaded', () => {

    emailjs.init({
      publicKey: 'P9ostrZVqVC9oI3Q1',
    });
    // --- EMAILJS SETUP ---
    // Replace with your EmailJS keys.
    // Go to your EmailJS dashboard -> Account -> API Keys to find your Public Key.
    // Service ID and Template ID are in the Email Services and Email Templates sections, respectively.
    const EMAILJS_PUBLIC_KEY = 'P9ostrZVqVC9oI3Q1';
    const EMAILJS_SERVICE_ID = 'service_7wvjkaa';
    const EMAILJS_TEMPLATE_ID = 'template_3p626pb';

    // --- HAMBURGER MENU (MOBILE) ---
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const navbar = document.querySelector('.navbar');

    hamburgerMenu.addEventListener('click', () => {
        navbar.classList.toggle('active');
    });

    // Close the mobile menu when a link is clicked
    document.querySelectorAll('.navbar a').forEach(link => {
        link.addEventListener('click', () => {
            if (navbar.classList.contains('active')) {
                navbar.classList.remove('active');
            }
        });
    });

    // --- ACTIVE NAVIGATION & SMOOTH SCROLL ---
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.navbar a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (pageYOffset >= sectionTop - 150) { // The value 150 is an offset to adjust activation
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

    // --- FADE-IN ANIMATION ON SCROLL ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1 // The section becomes visible when 10% of it is on screen
    });

    sections.forEach(section => {
        observer.observe(section);
    });

    // --- CONTACT FORM VALIDATION & SUBMISSION ---
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
        event.preventDefault(); // Prevents the default form submission

        // Clears previous status messages
        formStatus.textContent = '';
        formStatus.className = 'form-status';

        // Runs validation
        const isNameValid = validateField(nameInput, nameError, 'The name field is required.');
        const isEmailFormatValid = validateEmail();
        const isMessageValid = validateField(messageInput, messageError, 'The message field is required.');

        if (!isNameValid || !isEmailFormatValid || !isMessageValid) {
            return; // Stops if validation fails
        }

        // If validation passes, show sending status and send the email
        formStatus.textContent = 'Sending...';
        const submitButton = contactForm.querySelector('.btn-submit');
        submitButton.disabled = true;

        emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, this)
            .then(() => {
                formStatus.textContent = 'Message sent successfully!';
                formStatus.classList.add('success');
                contactForm.reset(); // Clears the form
                submitButton.disabled = false;
            }, (error) => {
                formStatus.textContent = 'Failed to send. Please try again later.';
                formStatus.classList.add('error');
                console.log('FAILED...', error);
                submitButton.disabled = false;
            });
    });
});