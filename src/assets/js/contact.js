(() => {
    'use strict';

    const BVB = window.BVB || {};
    const onReady = BVB.onReady || ((callback) => document.addEventListener('DOMContentLoaded', callback));

    onReady(() => {
        const contactForm = document.querySelector('.contact-form');
        const responseFrame = document.getElementById('contact-response-frame');
        const submitButton = contactForm?.querySelector('.submit-btn');
        const submissionIdInput = document.getElementById('submission-id');
        const parentOriginInput = document.getElementById('parent-origin');
        if (!contactForm || !responseFrame || !submitButton || !submissionIdInput || !parentOriginInput) return;

        const responseSource = contactForm.dataset.responseSource;
        const responseTimeout = Number(contactForm.dataset.responseTimeout);
        const allowedResponseOrigins = new Set(
            (contactForm.dataset.allowedResponseOrigins || '').split(',').filter(Boolean)
        );
        const originalButtonText = submitButton.textContent;
        let pendingSubmissionId = null;
        let responseTimer = null;

        const restoreForm = (message) => {
            pendingSubmissionId = null;
            clearTimeout(responseTimer);
            responseTimer = null;
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
            resetTurnstile();
            showFormStatus(contactForm, message);
        };

        window.addEventListener('message', (event) => {
            if (!pendingSubmissionId || event.source !== responseFrame.contentWindow) return;
            if (!allowedResponseOrigins.has(event.origin)) return;

            const response = event.data;
            if (
                !response ||
                response.source !== responseSource ||
                response.submissionId !== pendingSubmissionId ||
                !['success', 'error'].includes(response.status)
            ) {
                return;
            }

            clearTimeout(responseTimer);
            responseTimer = null;

            if (response.status === 'success') {
                pendingSubmissionId = null;
                showFeedback(contactForm, true, response.message || 'Bericht verzonden! Bedankt voor je bericht.');
                return;
            }

            restoreForm(response.message || 'Er is iets misgegaan. Probeer het opnieuw of mail ons direct.');
        });

        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();
            if (pendingSubmissionId) return;
            clearFormStatus(contactForm);

            if (!contactForm.checkValidity()) {
                contactForm.reportValidity();
                return;
            }

            const turnstileWidget = contactForm.querySelector('.cf-turnstile');
            const turnstileSiteKey = turnstileWidget?.getAttribute('data-sitekey') || '';
            if (turnstileWidget && (!turnstileSiteKey || turnstileSiteKey === 'PASTE_TURNSTILE_SITE_KEY_HERE')) {
                showFormStatus(contactForm, 'Het contactformulier moet nog met de Turnstile site key worden ingesteld.');
                return;
            }

            const formData = new FormData(contactForm);
            if (turnstileWidget && !formData.get('cf-turnstile-response')) {
                showFormStatus(contactForm, 'Vink de beveiligingscontrole aan en probeer het opnieuw.');
                return;
            }

            pendingSubmissionId = createSubmissionId();
            submissionIdInput.value = pendingSubmissionId;
            parentOriginInput.value = window.location.origin;
            submitButton.disabled = true;
            submitButton.textContent = 'Verzenden...';
            showFormStatus(
                contactForm,
                contactForm.dataset.pendingMessage || 'Je bericht wordt veilig verstuurd…'
            );

            responseTimer = window.setTimeout(() => {
                restoreForm(
                    contactForm.dataset.timeoutMessage ||
                    'We kregen nog geen bevestiging. Probeer het opnieuw of mail ons direct.'
                );
            }, Number.isFinite(responseTimeout) ? responseTimeout : 15000);

            HTMLFormElement.prototype.submit.call(contactForm);
        });
    });

    function createSubmissionId() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            return window.crypto.randomUUID();
        }
        return `bvb-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    }

    function showFormStatus(contactForm, message) {
        let status = contactForm.querySelector('.form-status');
        if (!status) {
            status = document.createElement('p');
            status.className = 'form-status';
            status.setAttribute('role', 'status');
            status.setAttribute('aria-live', 'polite');
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

        window.setTimeout(() => {
            const feedback = document.createElement('div');
            feedback.className = 'form-feedback';

            const icon = document.createElement('div');
            icon.className = `form-feedback-icon ${isSuccess ? 'success' : 'error'}`;
            icon.innerHTML = isSuccess
                ? '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
                : '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';

            const title = document.createElement('h3');
            title.className = 'form-feedback-title';
            title.textContent = isSuccess ? 'Bedankt!' : 'Oeps!';

            const text = document.createElement('p');
            text.className = 'form-feedback-text';
            text.textContent = message;

            const action = document.createElement('button');
            action.type = 'button';
            action.className = 'form-feedback-action';
            action.textContent = isSuccess ? 'Nieuw bericht' : 'Opnieuw proberen';
            action.addEventListener('click', () => window.location.reload());

            feedback.append(icon, title, text, action);
            contactForm.replaceChildren(feedback);
            contactForm.style.opacity = '1';
        }, 400);
    }
})();
