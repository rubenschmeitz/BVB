(() => {
    'use strict';

    const BVB = window.BVB || {};
    const onReady = BVB.onReady || ((callback) => document.addEventListener('DOMContentLoaded', callback));

    onReady(() => {
        const contactForm = document.querySelector('.contact-form');
        const submitBtn = contactForm ? contactForm.querySelector('.submit-btn') : null;
        if (!contactForm || !submitBtn) return;

        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();
            clearFormStatus(contactForm);

            if (!contactForm.checkValidity()) {
                contactForm.reportValidity();
                return;
            }

            const honeypot = contactForm.querySelector('input[name="website"]');
            if (honeypot && honeypot.value) {
                showFeedback(contactForm, true, 'Bericht verzonden!');
                return;
            }

            const turnstileWidget = contactForm.querySelector('.cf-turnstile');
            const turnstileSiteKey = turnstileWidget ? turnstileWidget.getAttribute('data-sitekey') || '' : '';
            if (turnstileWidget && (!turnstileSiteKey || turnstileSiteKey === 'PASTE_TURNSTILE_SITE_KEY_HERE')) {
                showFormStatus(contactForm, 'Het contactformulier moet nog met de Turnstile site key worden ingesteld.');
                return;
            }

            submitBtn.disabled = true;
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = 'Verzenden...';

            const formData = new FormData(contactForm);
            const turnstileToken = formData.get('cf-turnstile-response');
            if (turnstileWidget && !turnstileToken) {
                submitBtn.disabled = false;
                submitBtn.innerText = originalBtnText;
                showFormStatus(contactForm, 'Vink de beveiligingscontrole aan en probeer het opnieuw.');
                return;
            }

            const params = new URLSearchParams();

            formData.forEach((value, key) => {
                params.append(key, value);
            });

            fetch(contactForm.action, {
                method: 'POST',
                mode: 'no-cors',
                body: params
            })
                .then(() => {
                    showFeedback(contactForm, true, 'Bericht verzonden! Bedankt voor je bericht.');
                })
                .catch((error) => {
                    console.error('Contact form error:', error);
                    submitBtn.disabled = false;
                    submitBtn.innerText = originalBtnText;
                    resetTurnstile();
                    showFeedback(contactForm, false, 'Er is iets misgegaan. Probeer het later opnieuw of mail ons direct.');
                });
        });
    });

    function showFormStatus(contactForm, message) {
        let status = contactForm.querySelector('.form-status');
        if (!status) {
            status = document.createElement('p');
            status.className = 'form-status';
            status.setAttribute('role', 'alert');
            const submitArea = contactForm.querySelector('.form-submit');
            contactForm.insertBefore(status, submitArea || null);
        }
        status.textContent = message;
    }

    function clearFormStatus(contactForm) {
        const status = contactForm.querySelector('.form-status');
        if (status) status.remove();
    }

    function resetTurnstile() {
        if (window.turnstile && typeof window.turnstile.reset === 'function') {
            window.turnstile.reset();
        }
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
