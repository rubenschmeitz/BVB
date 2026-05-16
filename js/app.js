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

/**
 * Toggle tree details on click (Exhibition Gallery)
 */
function toggleTree(card) {
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

        // 1. Bottom Padding Compensation Map (Scientific alignment for all 17 trees)
        const paddingMap = {
            'tree_member_1.webp': 0.1914,
            'tree_member_2.webp': 0.0332,
            'tree_member_3.webp': 0.0381,
            'tree_member_4.webp': 0.0000,
            'tree_member_5.webp': 0.0254,
            'tree_member_6.webp': 0.0244,
            'tree_member_7.webp': 0.0518,
            'tree_member_8.webp': 0.0361,
            'tree_member_9.webp': 0.0371,
            'tree_member_10.webp': 0.0986,
            'tree_member_11.webp': 0.0332,
            'tree_member_12.webp': 0.0215,
            'tree_member_13.webp': 0.0488,
            'tree_member_14.webp': 0.0518,
            'tree_member_15.webp': 0.0352,
            'tree_member_16.webp': 0.0342,
            'tree_member_17.webp': 0.0605
        };

        const filename = img.src.split('/').pop();
        const paddingRatio = paddingMap[filename] || 0.0;

        // 2. Background Selection
        const backgrounds = [
            { src: 'bg_left_mountain.png', scrollSide: 'left' },
            { src: 'bg_right_calligraphy.png', scrollSide: 'right' },
            { src: 'bg_left_enso.png', scrollSide: 'left' },
            { src: 'bg_right_bamboo.png', scrollSide: 'right' },
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
                <div style="padding: 0 20px;">
                    <span style="display:block; font-weight:700; font-size:1.5rem; margin-bottom: 5px; color: white;">${species}</span>
                    <span style="display:block; font-size:0.85rem; opacity:0.8; text-transform:uppercase; letter-spacing:2px; color: var(--color-sand);">${style}</span>
                </div>
            `;
        }
        
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Apply constant relative styling
        // Floor starts at exactly 74.22% from the top (25.78% from bottom of the 1:1 backgrounds).
        // Tree height is 55% of the frame.
        // Tree transparent padding at the bottom is compensated using our exact ratios.
        const treeHeightPercent = 55; // 55% of frame height
        const paddingCompensationPercent = treeHeightPercent * paddingRatio;
        const finalBottomPercent = 25.78 - paddingCompensationPercent; // Places the pot exactly on the floor line

        let finalLeft = (treeSide === 'left') ? '30%' : '70%';

        tokonomaImg.style.position = 'absolute';
        tokonomaImg.style.left = finalLeft;
        tokonomaImg.style.transform = 'translateX(-50%)';
        tokonomaImg.style.width = treeHeightPercent + '%';
        tokonomaImg.style.height = treeHeightPercent + '%';
        tokonomaImg.style.objectFit = 'contain';
        tokonomaImg.style.bottom = finalBottomPercent + '%';
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

// 7. Interactive NL Map with Premium HTML Tooltips
const initPremiumMap = () => {
    const container = document.querySelector('.nl-map-container-new');
    const tooltip = document.getElementById('map-tooltip');
    const markers = document.querySelectorAll('.club-marker');

    if (!container || !tooltip || !markers.length) return;

    markers.forEach(marker => {
        const showTooltip = () => {
            const town = marker.getAttribute('data-town');
            const name = marker.getAttribute('data-name');
            if (!town || !name) return;

            tooltip.querySelector('.tooltip-town').textContent = town;
            tooltip.querySelector('.tooltip-name').textContent = name;

            const rect = marker.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            // Find center of marker relative to container
            const x = rect.left - containerRect.left + rect.width / 2;
            const y = rect.top - containerRect.top;

            tooltip.style.left = `${x}px`;
            tooltip.style.top = `${y}px`;
            tooltip.classList.add('visible');
        };

        const hideTooltip = () => {
            tooltip.classList.remove('visible');
        };

        marker.addEventListener('mouseenter', showTooltip);
        marker.addEventListener('mouseleave', hideTooltip);
        marker.addEventListener('focus', showTooltip);
        marker.addEventListener('blur', hideTooltip);
    });
};

// Initialize if on the right page
if (document.querySelector('.nl-map-container-new')) {
    initPremiumMap();
}

