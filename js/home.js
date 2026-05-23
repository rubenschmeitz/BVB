(() => {
    'use strict';

    const BVB = window.BVB || {};
    const onReady = BVB.onReady || ((callback) => document.addEventListener('DOMContentLoaded', callback));

    onReady(() => {
        initInstagramCarousel('ig-carousel', 'ig-prev', 'ig-next', '#ig-dots .ig-dot');
    });

    function initInstagramCarousel(carouselId, prevId, nextId, dotSelector) {
        const carousel = document.getElementById(carouselId);
        if (!carousel) return;

        const dots = document.querySelectorAll(dotSelector);
        const prev = document.getElementById(prevId);
        const next = document.getElementById(nextId);
        const slides = carousel.querySelectorAll('.ig-post-slide');
        if (!slides.length) return;

        let currentSlide = 0;

        const goTo = (index) => {
            currentSlide = (index + slides.length) % slides.length;
            const slideWidth = carousel.offsetWidth;
            carousel.scrollTo({ left: currentSlide * slideWidth, behavior: 'smooth' });
            dots.forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
        };

        if (prev) prev.addEventListener('click', () => goTo(currentSlide - 1));
        if (next) next.addEventListener('click', () => goTo(currentSlide + 1));

        carousel.addEventListener('scroll', () => {
            const slideWidth = carousel.offsetWidth;
            if (!slideWidth) return;

            const newIndex = Math.round(carousel.scrollLeft / slideWidth);
            if (newIndex === currentSlide) return;

            currentSlide = newIndex;
            dots.forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
        }, { passive: true });

        dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));
    }
})();
