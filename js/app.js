/**
 * BVB Website - Consolidated App Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Toggle
    const mobileToggle = document.getElementById('mobile-toggle');
    const mainNav = document.getElementById('main-nav');

    if (mobileToggle && mainNav) {
        mobileToggle.addEventListener('click', () => {
            const isActive = mobileToggle.classList.toggle('active');
            mainNav.classList.toggle('active');
            mobileToggle.setAttribute('aria-expanded', isActive);
        });
    }

    // 2. Scroll Reveal Observer
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                revealObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal-on-scroll').forEach(el => {
        revealObserver.observe(el);
    });

    // 3. Lazy Image Loading Enhancement & Skeleton Removal
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    lazyImages.forEach(img => {
        const handleLoad = () => {
            img.classList.add('loaded');
            // If the parent is a skeleton, mark it as loaded too
            if (img.parentElement && img.parentElement.classList.contains('skeleton')) {
                img.parentElement.classList.add('loaded');
            }
        };

        img.addEventListener('load', handleLoad);
        if (img.complete) handleLoad();
    });

    // 4. Header & Back-to-Top Scroll Effect
    const header = document.querySelector('.site-header');
    const backToTop = document.getElementById('back-to-top');

    window.addEventListener('scroll', () => {
        const scrollPos = window.scrollY;

        // Header
        if (header) {
            if (scrollPos > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }

        // Back to top visibility
        if (backToTop) {
            if (scrollPos > 400) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        }
    });

    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 5. Calendar Library Safety (Mobile Return)
    // Ensure the site remains interactive after returning from a calendar app
    window.addEventListener('focus', () => {
        document.body.classList.remove('atcb-modal-open');
    });
});

/**
 * Helper to initialize a simple slideshow
 */
function initSimpleSlideshow(containerId, interval = 5000) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const slides = container.querySelectorAll('.slide');
    if (slides.length <= 1) return;

    let currentSlide = 0;

    // Preload first two slides
    [0, 1].forEach(idx => {
        const s = slides[idx];
        if (s && s.dataset.src) {
            s.style.backgroundImage = `url('${s.dataset.src}')`;
        }
    });

    setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        
        const activeSlide = slides[currentSlide];
        if (activeSlide.dataset.src && !activeSlide.style.backgroundImage) {
            activeSlide.style.backgroundImage = `url('${activeSlide.dataset.src}')`;
        }
        
        // Pre-load next
        const nextIdx = (currentSlide + 1) % slides.length;
        const nextSlide = slides[nextIdx];
        if (nextSlide.dataset.src && !nextSlide.style.backgroundImage) {
            nextSlide.style.backgroundImage = `url('${nextSlide.dataset.src}')`;
        }

        activeSlide.classList.add('active');
    }, interval);
}

/**
 * Helper to initialize Instagram-style carousel
 */
function initIGCarousel(carouselId, prevId, nextId, dotClass) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;

    const dots = document.querySelectorAll(dotClass);
    const prev = document.getElementById(prevId);
    const next = document.getElementById(nextId);
    const slides = carousel.querySelectorAll('.ig-post-slide');
    let currentSlide = 0;

    const goTo = (index) => {
        currentSlide = (index + slides.length) % slides.length;
        const slideWidth = carousel.offsetWidth;
        carousel.scrollTo({ left: currentSlide * slideWidth, behavior: 'smooth' });
        dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
    };

    if (prev) prev.addEventListener('click', () => goTo(currentSlide - 1));
    if (next) next.addEventListener('click', () => goTo(currentSlide + 1));

    carousel.addEventListener('scroll', () => {
        const slideWidth = carousel.offsetWidth;
        const newIndex = Math.round(carousel.scrollLeft / slideWidth);
        if (newIndex !== currentSlide) {
            currentSlide = newIndex;
            dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
        }
    });

    dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));
}

/**
 * Helper to show gallery category
 */
function showCategory(categoryId) {
    document.querySelectorAll('.gallery-category').forEach(cat => {
        cat.classList.remove('active');
    });
    document.querySelectorAll('.gallery-nav button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const section = document.getElementById(categoryId + '-section');
    if (section) section.classList.add('active');
    
    // The button highlight is handled by the onclick in HTML for now, 
    // or we can find it here:
    const clickedBtn = Array.from(document.querySelectorAll('.gallery-nav button')).find(b => b.getAttribute('onclick')?.includes(categoryId));
    if (clickedBtn) clickedBtn.classList.add('active');
}

/**
 * Toggle tree details on click (Exhibition Gallery)
 */
function toggleTree(card) {
    document.querySelectorAll('.exhibition-card').forEach(c => {
        if (c !== card) c.classList.remove('active');
    });
    card.classList.toggle('active');
}

/**
 * Lightbox initialization
 */
function initLightbox(lightboxId, imgId, captionId, closeClass, itemClass) {
    const lightbox = document.getElementById(lightboxId);
    const lightboxImg = document.getElementById(imgId);
    const lightboxCaption = document.getElementById(captionId);
    const lightboxClose = document.querySelector('.' + closeClass);

    if (!lightbox || !lightboxImg) return;

    document.querySelectorAll('.' + itemClass).forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            const fullSrc = item.getAttribute('data-full') || img.src;
            lightboxImg.src = fullSrc;
            if (lightboxCaption) lightboxCaption.textContent = img.alt || "BVB Clubavond";
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    const closeLightbox = () => {
        lightbox.classList.remove('active');
        document.body.style.overflow = 'auto';
    };

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target === lightboxClose) {
            closeLightbox();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });
}

// Close tree nameplate when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.exhibition-card')) {
        document.querySelectorAll('.exhibition-card').forEach(c => c.classList.remove('active'));
    }
});

