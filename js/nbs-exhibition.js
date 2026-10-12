(() => {
    'use strict';
    const root = document.querySelector('[data-nbs-exhibition]');
    const catalog = window.BVB_NBS_EXHIBITION;
    if (!root || !catalog?.exhibits?.length) return;
    const $ = (id) => root.querySelector(`#${id}`);
    const all = catalog.exhibits;
    const panorama = $('ex-panorama');
    const track = $('ex-panorama-track');
    const dialog = $('ex-dialog');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const thumbnails = new Map();
    let panels = [];
    let filtered = all;
    let category = 'Alle';
    let selected = 0;
    let playing = false;
    let visible = true;
    let animation;
    let lastFrame;
    let reducedTimer;
    let programmatic = false;
    let settleTimer;
    let scrollFrame;
    let viewerZoom = false;
    let dialogGeneration = 0;
    let drag;
    let suppressClick = false;

    const text = (id, value) => { $(id).textContent = value || ''; };
    function status(value, quiet = false) {
        text('ex-status', value);
        $('ex-status').classList.toggle('ex-sr-only', quiet);
    }
    const current = () => filtered[selected];
    const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const pad = (value) => String(value).padStart(2, '0');
    const limit = () => Math.max(0, panorama.scrollWidth - panorama.clientWidth);
    const behavior = () => reducedMotion.matches ? 'instant' : 'smooth';
    function imageSource(img, photo) {
        img.src = photo.panorama || photo.medium;
        img.srcset = photo.panorama ? '' : `${photo.medium} ${photo.mediumWidth}w, ${photo.src} ${photo.width}w`;
        img.sizes = '(max-width: 520px) calc(100vw - 48px), (max-width: 1440px) 48vw, 705px';
        img.alt = photo.alt;
        const layout = photo.sceneLayout;
        img.classList.toggle('is-reconstructed', Boolean(layout));
        if (img.parentElement?.classList.contains('ex-panel-frame')) {
            img.parentElement.style.backgroundImage = photo.sceneBackdrop ? `url("${photo.sceneBackdrop}")` : '';
        }
        if (layout) {
            img.style.setProperty('--scene-scale', layout.scale);
            img.style.setProperty('--scene-top', `${layout.top * 100}%`);
        } else {
            img.style.removeProperty('--scene-scale');
            img.style.removeProperty('--scene-top');
        }
    }
    function renderDetails(announce = false) {
        const item = current();
        if (!item) return;
        text('ex-counter', `${pad(selected + 1)} / ${pad(filtered.length)}`);
        $('ex-photo').setAttribute('aria-label', `Bekijk opstelling ${selected + 1} van dichtbij`);
        panels.forEach((panel, index) => panel.querySelector('button').setAttribute('aria-pressed', String(index === selected)));
        thumbnails.forEach((button, id) => button.setAttribute('aria-pressed', String(id === item.id)));
        const activeThumb = thumbnails.get(item.id);
        const strip = $('ex-filmstrip');
        if (activeThumb) {
            const left = activeThumb.offsetLeft - strip.offsetLeft;
            if (left < strip.scrollLeft || left + activeThumb.offsetWidth > strip.scrollLeft + strip.clientWidth) {
                strip.scrollTo({ left: Math.max(0, left - strip.clientWidth / 2 + activeThumb.offsetWidth / 2), behavior: behavior() });
            }
        }
        if (announce) status(`${item.title} · opstelling ${selected + 1} van ${filtered.length}`, true);
        if (dialog.open) renderViewer();
    }
    function select(index, announce = false) {
        if (!filtered.length) return;
        const target = Math.max(0, Math.min(index, filtered.length - 1));
        if (target === selected && !announce) return;
        selected = target;
        // Prepare the neighbouring photographs while the visitor is moving
        // through the scene, including jumps from the thumbnail strip.
        for (let i = Math.max(0, selected - 2); i <= Math.min(panels.length - 1, selected + 2); i++) {
            panels[i].querySelector('img').loading = 'eager';
        }
        imageSource(panels[selected].querySelector('img'), current().photos[0]);
        renderDetails(announce);
    }
    function updatePosition() {
        const maximum = limit();
        $('ex-progress').value = maximum ? String(Math.round(panorama.scrollLeft / maximum * 1000)) : '0';
        $('ex-progress').setAttribute('aria-valuetext', `${selected + 1} van ${filtered.length} opstellingen`);
        text('ex-position-label', panorama.scrollLeft < 3 ? 'Begin' : `${pad(selected + 1)} / ${pad(filtered.length)}`);
        $('ex-prev').disabled = !filtered.length || (panorama.scrollLeft <= 2 && selected === 0);
        $('ex-next').disabled = !filtered.length || (panorama.scrollLeft >= maximum - 2 && selected === filtered.length - 1);
    }
    function nearestPanel() {
        if (!filtered.length) return;
        // At the ends the viewport cannot centre the first/last panel.
        if (panorama.scrollLeft < 2) { select(0); return; }
        if (panorama.scrollLeft >= limit() - 2) { select(filtered.length - 1); return; }
        const center = panorama.scrollLeft + panorama.clientWidth / 2;
        let best = 0;
        let distance = Infinity;
        panels.forEach((panel, index) => {
            const middle = panel.offsetLeft - track.offsetLeft + panel.offsetWidth / 2;
            if (Math.abs(middle - center) < distance) { best = index; distance = Math.abs(middle - center); }
        });
        select(best);
    }
    function finishScroll() {
        programmatic = false;
        clearTimeout(settleTimer);
        nearestPanel(); updatePosition();
    }
    function show(index, announce = true) {
        if (!filtered.length) return;
        select(index, announce);
        const panel = panels[selected];
        const left = selected === 0 ? 0 : selected === filtered.length - 1 ? limit() : Math.max(0, Math.min(limit(), panel.offsetLeft - track.offsetLeft - (panorama.clientWidth - panel.offsetWidth) / 2));
        programmatic = true;
        clearTimeout(settleTimer);
        panorama.scrollTo({ left, behavior: behavior() });
        settleTimer = setTimeout(finishScroll, reducedMotion.matches ? 30 : 1000);
        updatePosition();
    }
    function change(direction) { setPlaying(false); show(selected + direction); }
    function stopMotion() {
        cancelAnimationFrame(animation); clearTimeout(reducedTimer);
        animation = undefined; lastFrame = undefined;
    }
    function runMotion() {
        stopMotion();
        if (!playing || !visible || document.hidden || dialog.open) return;
        if (reducedMotion.matches) {
            reducedTimer = setTimeout(() => {
                if (selected >= filtered.length - 1) setPlaying(false);
                else { show(selected + 1, false); runMotion(); }
            }, 8000);
            return;
        }
        let position = panorama.scrollLeft;
        const step = (timestamp) => {
            if (!playing) return;
            if (lastFrame !== undefined) position += Math.min(timestamp - lastFrame, 64) * .032;
            panorama.scrollLeft = position;
            lastFrame = timestamp;
            if (panorama.scrollLeft >= limit() - 1) { setPlaying(false); return; }
            animation = requestAnimationFrame(step);
        };
        animation = requestAnimationFrame(step);
    }
    function setPlaying(value) {
        playing = Boolean(value && filtered.length > 1);
        $('ex-play').setAttribute('aria-pressed', String(playing));
        text('ex-play-label', playing ? 'Pauzeer de rondgang' : 'Speel de rondgang');
        text('ex-play-icon', playing ? 'Ⅱ' : '▷');
        if (playing && panorama.scrollLeft >= limit() - 1) { panorama.scrollTo({ left: 0, behavior: 'instant' }); select(0, true); }
        runMotion();
    }
    function manualScroll() {
        setPlaying(false); programmatic = false; clearTimeout(settleTimer);
    }
    function renderCollection() {
        const fragment = document.createDocumentFragment();
        const stripFragment = document.createDocumentFragment();
        panels = []; thumbnails.clear();
        filtered.forEach((item, index) => {
            const panel = document.createElement('article'); panel.className = 'ex-panel';
            const button = document.createElement('button'); button.type = 'button'; button.className = 'ex-panel-button';
            button.setAttribute('aria-label', `${item.title}, bekijk van dichtbij`);
            button.setAttribute('aria-pressed', String(index === selected));
            const img = document.createElement('img'); img.className = 'ex-panel-image';
            img.width = 1800; img.height = 1200; img.loading = index < 3 ? 'eager' : 'lazy'; img.decoding = 'async'; img.draggable = false;
            imageSource(img, item.photos[0]);
            img.addEventListener('error', () => { status(`De foto van ${item.title} kon niet worden geladen.`); });
            const caption = document.createElement('span'); caption.className = 'ex-panel-caption';
            const number = document.createElement('span'); number.className = 'ex-panel-number'; number.textContent = pad(index + 1);
            const name = document.createElement('span'); name.className = 'ex-panel-title'; name.textContent = item.title;
            const frame = document.createElement('span'); frame.className = 'ex-panel-frame'; frame.append(img);
            if (item.photos[0].sceneBackdrop) frame.style.backgroundImage = `url("${item.photos[0].sceneBackdrop}")`;
            caption.append(number, name); button.append(frame, caption); panel.append(button); fragment.append(panel); panels.push(panel);
            button.addEventListener('click', () => { if (!suppressClick) { setPlaying(false); select(index, true); openViewer(); } });
            const thumb = document.createElement('button'); thumb.type = 'button'; thumb.className = 'ex-thumb';
            thumb.setAttribute('aria-label', `Opstelling ${index + 1}: ${item.title}`); thumb.setAttribute('aria-pressed', String(index === selected));
            const small = document.createElement('img'); small.src = item.photos[0].thumb; small.alt = ''; small.width = 96; small.height = 64; small.loading = 'lazy'; small.draggable = false;
            const title = document.createElement('span'); title.textContent = `Opstelling ${index + 1}`;
            thumb.append(small, title); thumb.addEventListener('click', () => { setPlaying(false); show(index); });
            stripFragment.append(thumb); thumbnails.set(item.id, thumb);
        });
        track.replaceChildren(fragment); $('ex-filmstrip').replaceChildren(stripFragment);
        text('ex-result-count', `${filtered.length} ${filtered.length === 1 ? 'opstelling' : 'opstellingen'}`);
        $('ex-empty').hidden = Boolean(filtered.length);
        $('ex-progress').disabled = filtered.length < 2;
        $('ex-play').disabled = filtered.length < 2;
        $('ex-photo').disabled = !filtered.length;
    }
    function filter() {
        manualScroll();
        const previousId = current()?.id;
        const query = normalize($('ex-search').value.trim());
        filtered = all.filter((item) => (category === 'Alle' || item.category === category) && normalize([item.title, item.botanical, item.club, item.style, item.age, item.badge].join(' ')).includes(query));
        selected = Math.max(0, filtered.findIndex((item) => item.id === previousId));
        renderCollection();
        if (filtered.length) { renderDetails(); show(selected, false); status('', true); }
        else {
            text('ex-counter', '00 / 00');
            status('Geen opstellingen gevonden. Probeer een andere zoekterm.');
            updatePosition();
        }
    }
    function setViewerZoom(zoom, focus = false) {
        viewerZoom = zoom;
        const wrap = $('ex-dialog-image-wrap');
        wrap.classList.toggle('is-zoomed', viewerZoom);
        $('ex-dialog-zoom').setAttribute('aria-pressed', String(viewerZoom));
        text('ex-dialog-zoom', viewerZoom ? 'Uitzoomen' : 'Inzoomen');
        if (viewerZoom) {
            const img = $('ex-dialog-image');
            wrap.scrollLeft = Math.max(0, (img.width - wrap.clientWidth) / 2);
            wrap.scrollTop = Math.max(0, img.height * .38 - wrap.clientHeight / 2);
            if (focus) wrap.focus({ preventScroll: true });
        } else { wrap.scrollLeft = 0; wrap.scrollTop = 0; }
    }
    async function renderViewer() {
        const item = current(); if (!item) return;
        const asset = item.photos[0]; if (!asset) return;
        const ticket = ++dialogGeneration;
        text('ex-dialog-title', `Opstelling ${selected + 1}`);
        text('ex-dialog-label', 'NBS 2026 · Van dichtbij');
        text('ex-dialog-caption', `${selected + 1} / ${filtered.length}`);
        $('ex-dialog-prev').disabled = selected === 0; $('ex-dialog-next').disabled = selected === filtered.length - 1;
        const img = $('ex-dialog-image'); img.style.opacity = '0'; img.src = asset.src; img.alt = asset.alt; img.width = asset.width; img.height = asset.height; img.style.setProperty('--ex-detail-width', `${asset.width}px`);
        try { await img.decode(); } catch { text('ex-dialog-caption', 'Het beeld kon niet worden geladen.'); }
        if (ticket === dialogGeneration) { img.style.opacity = '1'; setViewerZoom(viewerZoom); }
    }
    function openViewer() {
        if (!current()) return;
        setPlaying(false); setViewerZoom(false); dialog.showModal(); renderViewer();
    }
    root.querySelectorAll('[data-ex-filter]').forEach((button) => button.addEventListener('click', () => {
        category = button.dataset.exFilter;
        root.querySelectorAll('[data-ex-filter]').forEach((other) => other.setAttribute('aria-pressed', String(other === button))); filter();
    }));
    $('ex-search').addEventListener('input', filter);
    root.querySelector('.ex-index').addEventListener('toggle', (event) => {
        if (event.target.open && current()) renderDetails();
    });
    $('ex-prev').addEventListener('click', () => change(-1)); $('ex-next').addEventListener('click', () => change(1));
    $('ex-play').addEventListener('click', () => setPlaying(!playing)); $('ex-photo').addEventListener('click', () => openViewer());
    $('ex-dialog-close').addEventListener('click', () => dialog.close());
    $('ex-dialog-prev').addEventListener('click', () => change(-1)); $('ex-dialog-next').addEventListener('click', () => change(1));
    $('ex-dialog-zoom').addEventListener('click', () => setViewerZoom(!viewerZoom, true));
    dialog.addEventListener('click', (event) => {
        const rect = dialog.getBoundingClientRect();
        if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
    root.addEventListener('keydown', (event) => {
        if (event.target.matches('input, textarea') || (dialog.open && (viewerZoom && event.target === $('ex-dialog-image-wrap')))) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); change(event.key === 'ArrowLeft' ? -1 : 1); }
        if (event.target === panorama && (event.key === 'Home' || event.key === 'End')) { event.preventDefault(); setPlaying(false); show(event.key === 'Home' ? 0 : filtered.length - 1); }
    });
    panorama.addEventListener('scroll', () => {
        cancelAnimationFrame(scrollFrame);
        scrollFrame = requestAnimationFrame(() => { if (!programmatic) nearestPanel(); updatePosition(); });
    }, { passive: true });
    panorama.addEventListener('scrollend', finishScroll);
    panorama.addEventListener('wheel', (event) => {
        if (event.ctrlKey || !filtered.length) return;
        manualScroll();
        if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
        const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? panorama.clientWidth : 1);
        if ((delta > 0 && panorama.scrollLeft < limit() - 1) || (delta < 0 && panorama.scrollLeft > 1)) {
            event.preventDefault(); panorama.scrollLeft += delta;
        }
    }, { passive: false });
    panorama.addEventListener('pointerdown', (event) => {
        manualScroll(); suppressClick = false;
        if (event.pointerType !== 'mouse' || event.button !== 0) return;
        drag = { x: event.clientX, left: panorama.scrollLeft, pointer: event.pointerId, moved: false };
    });
    panorama.addEventListener('pointermove', (event) => {
        if (!drag || event.pointerId !== drag.pointer) return;
        const distance = event.clientX - drag.x;
        if (!drag.moved && Math.abs(distance) > 6) { drag.moved = true; panorama.setPointerCapture(event.pointerId); panorama.classList.add('is-dragging'); }
        if (drag.moved) { event.preventDefault(); panorama.scrollLeft = drag.left - distance; }
    });
    function endDrag() {
        if (drag?.moved) { suppressClick = true; setTimeout(() => { suppressClick = false; }, 0); }
        drag = undefined; panorama.classList.remove('is-dragging');
    }
    window.addEventListener('pointerup', endDrag); panorama.addEventListener('pointercancel', endDrag);
    panorama.addEventListener('lostpointercapture', endDrag);
    panorama.addEventListener('dragstart', (event) => event.preventDefault());
    $('ex-progress').addEventListener('input', () => { manualScroll(); panorama.scrollTo({ left: Number($('ex-progress').value) / 1000 * limit(), behavior: 'instant' }); nearestPanel(); updatePosition(); });
    document.addEventListener('visibilitychange', runMotion);
    reducedMotion.addEventListener('change', runMotion);
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; runMotion(); }, { threshold: .1 }).observe(root.querySelector('.ex-showcase'));
    new ResizeObserver(() => { if (!drag && !playing && filtered.length) show(selected, false); }).observe(panorama);
    renderCollection(); renderDetails(); updatePosition();
})();
