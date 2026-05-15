/**
 * BVB Website - Consolidated App Logic
 */

// Global function to (re)initialize reveal observers
let initRevealObservers;

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

    // 2. Scroll Reveal Observer - Refined for performance
    const observerOptions = {
        threshold: 0.05,
        rootMargin: '0px 0px 50px 0px' // Reveal slightly before entering
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                revealObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Specialized observer for horizontal containers
    const horizontalObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                horizontalObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 100px 0px 100px' });

    initRevealObservers = () => {
        document.querySelectorAll('.reveal-on-scroll:not(.active)').forEach(el => {
            // Horizontal check
            if (el.closest('.exhibition-container')) {
                horizontalObserver.observe(el);
            } else {
                revealObserver.observe(el);
            }
        });
    };

    initRevealObservers();

    // 3. Lazy Image Loading Enhancement & Skeleton Removal
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    lazyImages.forEach(img => {
        const handleLoad = () => {
            img.classList.add('loaded');
            if (img.parentElement && img.parentElement.classList.contains('skeleton')) {
                img.parentElement.classList.add('loaded');
                // Optional: remove skeleton class after fade
                setTimeout(() => img.parentElement.classList.remove('skeleton'), 600);
            }
        };

        img.addEventListener('load', handleLoad);
        if (img.complete) handleLoad();
        
        // Safety timeout to remove skeletons if loading fails or is too slow
        setTimeout(() => {
            if (img.parentElement && img.parentElement.classList.contains('skeleton') && !img.parentElement.classList.contains('loaded')) {
                handleLoad();
            }
        }, 2500);
    });

    // 4. Header & Back-to-Top Scroll Effect (Throttled)
    const header = document.querySelector('.site-header');
    const backToTop = document.getElementById('back-to-top');
    let isScrolling = false;
    const scrollHandler = () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                const scrollPos = window.scrollY;

                if (header) {
                    header.classList.toggle('scrolled', scrollPos > 50);
                }

                if (backToTop) {
                    backToTop.classList.toggle('visible', scrollPos > 400);
                }
                isScrolling = false;
            });
            isScrolling = true;
        }
    };

    window.addEventListener('scroll', scrollHandler, { passive: true });

    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 5. Calendar Library Safety
    window.addEventListener('focus', () => {
        document.body.classList.remove('atcb-modal-open');
    });

    // 6. Init Instagram Carousel
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
                showFeedback(false, "Er is iets misgegaan. Probeer het later opnieuw.");
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
            
            contactForm.innerHTML = `
                <div style="text-align: center; padding: 2rem 0;">
                    <div style="width: 80px; height: 80px; background: ${isSuccess ? 'var(--color-sage)' : '#d9534f'}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
                        ${icon}
                    </div>
                    <h3 style="color: var(--color-bark); margin-bottom: 1rem;">${isSuccess ? 'Bedankt!' : 'Oeps!'}</h3>
                    <p style="color: var(--color-charcoal); line-height: 1.6;">${message}</p>
                    <button id="cf-reload-btn" type="button" style="margin-top: 2rem; background: transparent; border: 1px solid var(--color-bark); color: var(--color-bark); padding: 0.8rem 1.5rem; border-radius: 50px; cursor: pointer; font-weight: 600;">${isSuccess ? 'Nieuw bericht' : 'Opnieuw proberen'}</button>
                </div>
            `;
            contactForm.style.opacity = '1';
            const reloadBtn = document.getElementById('cf-reload-btn');
            if (reloadBtn) reloadBtn.addEventListener('click', () => location.reload());
        }, 400);
    }

    // 8. Initialize Lightbox (Moved here to ensure function is defined)
    if (document.getElementById('lightbox')) {
        initLightbox('lightbox', 'lightbox-img', 'lightbox-caption', 'lightbox-close', 'activity-item');
    }
});

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
    }, { passive: true });

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
        // Re-init reveal observers for the newly visible section
        if (typeof initRevealObservers === 'function') initRevealObservers();
        
        // Force reveal first items for snappiness
        setTimeout(() => {
            section.querySelectorAll('.reveal-on-scroll').forEach((el, i) => {
                if (i < 6) el.classList.add('active');
            });
        }, 100);
    }
    
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
        lightbox.classList.add('tokonoma-mode');
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

        // Dynamically place the tree so its bottom lands on the tokonoma wooden floor.
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const scaledImgH = (vw >= vh) ? vw : vh; 

        // Vertical offset of the image top relative to viewport top
        const imgTop = (vh - scaledImgH) / 2;

        // Floor top edge is at ~73% of the scaled image height from the image top
        const floorTopPx = imgTop + (scaledImgH * 0.73);

        // Distance from the BOTTOM of the viewport up to the floor
        const floorFromBottom = vh - floorTopPx;

        // Apply as absolute bottom position. 
        // Compensation: tree images have significant transparent padding at the bottom.
        // Increasing to ~15.5% based on verification tests.
        const compensation = scaledImgH * 0.155;
        const finalBottom = floorFromBottom - compensation;

        lightboxImg.style.setProperty('bottom', finalBottom + 'px', 'important');
        lightbox.style.paddingBottom = '0';
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
        lightbox.classList.remove('tokonoma-mode');
        // Reset inline styles
        lightbox.style.paddingBottom = '';
        lightbox.style.display = '';
        lightbox.style.position = '';
        lightboxImg.style.bottom = '';
        document.body.style.overflow = 'auto';
    };

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    
    // Close on background click
    lightbox.addEventListener('click', (e) => {
        // If the user clicks on the backdrop itself (not the children)
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('active')) {
            if (e.key === 'Escape') {
                closeLightbox();
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                // Future enhancement: navigation between images
            }
        }
    });
}

