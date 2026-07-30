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

        const trees = Array.isArray(window.BVB_EXHIBITION_TREES)
            ? window.BVB_EXHIBITION_TREES
            : [];
        const tree = trees.find(item => item.id === card.dataset.treeId);
        if (!tree) return;

        const treeSide = tree.treeSide;
        tokonomaFrame.style.backgroundImage = `url('images/tokonoma/backgrounds/${tree.background}')`;
        tokonomaFrame.dataset.scrollSide = tree.scrollSide;
        tokonomaFrame.dataset.treeSide = treeSide;

        if (lightboxCaption) {
            const captionContent = document.createElement('div');
            captionContent.className = 'tokonoma-caption-content';

            const speciesLabel = document.createElement('span');
            speciesLabel.className = 'tokonoma-caption-species';
            speciesLabel.textContent = species ? species.textContent : '';

            const styleLabel = document.createElement('span');
            styleLabel.className = 'tokonoma-caption-style';
            styleLabel.textContent = style ? style.textContent : '';

            const sizeLabel = document.createElement('span');
            sizeLabel.className = 'tokonoma-caption-size';
            sizeLabel.textContent = `Formaat: ca. ${tree.realHeightCm} cm`;

            captionContent.append(speciesLabel, styleLabel, sizeLabel);
            lightboxCaption.replaceChildren(captionContent);
        }

        tokonomaImg.style.position = 'absolute';
        tokonomaImg.style.left = tree.positionLeft;
        tokonomaImg.style.transform = 'translateX(-50%)';
        tokonomaImg.style.width = 'auto';
        tokonomaImg.style.height = `${tree.positionHeight}%`;
        tokonomaImg.style.objectFit = 'contain';
        tokonomaImg.style.bottom = `${tree.positionBottom}%`;
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
