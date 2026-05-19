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
    document.querySelectorAll('.fs-menu-links a:not(.fs-menu-trigger)').forEach(link => {
        link.addEventListener('click', () => {
            fsMenu.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    });

    // 1d. Full Screen Menu Dropdown Toggle (Mobile)
    const fsDropdownTrigger = document.querySelector('.fs-menu-trigger');
    const fsDropdown = document.querySelector('.fs-menu-dropdown');
    if (fsDropdownTrigger && fsDropdown) {
        fsDropdownTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            const isExpanded = fsDropdown.classList.toggle('expanded');
            fsDropdownTrigger.setAttribute('aria-expanded', isExpanded);
        });
    }

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

    // 6. Init Social Carousels
    initIGCarousel('ig-carousel', 'ig-prev', 'ig-next', '#ig-dots .ig-dot');

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

            // Turnstile Validation Check (only if a real Site Key is configured)
            const turnstileContainer = contactForm.querySelector('.cf-turnstile');
            const siteKey = turnstileContainer ? turnstileContainer.getAttribute('data-sitekey') : '';
            const isRealSiteKey = siteKey && siteKey !== 'YOUR_TURNSTILE_SITE_KEY';
            
            if (isRealSiteKey) {
                const turnstileResponse = contactForm.querySelector('[name="cf-turnstile-response"]')?.value;
                if (!turnstileResponse) {
                    showFeedback(false, "Mislukt: Voltooi a.u.b. de beveiligingscontrole.");
                    return;
                }
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

    // 9. Flyer Share Functionality
    const shareFlyerBtn = document.getElementById('share-flyer-btn');
    if (shareFlyerBtn) {
        shareFlyerBtn.addEventListener('click', () => {
            const shareData = {
                title: 'NBS 2026 - Nationale Bonsai Show',
                text: 'Kom je ook naar de Nationale Bonsai Show 2026? Bekijk de flyer en het programma!',
                url: window.location.href
            };

            if (navigator.share) {
                navigator.share(shareData).catch(err => console.log('Error sharing:', err));
            } else {
                // Fallback: WhatsApp share
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`;
                window.open(whatsappUrl, '_blank');
            }
        });
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

// Active elements tracking for slide navigation in lightbox
let currentActiveCard = null;
let currentActiveActivityItem = null;

/**
 * Toggle tree details on click (Exhibition Gallery)
 */
function toggleTree(card) {
    currentActiveCard = card;
    currentActiveActivityItem = null; // Reset normal gallery tracker
    const img = card.querySelector('img');
    const species = card.querySelector('.exhibition-species').textContent;
    const style = card.querySelector('.exhibition-style').textContent;

    const lightbox = document.getElementById('lightbox');
    const tokonomaFrame = document.getElementById('tokonoma-frame');
    const tokonomaImg = document.getElementById('tokonoma-img');
    const lightboxCaption = document.getElementById('lightbox-caption');

    if (lightbox && tokonomaFrame && tokonomaImg) {
        lightbox.classList.add('tokonoma-mode');
        tokonomaImg.src = img.src;

        // 1. Extract filename for metadata lookup
        const filename = img.src.substring(img.src.lastIndexOf('/') + 1);

        // 2. High-precision Horticultural Scale & Grounding offsets
        // Elke boom heeft een op maat gemaakte schaalfactor (schaal) om zijn werkelijke verhoudingen (Shohin t/m Omono) te representeren.
        // We berekenen de exacte schaal op basis van de geschatte werkelijke hoogte in centimeters: schaal = hoogte / 48.0.
        // We passen ook een bottom-offset toe om eventuele schaduwranden of cascade-takken perfect te corrigeren op de houten vloer.
        const treeMetadata = {
            'carpinus_betulus.webp': { realHeightCm: 44, bottomOffset: 0, scale: 0.92 },
            'wisteria_sinensis.webp': { realHeightCm: 55, bottomOffset: 0, scale: 1.15 },
            'acer_palmatum_rood.webp': { realHeightCm: 50, bottomOffset: 0, scale: 1.04 },
            'juniperus_chinensis_rots.webp': { realHeightCm: 38, bottomOffset: 0, scale: 0.79 },
            'acer_palmatum_groen_klein.webp': { realHeightCm: 50, bottomOffset: 0, scale: 1.04 },
            'larix_kaempferi.webp': { realHeightCm: 45, bottomOffset: 0, scale: 0.94 },
            'juniperus_itoigawa_shohin.webp': { realHeightCm: 32, bottomOffset: 0, scale: 0.67 },
            'larix_kaempferi_kaal.webp': { realHeightCm: 46, bottomOffset: 0, scale: 0.96 },
            'pinus_sylvestris.webp': { realHeightCm: 64, bottomOffset: 0, scale: 1.33 },
            'larix_decidua.webp': { realHeightCm: 48, bottomOffset: 0, scale: 1.00 },
            'acer_palmatum_groen_groot.webp': { realHeightCm: 50, bottomOffset: 0, scale: 1.04 },
            'acer_palmatum_winter.webp': { realHeightCm: 42, bottomOffset: 0, scale: 0.88 },
            'juniperus_chinensis_pieter_chokkan.webp': { realHeightCm: 52, bottomOffset: 0, scale: 1.08 },
            'acer_palmatum_bos.webp': { realHeightCm: 46, bottomOffset: 0, scale: 0.96 },
            'ginkgo_biloba.webp': { realHeightCm: 44, bottomOffset: 0, scale: 0.92 }
        };

        const meta = treeMetadata[filename] || { realHeightCm: 50, bottomOffset: 0, scale: 1.0 };

        // 3. Background Selection
        const backgrounds = [
            { src: 'bg_left_mountain.png', scrollSide: 'left' },
            { src: 'bg_right_calligraphy.png', scrollSide: 'right' },
            { src: 'bg_left_enso.png', scrollSide: 'left' },
            { src: 'bg_right_bamboo.png', scrollSide: 'right' }, // De boekrol is verschoven naar rechts
            { src: 'bg_left_autumn.png', scrollSide: 'left' },
            { src: 'bg_right_moon_bird.png', scrollSide: 'right' },
            { src: 'bg_left_crane.png', scrollSide: 'left' },
            { src: 'bg_right_pine.png', scrollSide: 'right' },
            { src: 'bg_left_plum_blossom.png', scrollSide: 'left' },
            { src: 'bg_right_river.png', scrollSide: 'right' }
        ];

        const selectedBg = backgrounds[Math.floor(Math.random() * backgrounds.length)];
        const treeSide = selectedBg.scrollSide === 'left' ? 'right' : 'left';
        
        tokonomaFrame.style.backgroundImage = `url('images/tokonoma/backgrounds/${selectedBg.src}')`;

        if (lightboxCaption) {
            lightboxCaption.innerHTML = `
                <div style="padding: 0 20px; text-align: center;">
                    <span style="display:block; font-weight:700; font-size:1.5rem; margin-bottom: 2px; color: white;">${species}</span>
                    <span style="display:block; font-size:0.85rem; opacity:0.8; text-transform:uppercase; letter-spacing:2px; color: var(--color-sand); margin-bottom: 8px;">${style}</span>
                    <span style="display:inline-block; font-size:0.8rem; font-weight:600; padding: 3px 10px; border-radius: 20px; background: rgba(255,255,255,0.15); color: var(--color-sand); letter-spacing: 0.5px;">Formaat: ca. ${meta.realHeightCm} cm</span>
                </div>
            `;
        }
        
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Zowel links als rechts staan de bomen nu stabiel op de prachtige houten Tokonoma-vloerdelen.
        // We corrigeren voor het perspectief- en hoogteverschil op basis van de strakke uitsnijding van de potten (links 19%, rechts 18%).
        const baseBottomPercent = (treeSide === 'left') ? 19.00 : 18.00;
        const baseHeightPercent = 43;

        // Custom multiplier scale and offset van de boom-meta
        const finalHeight = baseHeightPercent * meta.scale;
        const finalBottom = baseBottomPercent + meta.bottomOffset;

        // Asymmetrische balans (Fukinsei): links geplaatst op 38%, rechts geplaatst op 62%
        const finalLeft = (treeSide === 'left') ? '38%' : '62%';

        tokonomaImg.style.position = 'absolute';
        tokonomaImg.style.left = finalLeft;
        tokonomaImg.style.transform = 'translateX(-50%)';
        tokonomaImg.style.width = 'auto';
        tokonomaImg.style.height = finalHeight + '%';
        tokonomaImg.style.objectFit = 'contain';
        tokonomaImg.style.bottom = finalBottom + '%';
        tokonomaImg.style.top = 'auto';
        tokonomaImg.style.zIndex = '5';
        
        // Add slight fade in for the tree itself
        tokonomaImg.style.opacity = '0';
        setTimeout(() => {
            tokonomaImg.style.transition = 'opacity 0.8s ease';
            tokonomaImg.style.opacity = '1';
        }, 50);
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
            currentActiveActivityItem = item;
            currentActiveCard = null; // Reset Tokonoma gallery tracker
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
        lightbox.style.backgroundImage = '';
        lightboxImg.style.bottom = '';
        
        // Reset tokonoma if present
        const tokonomaFrame = document.getElementById('tokonoma-frame');
        const tokonomaImg = document.getElementById('tokonoma-img');
        if (tokonomaFrame) tokonomaFrame.style.backgroundImage = '';
        if (tokonomaImg) {
            tokonomaImg.src = '';
            tokonomaImg.style.bottom = '';
            tokonomaImg.style.left = '';
        }

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

    // Unified navigation function for lightbox (ArrowRight, ArrowLeft, visual buttons, swipes)
    const navigateLightbox = (direction) => {
        if (lightbox.classList.contains('tokonoma-mode')) {
            // Tokonoma Digital Exhibition Mode
            const cards = Array.from(document.querySelectorAll('.exhibition-card'));
            if (!cards.length) return;
            let index = cards.indexOf(currentActiveCard);
            if (index === -1) index = 0;
            if (direction === 'next') {
                index = (index + 1) % cards.length;
            } else {
                index = (index - 1 + cards.length) % cards.length;
            }
            toggleTree(cards[index]);
        } else {
            // Standard Photo Gallery Mode (filtering out hidden items)
            const items = Array.from(document.querySelectorAll('.' + itemClass)).filter(el => el.getBoundingClientRect().width > 0);
            if (!items.length) return;
            let index = items.indexOf(currentActiveActivityItem);
            if (index === -1) index = 0;
            if (direction === 'next') {
                index = (index + 1) % items.length;
            } else {
                index = (index - 1 + items.length) % items.length;
            }
            currentActiveActivityItem = items[index];
            const nextImg = currentActiveActivityItem.querySelector('img');
            const nextFullSrc = currentActiveActivityItem.getAttribute('data-full') || nextImg.src;
            
            // Apply a sleek, smooth fade transition for standard image changes
            lightboxImg.style.transition = 'none';
            lightboxImg.style.opacity = '0';
            lightboxImg.src = nextFullSrc;
            if (lightboxCaption) lightboxCaption.textContent = nextImg.alt || "BVB Clubavond";
            
            setTimeout(() => {
                lightboxImg.style.transition = 'opacity 0.4s ease';
                lightboxImg.style.opacity = '1';
            }, 50);
        }
    };

    // Attach event listeners to visual navigation buttons
    const btnPrev = document.getElementById('lightbox-prev');
    const btnNext = document.getElementById('lightbox-next');
    if (btnPrev) {
        btnPrev.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent closing lightbox on backdrop click
            navigateLightbox('prev');
        });
    }
    if (btnNext) {
        btnNext.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent closing lightbox on backdrop click
            navigateLightbox('next');
        });
    }

    document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('active')) {
            if (e.key === 'Escape') {
                closeLightbox();
            } else if (e.key === 'ArrowRight') {
                navigateLightbox('next');
            } else if (e.key === 'ArrowLeft') {
                navigateLightbox('prev');
            }
        }
    });

    // Swipe gestures support for touch devices
    let touchStartX = 0;
    let touchEndX = 0;
    
    lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    lightbox.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const threshold = 50; // swipe threshold in pixels
        if (touchEndX < touchStartX - threshold) {
            navigateLightbox('next'); // Swiped left -> next
        } else if (touchEndX > touchStartX + threshold) {
            navigateLightbox('prev'); // Swiped right -> prev
        }
    }, { passive: true });
}

// 7. Interactive NL Map with Premium HTML Tooltips
const initPremiumMap = () => {
    const container = document.querySelector('.nl-map-container-new');
    const tooltip = document.getElementById('map-tooltip');
    const markers = document.querySelectorAll('.club-marker');

    if (!container || !tooltip || !markers.length) return;

    // Dynamically inject larger, invisible pointer-events hitboxes to make the tiny markers extremely easy to hover and click on PC
    markers.forEach(marker => {
        const hitbox = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        hitbox.setAttribute('r', '8');
        hitbox.setAttribute('fill', 'none');
        hitbox.setAttribute('pointer-events', 'all');
        hitbox.style.cursor = 'pointer';
        marker.insertBefore(hitbox, marker.firstChild);
    });

    // Sleek touch detection that adapts to how the user actually interacts
    let isTouchInteraction = false;
    let lastTouchTime = 0;

    window.addEventListener('touchstart', () => {
        isTouchInteraction = true;
        lastTouchTime = Date.now();
    }, { passive: true });

    window.addEventListener('mousemove', () => {
        // Prevent mobile/hybrid touch events from triggering mousemove compatibility overrides
        if (Date.now() - lastTouchTime < 1000) return;
        isTouchInteraction = false;
    }, { passive: true });

    // Helper to check if it's a touch device
    const checkTouch = () => {
        return isTouchInteraction || window.matchMedia('(hover: none)').matches;
    };

    // Dynamic text update for touch devices
    const mapHint = container.parentElement.querySelector('.map-hint') || document.querySelector('.map-hint');
    const updateHint = () => {
        if (mapHint) {
            if (checkTouch()) {
                mapHint.textContent = 'Tik op een stip voor details. Tik nogmaals om de website te bezoeken.';
            } else {
                mapHint.textContent = 'Beweeg over de stippen voor details. Klik om de website te bezoeken.';
            }
        }
    };
    updateHint();

    // Listen to touch/mouse events to update hint text dynamically
    window.addEventListener('touchstart', updateHint, { passive: true });
    window.addEventListener('mousemove', updateHint, { passive: true });

    let hideTimeout = null;

    const showTooltip = (marker) => {
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }

        const town = marker.getAttribute('data-town');
        const name = marker.getAttribute('data-name');
        if (!town || !name) return;

        tooltip.querySelector('.tooltip-town').textContent = town;
        tooltip.querySelector('.tooltip-name').textContent = name;

        // Set visible class first so we can measure the tooltip width
        tooltip.classList.add('visible');

        // Align tooltip with the visual dot, NOT the larger parent hitbox group
        const visualDot = marker.querySelector('.marker-dot') || marker;
        const rect = visualDot.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Find center of marker relative to container
        const markerX = rect.left - containerRect.left + rect.width / 2;
        const y = rect.top - containerRect.top;

        // Clamp tooltip position inside container
        const tooltipWidth = tooltip.offsetWidth;
        const halfWidth = tooltipWidth / 2;
        const buffer = 15; // padding from container edge
        let tooltipX = markerX;

        if (tooltipX - halfWidth < buffer) {
            tooltipX = halfWidth + buffer;
        } else if (tooltipX + halfWidth > containerRect.width - buffer) {
            tooltipX = containerRect.width - halfWidth - buffer;
        }

        tooltip.style.left = `${tooltipX}px`;
        tooltip.style.top = `${y}px`;

        // Calculate and set arrow offset
        const arrowOffset = markerX - tooltipX;
        tooltip.style.setProperty('--arrow-offset', `${arrowOffset}px`);
    };

    const hideTooltip = () => {
        tooltip.classList.remove('visible');
        markers.forEach(m => m.classList.remove('active-touch'));
    };

    // Desktop/Hover Event Listeners
    markers.forEach(marker => {
        marker.addEventListener('mouseenter', () => {
            if (!checkTouch()) showTooltip(marker);
        });

        marker.addEventListener('mouseleave', () => {
            if (!checkTouch()) {
                // Debounce hide to prevent flickering when moving between markers quickly
                hideTimeout = setTimeout(() => {
                    hideTooltip();
                }, 100);
            }
        });

        marker.addEventListener('focus', () => {
            showTooltip(marker);
        });

        marker.addEventListener('blur', () => {
            hideTooltip();
        });
    });

    // Touch Interaction via click on the parent <a> tag
    const links = container.querySelectorAll('svg a');
    links.forEach(link => {
        const marker = link.querySelector('.club-marker');
        if (!marker) return;

        link.addEventListener('click', (e) => {
            if (checkTouch()) {
                if (!marker.classList.contains('active-touch')) {
                    // First tap: prevent navigation and show tooltip
                    e.preventDefault();
                    e.stopPropagation(); // Stop document click from hiding it immediately
                    
                    hideTooltip(); // Hide any other open tooltips first
                    
                    marker.classList.add('active-touch');
                    showTooltip(marker);
                } else {
                    // Second tap: allow navigation (don't prevent default)
                    hideTooltip();
                }
            }
        });
    });

    // Dismiss tooltip when tapping outside (supports both clicks and touch taps)
    const handleOutsideDismiss = (e) => {
        if (!e.target.closest('.club-marker') && !e.target.closest('#map-tooltip')) {
            hideTooltip();
        }
    };

    document.addEventListener('click', handleOutsideDismiss, { passive: true });
    document.addEventListener('touchstart', handleOutsideDismiss, { passive: true });
};

// Initialize if on the right page
if (document.querySelector('.nl-map-container-new')) {
    initPremiumMap();
}

