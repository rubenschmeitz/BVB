(() => {
    'use strict';

    const BVB = window.BVB || {};
    const onReady = BVB.onReady || ((callback) => document.addEventListener('DOMContentLoaded', callback));

    onReady(initAssociationMap);

    function initAssociationMap() {
        const container = document.querySelector('.nl-map-container-new');
        let tooltip = document.getElementById('map-tooltip');
        const svg = container ? container.querySelector('svg') : null;
        const markers = container ? Array.from(container.querySelectorAll('.club-marker')) : [];

        if (!container || !markers.length || !svg) return;

        container.querySelectorAll('.map-html-overlay').forEach(element => element.remove());
        container.style.position = 'relative';

        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'map-tooltip';
            tooltip.className = 'map-tooltip';
            tooltip.setAttribute('role', 'tooltip');
            tooltip.setAttribute('aria-hidden', 'true');
            container.appendChild(tooltip);
        }

        let activeMarker = null;
        let hideTimeoutId = null;
        let clickPointerType = 'mouse';

        const getMarkerCenter = (marker) => {
            const dot = marker.querySelector('.marker-dot');
            if (!dot) return null;

            const rect = dot.getBoundingClientRect();
            return {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
        };

        const getNearestMarker = (event) => {
            if (!event || typeof event.clientX !== 'number' || typeof event.clientY !== 'number') {
                return null;
            }

            const maxDistance = window.matchMedia('(pointer: coarse)').matches ? 38 : 32;
            let nearestMarker = null;
            let nearestDistance = Infinity;

            markers.forEach(marker => {
                const center = getMarkerCenter(marker);
                if (!center) return;

                const distance = Math.hypot(event.clientX - center.x, event.clientY - center.y);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestMarker = marker;
                }
            });

            return nearestDistance <= maxDistance ? nearestMarker : null;
        };

        const navigateToMarker = (marker) => {
            const parentAnchor = marker ? marker.closest('a') : null;
            if (!parentAnchor) return;

            const href = parentAnchor.getAttribute('href');
            if (!href) return;

            if (parentAnchor.getAttribute('target') === '_blank') {
                window.open(href, '_blank', 'noopener,noreferrer');
            } else {
                window.location.href = href;
            }
        };

        const showTooltip = (marker, makeInteractive = false) => {
            const circle = marker.querySelector('.marker-dot');
            if (!circle) return;

            markers.forEach(item => item.classList.remove('is-active-marker'));

            activeMarker = marker;
            marker.classList.add('is-active-marker');

            const town = marker.getAttribute('data-town') || '';
            const name = marker.getAttribute('data-name') || '';
            const parentAnchor = marker.closest('a');
            const href = parentAnchor ? parentAnchor.getAttribute('href') : '#';
            const target = parentAnchor ? parentAnchor.getAttribute('target') : '';
            const targetAttr = target ? `target="${target}" rel="noopener noreferrer"` : '';
            const ctaText = town === 'Berlicum' ? 'Bekijk vereniging &rarr;' : 'Bezoek website &rarr;';

            tooltip.innerHTML = `
                <div class="tooltip-town">${town}</div>
                <div class="tooltip-name">${name}</div>
                <a href="${href}" ${targetAttr} class="tooltip-cta">${ctaText}</a>
            `;

            tooltip.style.display = 'flex';
            tooltip.classList.toggle('interactive', makeInteractive);
            tooltip.classList.add('visible');
            tooltip.setAttribute('aria-hidden', 'false');

            requestAnimationFrame(() => {
                const containerRect = container.getBoundingClientRect();
                const markerRect = circle.getBoundingClientRect();
                const tooltipRect = tooltip.getBoundingClientRect();
                const x = markerRect.left + markerRect.width / 2 - containerRect.left;
                const y = markerRect.top + markerRect.height / 2 - containerRect.top;

                let tooltipX = x - tooltipRect.width / 2;
                let tooltipY = y - tooltipRect.height - 15;

                if (tooltipX < 10) tooltipX = 10;
                if (tooltipX + tooltipRect.width > containerRect.width - 10) {
                    tooltipX = containerRect.width - tooltipRect.width - 10;
                }

                const arrowOffset = x - (tooltipX + tooltipRect.width / 2);
                tooltip.style.setProperty('--arrow-offset', `${arrowOffset}px`);

                let isFlipped = false;
                if (tooltipY < 10) {
                    tooltipY = y + 25;
                    isFlipped = true;
                }

                tooltip.style.left = `${tooltipX}px`;
                tooltip.style.top = `${tooltipY}px`;
                tooltip.classList.toggle('flipped', isFlipped);
            });
        };

        const hideTooltip = () => {
            clearTimeout(hideTimeoutId);
            if (activeMarker) activeMarker.classList.remove('is-active-marker');

            tooltip.classList.remove('visible', 'flipped', 'interactive');
            tooltip.setAttribute('aria-hidden', 'true');
            tooltip.style.display = 'none';
            tooltip.style.left = '-9999px';
            tooltip.style.top = '-9999px';
            activeMarker = null;
        };

        markers.forEach(marker => {
            marker.addEventListener('pointerdown', (event) => {
                clickPointerType = event.pointerType;
            }, { passive: true });

            marker.addEventListener('pointerenter', (event) => {
                if (event.pointerType === 'touch') return;
                clearTimeout(hideTimeoutId);
                showTooltip(getNearestMarker(event) || marker, true);
            });

            marker.addEventListener('pointerleave', (event) => {
                if (event.pointerType === 'touch') return;

                const enteredTooltip = event.relatedTarget && (tooltip === event.relatedTarget || tooltip.contains(event.relatedTarget));
                if (enteredTooltip) return;

                clearTimeout(hideTimeoutId);
                hideTimeoutId = setTimeout(hideTooltip, 250);
            });

            marker.addEventListener('click', (event) => {
                const targetMarker = getNearestMarker(event) || marker;
                const isTouch = clickPointerType === 'touch' || window.matchMedia('(pointer: coarse)').matches;
                event.preventDefault();

                if (isTouch && activeMarker !== targetMarker) {
                    hideTooltip();
                    showTooltip(targetMarker, true);
                    return;
                }

                hideTooltip();
                navigateToMarker(targetMarker);
            });
        });

        tooltip.addEventListener('pointerenter', () => {
            if (clickPointerType !== 'touch') clearTimeout(hideTimeoutId);
        });

        tooltip.addEventListener('pointerleave', (event) => {
            if (clickPointerType === 'touch') return;

            const enteredActiveMarker = activeMarker && (activeMarker === event.relatedTarget || activeMarker.contains(event.relatedTarget));
            if (enteredActiveMarker) return;

            clearTimeout(hideTimeoutId);
            hideTimeoutId = setTimeout(hideTooltip, 250);
        });

        document.addEventListener('click', (event) => {
            if (!event.target.closest('.club-marker') && !event.target.closest('#map-tooltip')) {
                hideTooltip();
            }
        }, { passive: true });
    }
})();
