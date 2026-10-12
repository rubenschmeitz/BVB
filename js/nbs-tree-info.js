/* Optional information layer; the panorama continues to own selection and viewing. */
(() => {
    const root = document.querySelector('[data-nbs-exhibition]');
    const catalog = window.BVB_NBS_EXHIBITION;
    if (!root || !catalog) return;
    const track = root.querySelector('.ex-panorama-track');
    const dialog = root.querySelector('#ex-dialog');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ex-tree-info-button';
    button.id = 'ex-tree-info-button';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'ex-tree-info');
    const icon = document.createElement('span');
    icon.className = 'ex-info-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = 'i';
    button.append(icon, document.createTextNode(' Boominformatie'));
    root.querySelector('.ex-actions').prepend(button);

    const panel = document.createElement('section');
    panel.id = 'ex-tree-info';
    panel.className = 'ex-tree-info';
    panel.hidden = true;
    panel.setAttribute('aria-label', 'Informatie over de geselecteerde boom');
    root.querySelector('.ex-story').after(panel);

    const detail = document.createElement('details');
    detail.id = 'ex-dialog-tree-info';
    detail.className = 'ex-tree-info ex-tree-info-dialog';
    detail.open = true;
    const summary = document.createElement('summary');
    summary.textContent = 'Boominformatie';
    const detailBody = document.createElement('div');
    detail.append(summary, detailBody);
    dialog.querySelector('.ex-dialog-header').after(detail);

    const fields = [['botanical', 'Botanische naam'], ['club', 'Vereniging'],
        ['style', 'Stijl'], ['age', 'Leeftijd'], ['pot', 'Pot']];
    const byImage = new Map(catalog.exhibits.map(item => [
        new URL(item.photos[0].panorama || item.photos[0].medium, location.href).href, item
    ]));
    let selectedId;
    let frame;
    function fill(target, item, withTitle) {
        target.replaceChildren();
        if (withTitle) {
            const title = document.createElement('h3');
            title.textContent = item.title;
            target.append(title);
        }
        const list = document.createElement('dl');
        for (const [key, label] of fields) {
            if (!item[key]?.trim()) continue;
            const pair = document.createElement('div');
            const term = document.createElement('dt');
            const value = document.createElement('dd');
            term.textContent = label;
            value.textContent = item[key];
            pair.append(term, value);
            list.append(pair);
        }
        if (list.childElementCount) target.append(list);
        if (item.status === 'unconfirmed' || !list.childElementCount) {
            const note = document.createElement('p');
            note.textContent = 'De gegevens van deze boom zijn nog niet bevestigd.';
            target.append(note);
        }
    }
    function render() {
        frame = undefined;
        const img = track.querySelector('.ex-panel-button[aria-pressed="true"] img');
        const item = img && byImage.get(img.src);
        button.disabled = !item;
        if (!item) {
            panel.hidden = true;
            button.setAttribute('aria-expanded', 'false');
            detail.hidden = true;
            selectedId = undefined;
            return;
        }
        detail.hidden = false;
        button.setAttribute('aria-label', `Boominformatie: ${item.title}`);
        if (selectedId !== item.id) {
            fill(panel, item, true);
            fill(detailBody, item, false);
            selectedId = item.id;
        }
        if (dialog.open) dialog.querySelector('#ex-dialog-title').textContent = item.title;
    }
    const schedule = () => { if (frame === undefined) frame = requestAnimationFrame(render); };
    button.addEventListener('click', () => {
        panel.hidden = !panel.hidden;
        button.setAttribute('aria-expanded', String(!panel.hidden));
    });
    new MutationObserver(schedule).observe(track, {
        childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed']
    });
    new MutationObserver(() => {
        if (dialog.open) detail.open = true;
        schedule();
    }).observe(dialog, { attributes: true, attributeFilter: ['open'] });
    new MutationObserver(schedule).observe(dialog.querySelector('#ex-dialog-image'), {
        attributes: true, attributeFilter: ['src']
    });
    render();
})();
