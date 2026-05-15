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

    // 1b. Full Screen Menu Logic
    const fsMenuTrigger = document.getElementById('fs-menu-trigger');
    const fsMenu = document.getElementById('full-screen-menu');
    const fsMenuClose = document.getElementById('fs-menu-close');

    if (fsMenuTrigger && fsMenu) {
        fsMenuTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            fsMenu.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (fsMenuClose && fsMenu) {
        fsMenuClose.addEventListener('click', () => {
            fsMenu.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }

    // Close FS menu on link click
    document.querySelectorAll('.fs-menu-links a').forEach(link => {
        link.addEventListener('click', () => {
            fsMenu.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    });

    // 1c. Bottom Nav Active State Sync
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
        const href = item.getAttribute('href');
        if (href === currentPath) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

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

    // 6. Init Instagram Carousel (if present)
    initIGCarousel('ig-carousel', 'ig-prev', 'ig-next', '.ig-dot');

    // 7. Contact Form Handling
    const contactForm = document.querySelector('.contact-form');
    const submitBtn = contactForm ? contactForm.querySelector('.submit-btn') : null;
    
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz4yuS1qGTa4AqVABmqRfnDE45LU-8HlpGCU97fnQ9ZuanJmXI6YZtQ0_E49b5txMz9/exec';

    if (contactForm && submitBtn) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            if (!contactForm.checkValidity()) {
                contactForm.reportValidity();
                return;
            }

            const honeypot = contactForm.querySelector('input[name="website"]').value;
            if (honeypot) {
                console.log("Spam detected!");
                showFeedback(true, "Bericht verzonden!"); 
                return;
            }

            submitBtn.disabled = true;
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = 'Verzenden...';

            const formData = new FormData(contactForm);
            const params = new URLSearchParams();
            for (const pair of formData) {
                params.append(pair[0], pair[1]);
            }

            fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', 
                body: params
            })
            .then(() => {
                showFeedback(true, "Bericht verzonden! Bedankt voor je bericht.");
            })
            .catch(error => {
                console.error('Error:', error);
                showFeedback(false, "Er is iets misgegaan. Probeer het later opnieuw of mail ons direct.");
                submitBtn.disabled = false;
                submitBtn.innerText = originalBtnText;
            });
        });
    }

    function showFeedback(isSuccess, message) {
        if (!contactForm) return;
        contactForm.style.transition = 'opacity 0.4s ease';
        contactForm.style.opacity = '0';
        
        setTimeout(() => {
            const icon = isSuccess 
                ? '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
                : '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
            
            const bgColor = isSuccess ? 'var(--color-sage)' : '#d9534f';
            const btnText = isSuccess ? 'Nieuw bericht' : 'Opnieuw proberen';

            contactForm.innerHTML = `
                <div style="text-align: center; padding: 2rem 0;">
                    <div style="width: 80px; height: 80px; background: ${bgColor}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
                        ${icon}
                    </div>
                    <h3 style="color: var(--color-bark); margin-bottom: 1rem;">${isSuccess ? 'Bedankt!' : 'Oeps!'}</h3>
                    <p style="color: var(--color-charcoal); line-height: 1.6;">${message}</p>
                    <button id="cf-reload-btn" type="button" style="margin-top: 2rem; background: transparent; border: 1px solid var(--color-bark); color: var(--color-bark); padding: 0.8rem 1.5rem; border-radius: 50px; cursor: pointer; font-weight: 600;">${btnText}</button>
                </div>
            `;
            contactForm.style.opacity = '1';
            
            const reloadBtn = document.getElementById('cf-reload-btn');
            if (reloadBtn) {
                reloadBtn.addEventListener('click', () => location.reload());
            }
        }, 400);
    }
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
    if (section) {
        section.classList.add('active');
        // Trigger reveal animations immediately for items in the newly visible section
        setTimeout(() => {
            section.querySelectorAll('.reveal-on-scroll, .reveal-staggered').forEach(el => {
                el.classList.add('active');
            });
        }, 50);
    }
    
    // The button highlight is handled by the onclick in HTML for now, 
    // or we can find it here:
    const clickedBtn = Array.from(document.querySelectorAll('.gallery-nav button')).find(b => b.getAttribute('onclick')?.includes(categoryId));
    if (clickedBtn) clickedBtn.classList.add('active');
}

/**
 * Toggle tree details on click (Exhibition Gallery)
 */
function toggleTree(card) {
    const img = card.querySelector('img');
    const species = card.querySelector('.exhibition-species').textContent;
    const style = card.querySelector('.exhibition-style').textContent;
    
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    
    if (lightbox && lightboxImg) {
        lightbox.classList.add('tokonoma-mode'); // Enable Tokonoma effect
        lightboxImg.src = img.src;
        if (lightboxCaption) {
            lightboxCaption.innerHTML = `
                <div style="padding: 0 20px;">
                    <span style="display:block; font-weight:700; font-size:1.5rem; margin-bottom: 5px; color: white;">${species}</span>
                    <span style="display:block; font-size:0.85rem; opacity:0.8; text-transform:uppercase; letter-spacing:2px; color: var(--color-sand);">${style}</span>
                </div>
            `;
        }
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
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
        lightbox.classList.remove('tokonoma-mode'); // Reset mode
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

