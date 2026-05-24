(() => {
    'use strict';

    const BVB = window.BVB || {};
    const onReady = BVB.onReady || ((callback) => document.addEventListener('DOMContentLoaded', callback));
    const setBodyLocked = BVB.setBodyLocked || ((locked) => { document.body.style.overflow = locked ? 'hidden' : ''; });

    let currentActiveCard = null;
    let currentActiveActivityItem = null;

    onReady(() => {
        renderClubGallery();

        document.querySelectorAll('.gallery-nav button[data-category]').forEach(button => {
            button.addEventListener('click', () => showCategory(button.dataset.category));
        });

        if (window.location.hash === '#leden-section') {
            showCategory('leden');
        }

        document.querySelectorAll('.exhibition-card').forEach(card => {
            card.addEventListener('click', () => toggleTree(card));
            card.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                toggleTree(card);
            });
        });

        if (document.getElementById('lightbox')) {
            initLightbox('lightbox', 'lightbox-img', 'lightbox-caption', 'lightbox-close', 'activity-item');
        }
    });

    function renderClubGallery() {
        const gallery = document.querySelector('[data-club-gallery]');
        const photos = window.BVB_CLUB_GALLERY;
        if (!gallery || !Array.isArray(photos)) return;

        const fragment = document.createDocumentFragment();
        photos.forEach(photo => {
            if (!photo || !photo.src) return;

            const item = document.createElement('div');
            item.className = 'activity-item';
            item.dataset.full = photo.full || photo.src;

            const img = document.createElement('img');
            img.src = photo.src;
            img.alt = photo.alt || 'Clubavond impressie';
            img.loading = 'lazy';
            img.decoding = 'async';
            if (photo.width) img.width = photo.width;
            if (photo.height) img.height = photo.height;
            img.addEventListener('error', () => item.remove(), { once: true });

            item.appendChild(img);
            fragment.appendChild(item);
        });

        gallery.replaceChildren(fragment);

        if (typeof BVB.initRevealObservers === 'function') {
            BVB.initRevealObservers();
        } else if (typeof window.initRevealObservers === 'function') {
            window.initRevealObservers();
        }
    }

    function showCategory(categoryId) {
        document.querySelectorAll('.gallery-category').forEach(category => {
            category.classList.remove('active');
        });
        document.querySelectorAll('.gallery-nav button').forEach(button => {
            button.classList.remove('active');
        });

        const section = document.getElementById(`${categoryId}-section`);
        if (section) {
            section.classList.add('active');
            if (typeof BVB.initRevealObservers === 'function') {
                BVB.initRevealObservers();
            } else if (typeof window.initRevealObservers === 'function') {
                window.initRevealObservers();
            }

            setTimeout(() => {
                section.querySelectorAll('.reveal-on-scroll').forEach((element, index) => {
                    if (index < 6) element.classList.add('active');
                });
            }, 100);
        }

        const clickedButton = Array.from(document.querySelectorAll('.gallery-nav button'))
            .find(button => button.dataset.category === categoryId);
        if (clickedButton) clickedButton.classList.add('active');
    }

    function toggleTree(card) {
        currentActiveCard = card;
        currentActiveActivityItem = null;

        const img = card.querySelector('img');
        const species = card.querySelector('.exhibition-species');
        const style = card.querySelector('.exhibition-style');
        const lightbox = document.getElementById('lightbox');
        const tokonomaFrame = document.getElementById('tokonoma-frame');
        const tokonomaImg = document.getElementById('tokonoma-img');
        const lightboxCaption = document.getElementById('lightbox-caption');

        if (!img || !lightbox || !tokonomaFrame || !tokonomaImg) return;

        lightbox.classList.add('tokonoma-mode');
        tokonomaImg.src = img.src;

        const filename = img.src.substring(img.src.lastIndexOf('/') + 1);
        const treeMetadata = {
            'carpinus_betulus.webp': { realHeightCm: 44, bottomOffset: 0, scale: 0.92 },
            'wisteria_sinensis.webp': { realHeightCm: 55, bottomOffset: 0, scale: 1.15, placement: { left: '34%', bottom: 20.2, height: 48 } },
            'acer_palmatum_rood.webp': { realHeightCm: 50, bottomOffset: 0, scale: 1.04 },
            'juniperus_chinensis_rots.webp': { realHeightCm: 38, bottomOffset: 0, scale: 0.79, placement: { left: '39%', bottom: 20.2, height: 37.5 } },
            'acer_palmatum_groen_klein.webp': { realHeightCm: 50, bottomOffset: 0, scale: 1.04, placement: { left: '63%', bottom: 20, height: 40 } },
            'larix_kaempferi.webp': { realHeightCm: 45, bottomOffset: 0, scale: 0.94 },
            'juniperus_itoigawa_shohin.webp': { realHeightCm: 32, bottomOffset: 0, scale: 0.67 },
            'larix_kaempferi_kaal.webp': { realHeightCm: 46, bottomOffset: 0, scale: 0.96 },
            'pinus_sylvestris.webp': { realHeightCm: 64, bottomOffset: 0, scale: 1.33 },
            'larix_decidua.webp': { realHeightCm: 48, bottomOffset: 0, scale: 1.00 },
            'acer_palmatum_groen_groot.webp': { realHeightCm: 50, bottomOffset: 0, scale: 1.04 },
            'acer_palmatum_winter.webp': { realHeightCm: 42, bottomOffset: 0, scale: 0.88 },
            'acer_palmatum_pieter_chokkan.webp': { realHeightCm: 52, bottomOffset: 0, scale: 1.08 },
            'acer_palmatum_bos.webp': { realHeightCm: 46, bottomOffset: 0, scale: 0.96 },
            'ginkgo_biloba.webp': { realHeightCm: 44, bottomOffset: 0, scale: 0.92 }
        };

        const backgrounds = [
            { src: 'bg_left_mountain.png', scrollSide: 'left', treeSide: 'right' },
            { src: 'bg_right_calligraphy.png', scrollSide: 'right', treeSide: 'left' },
            { src: 'bg_left_enso.png', scrollSide: 'left', treeSide: 'right' },
            { src: 'bg_right_bamboo.png', scrollSide: 'right', treeSide: 'left' },
            { src: 'bg_left_autumn.png', scrollSide: 'left', treeSide: 'right' },
            { src: 'bg_right_moon_bird.png', scrollSide: 'right', treeSide: 'left' },
            { src: 'bg_left_crane.png', scrollSide: 'left', treeSide: 'right' },
            { src: 'bg_right_pine.png', scrollSide: 'right', treeSide: 'left' },
            { src: 'bg_left_plum_blossom.png', scrollSide: 'left', treeSide: 'right' },
            { src: 'bg_right_river.png', scrollSide: 'right', treeSide: 'left' }
        ];
        const backgroundByTree = {
            'wisteria_sinensis.webp': backgrounds.find(bg => bg.src === 'bg_right_calligraphy.png'),
            'acer_palmatum_groen_klein.webp': backgrounds.find(bg => bg.src === 'bg_left_crane.png'),
            'juniperus_chinensis_rots.webp': backgrounds.find(bg => bg.src === 'bg_right_river.png')
        };

        const meta = treeMetadata[filename] || { realHeightCm: 50, bottomOffset: 0, scale: 1.0 };
        const hashValue = Array.from(filename).reduce((hash, char) => {
            return ((hash << 5) - hash + char.charCodeAt(0)) >>> 0;
        }, 0);
        const selectedBg = backgroundByTree[filename] || backgrounds[hashValue % backgrounds.length];
        const treeSide = selectedBg.treeSide;

        tokonomaFrame.style.backgroundImage = `url('images/tokonoma/backgrounds/${selectedBg.src}')`;
        tokonomaFrame.dataset.scrollSide = selectedBg.scrollSide;
        tokonomaFrame.dataset.treeSide = treeSide;

        if (lightboxCaption) {
            lightboxCaption.innerHTML = `
                <div class="tokonoma-caption-content">
                    <span class="tokonoma-caption-species">${species ? species.textContent : ''}</span>
                    <span class="tokonoma-caption-style">${style ? style.textContent : ''}</span>
                    <span class="tokonoma-caption-size">Formaat: ca. ${meta.realHeightCm} cm</span>
                </div>
            `;
        }

        const defaultPlacement = {
            height: 43 * meta.scale,
            bottom: (treeSide === 'left' ? 20.5 : 20.0) + meta.bottomOffset,
            left: treeSide === 'left' ? '39%' : '62%'
        };
        const placement = { ...defaultPlacement, ...(meta.placement || {}) };

        tokonomaImg.style.position = 'absolute';
        tokonomaImg.style.left = placement.left;
        tokonomaImg.style.transform = 'translateX(-50%)';
        tokonomaImg.style.width = 'auto';
        tokonomaImg.style.height = `${placement.height}%`;
        tokonomaImg.style.objectFit = 'contain';
        tokonomaImg.style.bottom = `${placement.bottom}%`;
        tokonomaImg.style.top = 'auto';
        tokonomaImg.style.zIndex = '5';
        tokonomaImg.style.opacity = '0';

        lightbox.classList.add('active');
        setBodyLocked(true);

        setTimeout(() => {
            tokonomaImg.style.transition = 'opacity 0.8s ease';
            tokonomaImg.style.opacity = '1';
        }, 50);
    }

    function initLightbox(lightboxId, imgId, captionId, closeClass, itemClass) {
        const lightbox = document.getElementById(lightboxId);
        const lightboxImg = document.getElementById(imgId);
        const lightboxCaption = document.getElementById(captionId);
        const lightboxClose = document.querySelector(`.${closeClass}`);
        if (!lightbox || !lightboxImg) return;

        document.querySelectorAll(`.${itemClass}`).forEach(item => {
            item.setAttribute('role', 'button');
            item.tabIndex = 0;
            item.addEventListener('click', () => {
                currentActiveActivityItem = item;
                currentActiveCard = null;
                const img = item.querySelector('img');
                if (!img) return;

                lightboxImg.src = item.getAttribute('data-full') || img.src;
                if (lightboxCaption) lightboxCaption.textContent = img.alt || 'Clubavond';
                lightbox.classList.add('active');
                setBodyLocked(true);
            });
            item.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                item.click();
            });
        });

        const closeLightbox = () => {
            lightbox.classList.remove('active', 'tokonoma-mode');
            lightbox.style.paddingBottom = '';
            lightbox.style.display = '';
            lightbox.style.position = '';
            lightbox.style.backgroundImage = '';
            lightboxImg.style.bottom = '';

            const tokonomaFrame = document.getElementById('tokonoma-frame');
            const tokonomaImg = document.getElementById('tokonoma-img');
            if (tokonomaFrame) tokonomaFrame.style.backgroundImage = '';
            if (tokonomaImg) {
                tokonomaImg.src = '';
                tokonomaImg.style.bottom = '';
                tokonomaImg.style.left = '';
            }

            setBodyLocked(false);
        };

        const navigateLightbox = (direction) => {
            if (lightbox.classList.contains('tokonoma-mode')) {
                const cards = Array.from(document.querySelectorAll('.exhibition-card'))
                    .filter(card => !card.hidden && card.getBoundingClientRect().width > 0);
                if (!cards.length) return;

                let index = cards.indexOf(currentActiveCard);
                if (index === -1) index = 0;
                index = direction === 'next'
                    ? (index + 1) % cards.length
                    : (index - 1 + cards.length) % cards.length;
                toggleTree(cards[index]);
                return;
            }

            const items = Array.from(document.querySelectorAll(`.${itemClass}`))
                .filter(element => element.getBoundingClientRect().width > 0);
            if (!items.length) return;

            let index = items.indexOf(currentActiveActivityItem);
            if (index === -1) index = 0;
            index = direction === 'next'
                ? (index + 1) % items.length
                : (index - 1 + items.length) % items.length;

            currentActiveActivityItem = items[index];
            const nextImg = currentActiveActivityItem.querySelector('img');
            if (!nextImg) return;

            lightboxImg.style.transition = 'none';
            lightboxImg.style.opacity = '0';
            lightboxImg.src = currentActiveActivityItem.getAttribute('data-full') || nextImg.src;
            if (lightboxCaption) lightboxCaption.textContent = nextImg.alt || 'Clubavond';

            setTimeout(() => {
                lightboxImg.style.transition = 'opacity 0.4s ease';
                lightboxImg.style.opacity = '1';
            }, 50);
        };

        if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);

        lightbox.addEventListener('click', (event) => {
            if (event.target === lightbox) closeLightbox();
        });

        const btnPrev = document.getElementById('lightbox-prev');
        const btnNext = document.getElementById('lightbox-next');
        if (btnPrev) {
            btnPrev.addEventListener('click', (event) => {
                event.stopPropagation();
                navigateLightbox('prev');
            });
        }
        if (btnNext) {
            btnNext.addEventListener('click', (event) => {
                event.stopPropagation();
                navigateLightbox('next');
            });
        }

        document.addEventListener('keydown', (event) => {
            if (!lightbox.classList.contains('active')) return;
            if (event.key === 'Escape') {
                closeLightbox();
            } else if (event.key === 'ArrowRight') {
                navigateLightbox('next');
            } else if (event.key === 'ArrowLeft') {
                navigateLightbox('prev');
            }
        });

        let touchStartX = 0;
        lightbox.addEventListener('touchstart', (event) => {
            touchStartX = event.changedTouches[0].screenX;
        }, { passive: true });

        lightbox.addEventListener('touchend', (event) => {
            const touchEndX = event.changedTouches[0].screenX;
            const threshold = 50;
            if (touchEndX < touchStartX - threshold) {
                navigateLightbox('next');
            } else if (touchEndX > touchStartX + threshold) {
                navigateLightbox('prev');
            }
        }, { passive: true });
    }
})();
