(() => {
    'use strict';

    const BVB = window.BVB || {};
    const onReady = BVB.onReady || ((callback) => document.addEventListener('DOMContentLoaded', callback));

    onReady(() => {
        const contactForm = document.querySelector('.contact-form');
        const submitBtn = contactForm ? contactForm.querySelector('.submit-btn') : null;
        if (!contactForm || !submitBtn) return;

        const contactEmail = getContactEmail(contactForm);

        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();

            if (!contactForm.checkValidity()) {
                contactForm.reportValidity();
                return;
            }

            const honeypot = contactForm.querySelector('input[name="website"]');
            if (honeypot && honeypot.value) {
                showFeedback(contactForm, true, 'Bericht verzonden!');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerText = 'Verzenden...';

            const formData = new FormData(contactForm);
            const subject = formData.get('subject') || 'Contactformulier';
            const mailSubject = `Contactformulier: ${subject}`;
            const mailBody = [
                `Naam: ${formData.get('name') || ''}`,
                `E-mail: ${formData.get('email') || ''}`,
                `Onderwerp: ${subject}`,
                '',
                'Bericht:',
                formData.get('message') || ''
            ].join('\n');

            window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
            showFeedback(contactForm, true, 'Als je e-mailprogramma opent, staat het bericht klaar. Verstuur het daar om het echt te verzenden.');
        });
    });

    function getContactEmail(form) {
        const action = form.getAttribute('action') || '';
        if (action.toLowerCase().startsWith('mailto:')) {
            return action.slice('mailto:'.length).split('?')[0];
        }
        return 'info@bonsai-brabant.nl';
    }

    function showFeedback(contactForm, isSuccess, message) {
        contactForm.style.transition = 'opacity 0.4s ease';
        contactForm.style.opacity = '0';

        setTimeout(() => {
            const icon = isSuccess
                ? '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
                : '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';

            contactForm.innerHTML = `
                <div class="form-feedback">
                    <div class="form-feedback-icon ${isSuccess ? 'success' : 'error'}">
                        ${icon}
                    </div>
                    <h3 class="form-feedback-title">${isSuccess ? 'Bedankt!' : 'Oeps!'}</h3>
                    <p class="form-feedback-text">${message}</p>
                    <button id="cf-reload-btn" type="button" class="form-feedback-action">${isSuccess ? 'Nieuw bericht' : 'Opnieuw proberen'}</button>
                </div>
            `;

            contactForm.style.opacity = '1';
            const reloadBtn = document.getElementById('cf-reload-btn');
            if (reloadBtn) reloadBtn.addEventListener('click', () => location.reload());
        }, 400);
    }
})();
