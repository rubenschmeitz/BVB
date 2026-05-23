(() => {
    'use strict';

    const BVB = window.BVB = window.BVB || {};

    const onReady = (callback) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    };

    const setBodyLocked = (locked) => {
        document.body.style.overflow = locked ? 'hidden' : '';
    };

    BVB.onReady = onReady;
    BVB.setBodyLocked = setBodyLocked;

    onReady(() => {
        initMobileNav();
        initMobileCollapsibles();
        initDropdownNav();
        initFullScreenMenu();
        syncBottomNavActiveState();
        initRevealObservers();
        initLazyImages();
        initHomeGallery();
        initHeaderScroll();
    });

    function initMobileNav() {
        const mobileToggle = document.getElementById('mobile-toggle');
        const mainNav = document.getElementById('main-nav');

        if (!mobileToggle || !mainNav) return;

        mobileToggle.addEventListener('click', () => {
            const isActive = mobileToggle.classList.toggle('active');
            mainNav.classList.toggle('active', isActive);
            mobileToggle.setAttribute('aria-expanded', String(isActive));
        });
    }

    function initMobileCollapsibles() {
        const mobileCollapsibles = document.querySelectorAll('details[data-mobile-collapsible]');
        if (!mobileCollapsibles.length || typeof window.matchMedia !== 'function') return;

        const mobileQuery = window.matchMedia('(max-width: 600px)');
        const syncMobileCollapsibles = () => {
            mobileCollapsibles.forEach(details => {
                if (mobileQuery.matches) {
                    if (!details.dataset.mobileReady) {
                        details.open = false;
                        details.dataset.mobileReady = 'true';
                    }
                } else {
                    details.open = true;
                    delete details.dataset.mobileReady;
                }
            });
        };

        syncMobileCollapsibles();
        if (typeof mobileQuery.addEventListener === 'function') {
            mobileQuery.addEventListener('change', syncMobileCollapsibles);
        } else if (typeof mobileQuery.addListener === 'function') {
            mobileQuery.addListener(syncMobileCollapsibles);
        }
    }

    function initDropdownNav() {
        document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
            const trigger = dropdown.querySelector('.dropdown-trigger');
            if (!trigger) return;

            trigger.addEventListener('click', () => {
                const isOpen = dropdown.classList.toggle('open');
                trigger.setAttribute('aria-expanded', String(isOpen));
            });

            dropdown.addEventListener('keydown', (event) => {
                if (event.key !== 'Escape') return;
                dropdown.classList.remove('open');
                trigger.setAttribute('aria-expanded', 'false');
                trigger.focus();
            });
        });

        document.addEventListener('click', (event) => {
            document.querySelectorAll('.nav-dropdown.open').forEach(dropdown => {
                if (dropdown.contains(event.target)) return;
                dropdown.classList.remove('open');
                const trigger = dropdown.querySelector('.dropdown-trigger');
                if (trigger) trigger.setAttribute('aria-expanded', 'false');
            });
        });
    }

    function initFullScreenMenu() {
        const fsMenuTrigger = document.getElementById('fs-menu-trigger');
        const fsMenu = document.getElementById('full-screen-menu');
        const fsMenuClose = document.getElementById('fs-menu-close');
        const fsDropdown = document.querySelector('.fs-menu-dropdown');
        const fsDropdownTrigger = fsDropdown ? fsDropdown.querySelector('.fs-menu-trigger') : null;

        if (!fsMenu) return;

        const closeMenu = () => {
            fsMenu.classList.remove('active');
            setBodyLocked(false);
        };

        BVB.closeFullScreenMenu = closeMenu;

        if (fsMenuTrigger) {
            fsMenuTrigger.addEventListener('click', (event) => {
                event.preventDefault();
                fsMenu.classList.add('active');
                setBodyLocked(true);
            });
        }

        if (fsMenuClose) {
            fsMenuClose.addEventListener('click', closeMenu);
        }

        fsMenu.querySelectorAll('.fs-menu-links a').forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        if (fsDropdownTrigger && fsDropdown) {
            fsDropdownTrigger.addEventListener('click', (event) => {
                event.preventDefault();
                const isExpanded = fsDropdown.classList.toggle('expanded');
                fsDropdownTrigger.setAttribute('aria-expanded', String(isExpanded));
            });
        }
    }

    function syncBottomNavActiveState() {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';

        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            const href = item.getAttribute('href');
            item.classList.toggle('active', href === currentPath);
        });
    }

    function initRevealObservers() {
        if (!('IntersectionObserver' in window)) {
            const revealAll = () => {
                document.querySelectorAll('.reveal-on-scroll:not(.active)').forEach(el => {
                    el.classList.add('active');
                });
            };
            BVB.initRevealObservers = revealAll;
            window.initRevealObservers = revealAll;
            revealAll();
            return;
        }

        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('active');
                revealObserver.unobserve(entry.target);
            });
        }, { threshold: 0.05, rootMargin: '0px 0px 50px 0px' });

        const horizontalObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('active');
                horizontalObserver.unobserve(entry.target);
            });
        }, { threshold: 0.1, rootMargin: '0px 100px 0px 100px' });

        const observeReveals = () => {
            document.querySelectorAll('.reveal-on-scroll:not(.active)').forEach(el => {
                if (el.closest('.exhibition-container')) {
                    horizontalObserver.observe(el);
                } else {
                    revealObserver.observe(el);
                }
            });
        };

        BVB.initRevealObservers = observeReveals;
        window.initRevealObservers = observeReveals;
        observeReveals();
    }

    function initLazyImages() {
        document.querySelectorAll('img[loading="lazy"]').forEach(img => {
            const handleLoad = () => {
                img.classList.add('loaded');
                if (img.parentElement && img.parentElement.classList.contains('skeleton')) {
                    img.parentElement.classList.add('loaded');
                    setTimeout(() => img.parentElement.classList.remove('skeleton'), 600);
                }
            };

            img.addEventListener('load', handleLoad);
            if (img.complete) handleLoad();

            setTimeout(() => {
                const parent = img.parentElement;
                if (parent && parent.classList.contains('skeleton') && !parent.classList.contains('loaded')) {
                    handleLoad();
                }
            }, 2500);
        });
    }

    function initHomeGallery() {
        document.querySelectorAll('[data-home-gallery]').forEach(widget => {
            const slides = Array.from(widget.querySelectorAll('.home-showcase-slide'));
            const title = widget.querySelector('[data-home-gallery-title]');
            const copy = widget.querySelector('[data-home-gallery-copy]');
            const counter = widget.querySelector('[data-home-gallery-counter]');
            const link = widget.querySelector('[data-home-gallery-link]');
            const previousButton = widget.querySelector('[data-home-gallery-prev]');
            const nextButton = widget.querySelector('[data-home-gallery-next]');

            if (!slides.length) return;

            let currentIndex = Math.max(0, slides.findIndex(slide => slide.classList.contains('is-active')));

            const showSlide = (nextIndex) => {
                currentIndex = (nextIndex + slides.length) % slides.length;
                const activeSlide = slides[currentIndex];

                slides.forEach((slide, index) => {
                    const isActive = index === currentIndex;
                    slide.classList.toggle('is-active', isActive);
                    slide.setAttribute('aria-hidden', String(!isActive));
                });

                if (title) title.textContent = activeSlide.dataset.galleryTitle || '';
                if (copy) copy.textContent = activeSlide.dataset.galleryCopy || '';
                if (counter) counter.textContent = `${currentIndex + 1} / ${slides.length}`;
                if (link) {
                    const href = activeSlide.dataset.galleryLink || 'galerij.html';
                    const linkText = activeSlide.dataset.galleryLinkText || 'Bekijk meer';
                    link.href = href;
                    link.textContent = linkText;

                    if (/^https?:\/\//.test(href)) {
                        link.target = '_blank';
                        link.rel = 'noopener noreferrer';
                    } else {
                        link.removeAttribute('target');
                        link.removeAttribute('rel');
                    }
                }
            };

            if (previousButton) {
                previousButton.addEventListener('click', () => showSlide(currentIndex - 1));
            }

            if (nextButton) {
                nextButton.addEventListener('click', () => showSlide(currentIndex + 1));
            }

            widget.addEventListener('keydown', (event) => {
                if (event.key === 'ArrowLeft') showSlide(currentIndex - 1);
                if (event.key === 'ArrowRight') showSlide(currentIndex + 1);
            });

            showSlide(currentIndex);
        });
    }

    function initHeaderScroll() {
        const header = document.querySelector('.site-header');
        if (!header) return;

        let isScrolling = false;
        const scrollHandler = () => {
            if (isScrolling) return;
            window.requestAnimationFrame(() => {
                header.classList.toggle('scrolled', window.scrollY > 50);
                isScrolling = false;
            });
            isScrolling = true;
        };

        window.addEventListener('scroll', scrollHandler, { passive: true });
        scrollHandler();
    }
})();
