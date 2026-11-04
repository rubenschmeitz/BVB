(() => {
    'use strict';
    const init = () => {
        const dialog = document.getElementById('nbs-photo-dialog');
        const cards = [...document.querySelectorAll('.nbs-photo')];
        if (!dialog || !cards.length) return;
        const image = document.getElementById('nbs-photo-large');
        const caption = document.getElementById('nbs-photo-caption');
        const count = document.getElementById('nbs-photo-count');
        let index = 0;
        let opener;
        let previousOverflow;
        const display = (next) => {
            index = (next + cards.length) % cards.length;
            image.src = cards[index].dataset.full;
            image.alt = cards[index].querySelector('img').alt;
            caption.textContent = image.alt;
            count.textContent = `${index + 1} / ${cards.length}`;
        };
        cards.forEach((card, i) => card.addEventListener('click', () => {
            opener = card;
            display(i);
            previousOverflow = document.body.style.overflow;
            dialog.showModal();
            document.body.style.overflow = 'hidden';
        }));
        dialog.querySelector('[data-photo-close]').addEventListener('click', () => dialog.close());
        dialog.querySelector('[data-photo-prev]').addEventListener('click', () => display(index - 1));
        dialog.querySelector('[data-photo-next]').addEventListener('click', () => display(index + 1));
        dialog.addEventListener('close', () => {
            document.body.style.overflow = previousOverflow;
            opener?.focus({ preventScroll: true });
        });
        dialog.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                event.preventDefault();
                display(index + (event.key === 'ArrowRight' ? 1 : -1));
            }
        });
        dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
        let start;
        image.addEventListener('touchstart', event => { start = event.changedTouches[0].clientX; }, { passive: true });
        image.addEventListener('touchend', event => {
            const distance = event.changedTouches[0].clientX - start;
            if (Math.abs(distance) > 50) display(index + (distance < 0 ? 1 : -1));
        }, { passive: true });
        window.addEventListener('hashchange', () => { if (dialog.open) dialog.close(); });
    };
    document.addEventListener('DOMContentLoaded', init);
})();
