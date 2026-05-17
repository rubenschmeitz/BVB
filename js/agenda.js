document.addEventListener('DOMContentLoaded', () => {
    // 1. Precise 2026 Agenda Data (Club Nights + Real External Dutch/Belgian Events + NBV Masterclasses)
    const agendaEvents = [
        {
            id: 'ext-feb-trophy',
            title: 'The Trophy 2026 (Noelanders Trophy)',
            startDate: '2026-02-28',
            endDate: '2026-03-01',
            startTime: '09:00',
            endTime: '18:00',
            location: 'Limburghal, Genk, België',
            type: 'event',
            tag: 'Evenement',
            description: 'De absolute koningin onder de Europese bonsai-shows met een spectaculaire internationale tentoonstelling, de befaamde European Bonsai Pottery Contest en demonstraties van wereldfaam.',
            detailsUrl: 'https://www.bonsaiassociation.be'
        },
        {
            id: 'ext-may-hasselt',
            title: 'Bonsai Festival Hasselt 2026',
            startDate: '2026-05-09',
            endDate: '2026-05-10',
            startTime: '10:00',
            endTime: '17:00',
            location: 'Japanse Tuin, Hasselt, België',
            type: 'event',
            tag: 'Evenement',
            description: 'Jaarlijks Bonsai Festival in de adembenemende Japanse Tuin van Hasselt. Diverse Belgische bonsai-verenigingen presenteren hun topstukken met live vormgevingsdemonstraties en een sfeervolle markt.',
            detailsUrl: 'https://www.japansetuin.be'
        },
        {
            id: 'bvb-may-club',
            title: 'Werken aan eigen bomen',
            startDate: '2026-05-18',
            startTime: '19:30',
            endTime: '22:00',
            location: 'De Moerkoal, Berlicum',
            type: 'club',
            tag: 'Werkavond',
            extraInfo: 'Let op: Deze bijeenkomst is op 18 mei i.v.m. tweede Pinksterdag.',
            description: 'Onder deskundige begeleiding werken aan je eigen bonsai. De ideale gelegenheid voor advies over vormgeving of verzorging.'
        },
        {
            id: 'ext-may-apeldoorn',
            title: 'Bonsai Tentoonstelling Apeldoorn',
            startDate: '2026-05-30',
            endDate: '2026-05-31',
            startTime: '10:00',
            endTime: '17:00',
            location: 'Tuinland Wilp, Apeldoorn',
            type: 'event',
            tag: 'Evenement',
            description: 'Prachtige tweedaagse show georganiseerd door Bonsai Vereniging Apeldoorn bij Tuinland Wilp. Bewonder hoogwaardige creaties van leden, krijg styling-advies en bewerkingsdemonstraties. Toegang is gratis.',
            detailsUrl: 'http://www.bonsaiverenigingapeldoorn.nl'
        },
        {
            id: 'ext-june-westen',
            title: 'Bonsai van het Westen 2026',
            startDate: '2026-06-13',
            endDate: '2026-06-14',
            startTime: '10:00',
            endTime: '17:00',
            location: 'Hortus Botanicus, Delft',
            type: 'event',
            tag: 'Evenement',
            description: 'Een van de grootste bonsai-evenementen van Nederland met tentoonstelling, markt, demonstraties en workshops in de prachtige Botanische Tuin van Delft.',
            detailsUrl: 'https://www.bonsaivanhetwesten.nl'
        },
        {
            id: 'bvb-june-nbs',
            title: 'Selectie NBS & Opstelling maken',
            startDate: '2026-06-29',
            startTime: '19:30',
            endTime: '22:00',
            location: 'De Moerkoal, Berlicum',
            type: 'club',
            tag: 'NBS Selectie',
            description: 'Selectie van bomen voor de NBS-tentoonstelling en het gezamenlijk bepalen van de presentatie-opstelling.'
        },
        {
            id: 'nbv-july-noelanders',
            title: 'Masterclass Marc Noelanders',
            startDate: '2026-07-18',
            startTime: '10:00',
            endTime: '16:00',
            location: 'Landelijke locatie NBV, Nederland',
            type: 'nbv',
            tag: 'Masterclass',
            description: 'Exclusieve en leerzame masterclass onder leiding van de wereldberoemde bonsai-meester Marc Noelanders. Georganiseerd door de Nederlandse Bonsai Vereniging (NBV). Een unieke kans om je boom onder deskundige begeleiding naar een hoger niveau te tillen.',
            detailsUrl: 'https://bonsainederland.nl'
        },
        {
            id: 'bvb-aug-club',
            title: 'Werken aan eigen bomen',
            startDate: '2026-08-31',
            startTime: '19:30',
            endTime: '22:00',
            location: 'De Moerkoal, Berlicum',
            type: 'club',
            tag: 'Werkavond',
            description: 'Onder deskundige begeleiding werken aan je eigen bonsai. De ideale gelegenheid voor advies over vormgeving of verzorging.'
        },
        {
            id: 'ext-sept-rijnmond',
            title: 'Bonsai Tentoonstelling Rijnmond 2026',
            startDate: '2026-09-05',
            endDate: '2026-09-06',
            startTime: '10:00',
            endTime: '17:00',
            location: 'Vlaardingen, Nederland',
            type: 'event',
            tag: 'Evenement',
            description: 'De tweejaarlijkse clubtentoonstelling van Bonsai Vereniging Rijnmond met prachtige bomen van leden, clinics voor beginners en ervaren hobbyisten, en verkoopstands.',
            detailsUrl: 'https://www.bonsaivereniging-rijnmond.nl'
        },
        {
            id: 'nbv-sept-uden',
            title: 'Masterclass Pieter van Uden',
            startDate: '2026-09-13',
            startTime: '10:00',
            endTime: '16:00',
            location: 'Landelijke locatie NBV, Nederland',
            type: 'nbv',
            tag: 'Masterclass',
            description: 'Diepgaande en praktijkgerichte masterclass verzorgd door de bekende Nederlandse bonsai-expert Pieter van Uden. Georganiseerd door de Nederlandse Bonsai Vereniging (NBV) met de focus op geavanceerde vormgeving en presentatietechnieken.',
            detailsUrl: 'https://bonsainederland.nl'
        },
        {
            id: 'bvb-sept-styling',
            title: 'NBS Presentatie: De laatste hand',
            startDate: '2026-09-21',
            startTime: '19:30',
            endTime: '22:00',
            location: 'De Moerkoal, Berlicum',
            type: 'club',
            tag: 'NBS Styling',
            extraInfo: 'Extra bijeenkomst i.v.m. de Nationale Bonsai Show.',
            description: 'Laatste voorbereidingen voor de NBS-tentoonstelling: selecteren van tafels, scrolls, accentplanten en mossen.'
        },
        {
            id: 'bvb-sept-nbs-main',
            title: 'Nationale Bonsai Show (NBS) 2026',
            startDate: '2026-09-26',
            endDate: '2026-09-27',
            startTime: '09:00',
            endTime: '17:00',
            location: 'De Moerkoal, Berlicum',
            type: 'event',
            tag: 'Hoogtepunt',
            description: 'Hét landelijke evenement met grote tentoonstelling, markt en expert demo\'s. Onze vereniging is dit jaar de trotse gastheer.',
            detailsUrl: 'nbs.html'
        },
        {
            id: 'ext-oct-vlaanderen',
            title: 'Bonsai Show Bonsai Vlaanderen',
            startDate: '2026-10-10',
            endDate: '2026-10-11',
            startTime: '10:00',
            endTime: '18:00',
            location: 'Brugge, België',
            type: 'event',
            tag: 'Evenement',
            description: 'De grote najaarstentoonstelling van Bonsai Vlaanderen met hoogwaardige bomen, internationale demonstrateurs en een uitgebreide Bonsaimarkt.',
            detailsUrl: 'https://www.bonsaivlaanderen.be'
        },
        {
            id: 'ext-oct-zuidholland',
            title: 'Herfst Expositie BV Zuid-Holland 2026',
            startDate: '2026-10-24',
            endDate: '2026-10-25',
            startTime: '10:00',
            endTime: '16:30',
            location: 'Boskoop, Nederland',
            type: 'event',
            tag: 'Evenement',
            description: 'Regionale najaarsexpositie in het hart van de boomkwekerijregio Boskoop, met schitterende satsuki azalea\'s en jeneverbomen, deskundig styling-advies en verkoop van startmateriaal.',
            detailsUrl: 'https://www.bvz-h.nl'
        },
        {
            id: 'bvb-oct-lecture',
            title: 'Herfst & Bonsai (Lezing)',
            startDate: '2026-10-26',
            startTime: '19:30',
            endTime: '22:00',
            location: 'De Moerkoal, Berlicum',
            type: 'club',
            tag: 'Lezing',
            description: 'Expert Bart Verstappen vertelt alles over herfstverzorging, winterbescherming en voorbereiding op de winterrust van je bonsai.'
        },
        {
            id: 'ext-nov-tenshi',
            title: 'Tenshi Bonsai Najaarsshow',
            startDate: '2026-11-14',
            endDate: '2026-11-15',
            startTime: '10:00',
            endTime: '17:00',
            location: 'Arnhem, Nederland',
            type: 'event',
            tag: 'Evenement',
            description: 'Gespecialiseerde najaarsexpositie met focus op loofbomen in adembenemende herfstkleuren, inclusief clinics en markt.',
            detailsUrl: 'https://bonsainederland.nl'
        },
        {
            id: 'ext-nov-bab',
            title: 'Bonsai Association Belgium Autumn Show',
            startDate: '2026-11-21',
            endDate: '2026-11-22',
            startTime: '10:00',
            endTime: '18:00',
            location: 'Zwijndrecht, België',
            type: 'event',
            tag: 'Evenement',
            description: 'Grote nationale najaarsshow georganiseerd door de Belgische Bonsai Associatie met topbomen uit heel België en de buurlanden, en lezingen door internationale meesters.',
            detailsUrl: 'https://www.bonsaiassociation.be'
        },
        {
            id: 'bvb-nov-swap',
            title: 'Ruilbeurs & Jaarafsluiting',
            startDate: '2026-11-30',
            startTime: '19:30',
            endTime: '22:00',
            location: 'De Moerkoal, Berlicum',
            type: 'club',
            tag: 'Ruilbeurs',
            description: 'Onze gezellige jaarlijkse ruilbeurs: neem bomen, schalen of gereedschap mee om te ruilen of te verkopen. Tevens de laatste officiële clubavond van 2026.'
        }
    ];

    // State Variables
    let currentView = 'list'; // 'list' or 'calendar'
    let currentFilter = 'club'; // Default filter is set to BVB Activiteiten ('club')
    
    // Set default month to May 2026 (first event)
    let calendarYear = 2026;
    let calendarMonth = 4; // May (0-indexed)

    // DOM Elements
    const dynamicContainer = document.getElementById('agenda-dynamic-content');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const viewButtons = document.querySelectorAll('.toggle-btn');

    // Months of the year names in Dutch
    const dutchMonths = [
        'januari', 'februari', 'maart', 'april', 'mei', 'juni',
        'juli', 'augustus', 'september', 'oktober', 'november', 'december'
    ];

    // Get today's date formatted as YYYY-MM-DD
    function getTodayDateStr() {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // Initialize Page View
    initView();

    function initView() {
        // Register Filter Click Events
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.getAttribute('data-filter');
                render();
            });
        });

        // Register View Toggle Events
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                viewButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                if (btn.id === 'view-list') {
                    currentView = 'list';
                    dynamicContainer.classList.add('list-view');
                    dynamicContainer.classList.remove('calendar-view');
                } else {
                    currentView = 'calendar';
                    dynamicContainer.classList.add('calendar-view');
                    dynamicContainer.classList.remove('list-view');
                }
                render();
            });
        });

        // Render initial state
        render();
    }

    function render() {
        if (currentView === 'list') {
            renderListView();
        } else {
            renderCalendarView();
        }
    }

    // LIST VIEW RENDERER (Filters out past events automatically)
    function renderListView() {
        let filteredEvents = getFilteredEvents();

        // Automatically hide events that have already passed based on start/end date
        const todayStr = getTodayDateStr();
        filteredEvents = filteredEvents.filter(evt => {
            const eventCompareDate = evt.endDate || evt.startDate;
            return eventCompareDate >= todayStr;
        });

        if (filteredEvents.length === 0) {
            dynamicContainer.innerHTML = `
                <div class="no-events-card" style="text-align: center; padding: 3rem; background: white; border-radius: 12px; border: 1px solid #eaeaea;">
                    <p style="font-size: 1.1rem; color: #666;">Geen toekomstige activiteiten gevonden voor dit filter.</p>
                </div>
            `;
            return;
        }

        let html = '<div class="agenda-container" style="display: flex; flex-direction: column; gap: 2rem;">';

        filteredEvents.forEach(evt => {
            const startD = new Date(evt.startDate);
            const startDayNum = startD.getDate();
            const startMonthStr = startD.toLocaleString('nl-NL', { month: 'short' });
            const startYearNum = startD.getFullYear();
            const weekdayStr = startD.toLocaleString('nl-NL', { weekday: 'long' });

            let displayDate = `${startDayNum}`;
            let displayMonthYear = `${startMonthStr.toUpperCase()} ${startYearNum}`;
            let displayWeekday = weekdayStr.charAt(0).toUpperCase() + weekdayStr.slice(1);

            // Handle multi-day events
            if (evt.endDate) {
                const endD = new Date(evt.endDate);
                const endDayNum = endD.getDate();
                displayDate = `${startDayNum} & ${endDayNum}`;
                displayWeekday = 'Weekend';
            }

            // Custom border / tag styling for Highlights (NBS)
            const isHighlight = evt.tag === 'Hoogtepunt';
            const cardStyle = isHighlight ? 'border: 2px solid var(--color-bark); background: #fdfaf7;' : '';
            const tagStyle = isHighlight ? 'background: var(--color-bark); color: white;' : (evt.type === 'event' ? 'background: rgba(140, 106, 92, 0.1); color: var(--color-bark);' : (evt.type === 'nbv' ? 'background: rgba(194, 155, 56, 0.1); color: #C29B38;' : ''));

            // Construct add to calendar option values
            const calendarEndDate = evt.endDate || evt.startDate;

            html += `
                <div class="agenda-item" style="${cardStyle}">
                    <div class="agenda-header-flex">
                        <div class="date-box">
                            <span class="day-num">${displayDate}</span>
                            <div class="month-year">
                                <span class="month">${displayMonthYear}</span>
                                <span class="weekday">${displayWeekday}</span>
                            </div>
                        </div>
                        <span class="event-tag" style="${tagStyle}">${evt.tag}</span>
                    </div>
                    <div class="event-details">
                        <h3 style="font-size: 1.25rem; margin-bottom: 0.3rem;">${evt.title}</h3>
                        ${evt.extraInfo ? `<p style="font-size: 0.95rem; line-height: 1.5; color: var(--color-bark); font-weight: 600; margin-bottom: 0.5rem;">${evt.extraInfo}</p>` : ''}
                        <p style="font-size: 0.95rem; line-height: 1.5; color: #444; margin-bottom: 1rem;">${evt.description}</p>
                        
                        <div class="event-meta" style="display: flex; gap: 1.5rem; flex-wrap: wrap; margin-bottom: 1rem; color: #666; font-size: 0.9rem;">
                            <div class="meta-item" style="display: flex; align-items: center; gap: 6px;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                <span>${evt.startTime} - ${evt.endTime} uur</span>
                            </div>
                            <div class="meta-item" style="display: flex; align-items: center; gap: 6px;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="12" r="3"/></svg>
                                <span>${evt.location}</span>
                            </div>
                        </div>

                        <div style="margin-top: 1rem; display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;">
                            <add-to-calendar-button hideBackground
                                name="${evt.title}"
                                startDate="${evt.startDate}"
                                endDate="${calendarEndDate}"
                                startTime="${evt.startTime}"
                                endTime="${evt.endTime}"
                                location="${evt.location}"
                                options="'Apple','Google','iCal','Microsoft365','Outlook.com'"
                                label="Zet in mijn agenda"
                                lightMode="light"
                                styleLight="--btn-background: ${isHighlight ? 'var(--color-bark)' : (evt.type === 'nbv' ? '#C29B38' : 'var(--color-sage)')}; --btn-text: #fff; --font: var(--font-main); --btn-padding: 8px 16px; --btn-font-size: 0.9rem;"
                            ></add-to-calendar-button>
                            ${evt.detailsUrl ? `<a href="${evt.detailsUrl}" ${evt.detailsUrl.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''} class="nav-special" style="text-decoration: none; padding: 8px 16px; font-size: 0.9rem;">Meer informatie</a>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';

        dynamicContainer.innerHTML = html;

        // Force calendar buttons to parse and render
        if (window.atcb_init) {
            window.atcb_init();
        }
    }

    // CALENDAR VIEW RENDERER
    function renderCalendarView() {
        const filteredEvents = getFilteredEvents();

        // Build navigation and monthly header grid
        let html = `
            <div class="calendar-view-wrapper">
                <div class="calendar-header">
                    <button class="calendar-nav-btn" id="prev-month" aria-label="Vorige maand">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <h3>${dutchMonths[calendarMonth]} ${calendarYear}</h3>
                    <button class="calendar-nav-btn" id="next-month" aria-label="Volgende maand">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                </div>
                
                <div class="calendar-grid">
                    <div class="calendar-day-name">ma</div>
                    <div class="calendar-day-name">di</div>
                    <div class="calendar-day-name">wo</div>
                    <div class="calendar-day-name">do</div>
                    <div class="calendar-day-name">vr</div>
                    <div class="calendar-day-name">za</div>
                    <div class="calendar-day-name">zo</div>
        `;

        // Calculate days to draw
        const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1);
        let startDayIndex = firstDayOfMonth.getDay() - 1; // Convert to Mon-Sun (0-6)
        if (startDayIndex === -1) startDayIndex = 6; // Sunday is 6

        const totalDaysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
        const prevMonthTotalDays = new Date(calendarYear, calendarMonth, 0).getDate();

        // Helper to check for events on specific day
        const getEventsForDate = (y, m, d) => {
            const searchDateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            return filteredEvents.filter(e => {
                if (e.endDate) {
                    return searchDateStr >= e.startDate && searchDateStr <= e.endDate;
                }
                return e.startDate === searchDateStr;
            });
        };

        // Render trailing days of previous month
        for (let i = startDayIndex - 1; i >= 0; i--) {
            const dayNum = prevMonthTotalDays - i;
            html += `<div class="calendar-cell other-month"><span class="calendar-day-number">${dayNum}</span></div>`;
        }

        // Render current month days
        const today = new Date();
        const isCurrentMonthYear = today.getFullYear() === calendarYear && today.getMonth() === calendarMonth;
        const currentDayNum = today.getDate();

        for (let day = 1; day <= totalDaysInMonth; day++) {
            const events = getEventsForDate(calendarYear, calendarMonth, day);
            const isToday = isCurrentMonthYear && day === currentDayNum;
            const todayClass = isToday ? 'today' : '';
            
            // Build dot indicators
            let dotsHtml = '';
            if (events.length > 0) {
                dotsHtml += '<div class="calendar-cell-dots">';
                events.forEach(e => {
                    const dotClass = e.type === 'club' ? 'club' : (e.type === 'nbv' ? 'nbv' : 'event');
                    dotsHtml += `<span class="calendar-cell-dot ${dotClass}" title="${e.title}"></span>`;
                });
                dotsHtml += '</div>';
            }

            html += `
                <div class="calendar-cell ${todayClass}" data-day="${day}">
                    <span class="calendar-day-number">${day}</span>
                    ${dotsHtml}
                </div>
            `;
        }

        // Render trailing days for the next month to fill grid (assuming 6 rows max, 42 cells total)
        const cellsRendered = startDayIndex + totalDaysInMonth;
        const remainingCells = 42 - cellsRendered;
        for (let i = 1; i <= remainingCells; i++) {
            html += `<div class="calendar-cell other-month"><span class="calendar-day-number">${i}</span></div>`;
        }

        html += `
                </div> <!-- End of calendar-grid -->
                
                <!-- Day Popover / Card showing selected events -->
                <div id="calendar-popover" class="calendar-event-popover">
                    <!-- Event details loaded here dynamically -->
                </div>
            </div> <!-- End of calendar-view-wrapper -->
        `;

        dynamicContainer.innerHTML = html;

        // Register Navigation Button Listeners
        document.getElementById('prev-month').addEventListener('click', () => {
            calendarMonth--;
            if (calendarMonth < 0) {
                calendarMonth = 11;
                calendarYear--;
            }
            renderCalendarView();
        });

        document.getElementById('next-month').addEventListener('click', () => {
            calendarMonth++;
            if (calendarMonth > 11) {
                calendarMonth = 0;
                calendarYear++;
            }
            renderCalendarView();
        });

        // Register Day Cell Click Listeners
        const cells = dynamicContainer.querySelectorAll('.calendar-cell:not(.other-month)');
        const popover = document.getElementById('calendar-popover');

        cells.forEach(cell => {
            cell.addEventListener('click', () => {
                // Highlight active cell
                cells.forEach(c => c.style.borderColor = 'transparent');
                cell.style.borderColor = 'var(--color-bark)';

                const day = parseInt(cell.getAttribute('data-day'));
                const events = getEventsForDate(calendarYear, calendarMonth, day);

                if (events.length > 0) {
                    popover.classList.add('active');
                    
                    // Determine dominant mode for popover styling
                    const dominantType = events[0].type;
                    popover.classList.remove('event-mode', 'nbv-mode');
                    if (dominantType === 'event') {
                        popover.classList.add('event-mode');
                    } else if (dominantType === 'nbv') {
                        popover.classList.add('nbv-mode');
                    }

                    let popoverHtml = '';
                    events.forEach((evt, idx) => {
                        const startD = new Date(evt.startDate);
                        const weekdayStr = startD.toLocaleString('nl-NL', { weekday: 'long' });
                        const weekdayCap = weekdayStr.charAt(0).toUpperCase() + weekdayStr.slice(1);
                        const isHighlight = evt.tag === 'Hoogtepunt';

                        popoverHtml += `
                            ${idx > 0 ? '<hr style="border: 0; border-top: 1px solid #eaeaea; margin: 1.5rem 0;">' : ''}
                            <div class="calendar-popover-header">
                                <span class="calendar-popover-tag ${evt.type}">${evt.tag}</span>
                                <span style="font-size: 0.85rem; color: #888; font-weight: 500;">
                                    ${weekdayCap} ${day} ${dutchMonths[calendarMonth]}
                                </span>
                            </div>
                            <h4 style="font-size: 1.2rem; margin: 0.3rem 0; color: #222;">${evt.title}</h4>
                            ${evt.extraInfo ? `<p style="font-size: 0.9rem; color: var(--color-bark); font-weight: 600; margin: 0.3rem 0;">${evt.extraInfo}</p>` : ''}
                            <p style="font-size: 0.95rem; line-height: 1.5; color: #444; margin-bottom: 1rem;">${evt.description}</p>
                            
                            <div class="event-meta" style="display: flex; gap: 1.2rem; flex-wrap: wrap; margin-bottom: 1rem; color: #666; font-size: 0.85rem;">
                                <div class="meta-item" style="display: flex; align-items: center; gap: 4px;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                    <span>${evt.startTime} - ${evt.endTime} uur</span>
                                </div>
                                <div class="meta-item" style="display: flex; align-items: center; gap: 4px;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="12" r="3"/></svg>
                                    <span>${evt.location}</span>
                                </div>
                            </div>

                            <div style="margin-top: 1rem; display: flex; gap: 0.8rem; flex-wrap: wrap; align-items: center;">
                                <add-to-calendar-button hideBackground
                                    name="${evt.title}"
                                    startDate="${evt.startDate}"
                                    endDate="${evt.endDate || evt.startDate}"
                                    startTime="${evt.startTime}"
                                    endTime="${evt.endTime}"
                                    location="${evt.location}"
                                    options="'Apple','Google','iCal','Microsoft365','Outlook.com'"
                                    label="Zet in mijn agenda"
                                    lightMode="light"
                                    styleLight="--btn-background: ${isHighlight ? 'var(--color-bark)' : (evt.type === 'nbv' ? '#C29B38' : 'var(--color-sage)')}; --btn-text: #fff; --font: var(--font-main); --btn-padding: 6px 12px; --btn-font-size: 0.85rem;"
                                ></add-to-calendar-button>
                                ${evt.detailsUrl ? `<a href="${evt.detailsUrl}" ${evt.detailsUrl.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''} class="nav-special" style="text-decoration: none; padding: 6px 12px; font-size: 0.85rem;">Meer informatie</a>` : ''}
                            </div>
                        `;
                    });

                    popover.innerHTML = popoverHtml;
                    
                    // Force calendar buttons to parse
                    if (window.atcb_init) {
                        window.atcb_init();
                    }
                } else {
                    popover.classList.add('active');
                    popover.classList.remove('event-mode', 'nbv-mode');
                    popover.innerHTML = `
                        <div style="text-align: center; color: #888; padding: 1rem 0;">
                            <p style="margin: 0; font-size: 0.95rem; font-weight: 500;">
                                Geen activiteiten gepland op ${day} ${dutchMonths[calendarMonth]} ${calendarYear}.
                            </p>
                        </div>
                    `;
                }
            });
        });

        // By default, if the current display month has events, auto-click the first day with an event to wow the user!
        const monthEvents = filteredEvents.filter(e => {
            const d = new Date(e.startDate);
            return d.getFullYear() === calendarYear && d.getMonth() === calendarMonth;
        });

        if (monthEvents.length > 0) {
            const firstEventDayNum = new Date(monthEvents[0].startDate).getDate();
            const correspondingCell = Array.from(cells).find(c => parseInt(c.getAttribute('data-day')) === firstEventDayNum);
            if (correspondingCell) {
                setTimeout(() => correspondingCell.click(), 100);
            }
        } else {
            // Auto click today or first day
            const defaultCell = isCurrentMonthYear ? Array.from(cells).find(c => parseInt(c.getAttribute('data-day')) === currentDayNum) : cells[0];
            if (defaultCell) {
                setTimeout(() => defaultCell.click(), 100);
            }
        }
    }

    // Helper to get events matching the current active filter
    function getFilteredEvents() {
        return agendaEvents.filter(evt => {
            if (currentFilter === 'all') return true;
            return evt.type === currentFilter;
        });
    }
});
