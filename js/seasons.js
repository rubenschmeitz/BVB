/**
 * BVB Logo Init
 * Ensures the standard logo is always shown.
 */
document.addEventListener('DOMContentLoaded', () => {
    const logo = document.querySelector('.main-logo');
    if (logo) {
        logo.src = 'images/logo_main.png';
    }
});


