(() => {
    const DEFAULT_OPTIONS = ['Apple', 'Google', 'iCal', 'Microsoft365', 'Outlook.com'];
    const TIME_ZONE = 'Europe/Amsterdam';

    const OPTION_LABELS = {
        Apple: 'Apple Agenda',
        Google: 'Google Agenda',
        iCal: 'iCal-bestand',
        Microsoft365: 'Microsoft 365',
        'Outlook.com': 'Outlook.com'
    };

    const pad = (value) => String(value).padStart(2, '0');

    const parseOptions = (value) => {
        if (!value) return DEFAULT_OPTIONS;
        return value
            .split(',')
            .map((option) => option.replace(/['"]/g, '').trim())
            .filter(Boolean);
    };

    const formatCompactDate = (date, time) => {
        const datePart = date.replace(/-/g, '');
        if (!time) return datePart;
        return `${datePart}T${time.replace(':', '')}00`;
    };

    const formatStamp = () => {
        const now = new Date();
        return `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
    };

    const icsEscape = (value) => String(value || '')
        .replace(/\\/g, '\\\\')
        .replace(/\n/g, '\\n')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,');

    const slugify = (value) => String(value || 'agenda')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'agenda';

    const buildEvent = (element) => {
        const startDate = element.getAttribute('startDate') || element.getAttribute('startdate') || '';
        const endDate = element.getAttribute('endDate') || element.getAttribute('enddate') || startDate;

        return {
            name: element.getAttribute('name') || 'Bonsai Vereniging Brabant',
            description: element.getAttribute('description') || '',
            location: element.getAttribute('location') || '',
            startDate,
            endDate,
            startTime: element.getAttribute('startTime') || element.getAttribute('starttime') || '',
            endTime: element.getAttribute('endTime') || element.getAttribute('endtime') || ''
        };
    };

    const buildIcs = (event) => {
        const timed = event.startTime && event.endTime;
        const dtStart = timed
            ? `DTSTART;TZID=${TIME_ZONE}:${formatCompactDate(event.startDate, event.startTime)}`
            : `DTSTART;VALUE=DATE:${formatCompactDate(event.startDate)}`;
        const dtEnd = timed
            ? `DTEND;TZID=${TIME_ZONE}:${formatCompactDate(event.endDate, event.endTime)}`
            : `DTEND;VALUE=DATE:${formatCompactDate(event.endDate)}`;

        return [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Bonsai Vereniging Brabant//Agenda//NL',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            `UID:${slugify(event.name)}-${event.startDate}@bonsai-brabant.nl`,
            `DTSTAMP:${formatStamp()}`,
            dtStart,
            dtEnd,
            `SUMMARY:${icsEscape(event.name)}`,
            `DESCRIPTION:${icsEscape(event.description)}`,
            `LOCATION:${icsEscape(event.location)}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');
    };

    const openIcsDownload = (event) => {
        const blob = new Blob([buildIcs(event)], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${slugify(event.name)}.ics`;
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const buildGoogleUrl = (event) => {
        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: event.name,
            details: event.description,
            location: event.location,
            ctz: TIME_ZONE,
            dates: `${formatCompactDate(event.startDate, event.startTime)}/${formatCompactDate(event.endDate, event.endTime)}`
        });
        return `https://calendar.google.com/calendar/render?${params.toString()}`;
    };

    const buildOutlookUrl = (event, baseUrl) => {
        const params = new URLSearchParams({
            path: '/calendar/action/compose',
            rru: 'addevent',
            subject: event.name,
            body: event.description,
            location: event.location,
            startdt: `${event.startDate}T${event.startTime || '09:00'}:00`,
            enddt: `${event.endDate}T${event.endTime || event.startTime || '10:00'}:00`
        });
        return `${baseUrl}/calendar/0/deeplink/compose?${params.toString()}`;
    };

    class BvbCalendarButton extends HTMLElement {
        connectedCallback() {
            if (this.shadowRoot) {
                this.addDocumentClickListener();
                return;
            }

            const event = buildEvent(this);
            const options = parseOptions(this.getAttribute('options'));
            const label = this.getAttribute('label') || 'Zet in agenda';
            const styleLight = this.getAttribute('styleLight') || this.getAttribute('stylelight') || '';

            const shadow = this.attachShadow({ mode: 'open' });
            const style = document.createElement('style');
            style.textContent = `
                :host {
                    display: inline-block;
                    position: relative;
                    font-family: var(--font-main, system-ui, sans-serif);
                }

                .calendar-button {
                    appearance: none;
                    border: 0;
                    border-radius: 999px;
                    background: var(--btn-background, var(--color-sage, #5D7B51));
                    color: var(--btn-text, #fff);
                    cursor: pointer;
                    font: 600 var(--btn-font-size, 0.9rem) var(--font, var(--font-main, system-ui, sans-serif));
                    padding: var(--btn-padding, var(--btn-padding-y, 8px) var(--btn-padding-x, 16px));
                    box-shadow: var(--btn-shadow, 0 6px 18px rgba(0, 0, 0, 0.15));
                    min-height: 34px;
                    white-space: nowrap;
                }

                .calendar-button:focus-visible,
                .calendar-menu a:focus-visible,
                .calendar-menu button:focus-visible {
                    outline: 2px solid currentColor;
                    outline-offset: 2px;
                }

                .calendar-menu {
                    position: absolute;
                    z-index: 30;
                    right: 0;
                    top: calc(100% + 6px);
                    min-width: 180px;
                    padding: 6px;
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    border-radius: 10px;
                    background: #fff;
                    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16);
                }

                .calendar-menu[hidden] {
                    display: none;
                }

                .calendar-menu a,
                .calendar-menu button {
                    display: block;
                    width: 100%;
                    border: 0;
                    border-radius: 7px;
                    background: transparent;
                    color: #2f261d;
                    cursor: pointer;
                    font: 600 0.9rem var(--font-main, system-ui, sans-serif);
                    padding: 9px 10px;
                    text-align: left;
                    text-decoration: none;
                }

                .calendar-menu a:hover,
                .calendar-menu button:hover {
                    background: rgba(93, 123, 81, 0.12);
                }
            `;

            const wrapper = document.createElement('span');
            wrapper.style.cssText = styleLight;

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'calendar-button';
            button.setAttribute('aria-expanded', 'false');
            button.textContent = label;

            const menu = document.createElement('div');
            menu.className = 'calendar-menu';
            menu.hidden = true;

            const toggleMenu = (forceState) => {
                const open = typeof forceState === 'boolean' ? forceState : menu.hidden;
                menu.hidden = !open;
                button.setAttribute('aria-expanded', String(open));
            };
            this.toggleMenu = toggleMenu;

            const addDownloadOption = (optionLabel) => {
                const option = document.createElement('button');
                option.type = 'button';
                option.textContent = optionLabel;
                option.addEventListener('click', () => {
                    openIcsDownload(event);
                    toggleMenu(false);
                });
                menu.append(option);
            };

            options.forEach((optionName) => {
                if (optionName === 'Apple' || optionName === 'iCal') {
                    addDownloadOption(OPTION_LABELS[optionName] || optionName);
                    return;
                }

                const option = document.createElement('a');
                option.target = '_blank';
                option.rel = 'noopener noreferrer';
                option.textContent = OPTION_LABELS[optionName] || optionName;

                if (optionName === 'Google') {
                    option.href = buildGoogleUrl(event);
                } else if (optionName === 'Microsoft365') {
                    option.href = buildOutlookUrl(event, 'https://outlook.office.com');
                } else if (optionName === 'Outlook.com') {
                    option.href = buildOutlookUrl(event, 'https://outlook.live.com');
                } else {
                    return;
                }

                option.addEventListener('click', () => toggleMenu(false));
                menu.append(option);
            });

            button.addEventListener('click', () => toggleMenu());

            this.handleDocumentClick = (event) => {
                if (!event.composedPath().includes(this)) {
                    toggleMenu(false);
                }
            };
            this.handleHostKeydown = (event) => {
                if (event.key === 'Escape') {
                    toggleMenu(false);
                    button.focus();
                }
            };
            this.addEventListener('keydown', this.handleHostKeydown);
            this.addDocumentClickListener();

            wrapper.append(button, menu);
            shadow.append(style, wrapper);
        }

        disconnectedCallback() {
            if (this.handleDocumentClick && this.documentClickListenerAttached) {
                document.removeEventListener('click', this.handleDocumentClick);
                this.documentClickListenerAttached = false;
            }
        }

        addDocumentClickListener() {
            if (!this.handleDocumentClick || this.documentClickListenerAttached) return;
            document.addEventListener('click', this.handleDocumentClick);
            this.documentClickListenerAttached = true;
        }
    }

    if (!customElements.get('add-to-calendar-button')) {
        customElements.define('add-to-calendar-button', BvbCalendarButton);
    }
})();
