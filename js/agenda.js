document.addEventListener('DOMContentLoaded', () => {
    const BVB = window.BVB || {};
    const agendaEvents = window.BVB_AGENDA_EVENTS || [];

    let currentView = 'list'; // 'list' or 'calendar'
    let currentFilter = 'club'; // Default filter is set to BVB Activiteiten ('club')
    
    // Set default month to May 2026 (first event)
    let calendarYear = 2026;
    let calendarMonth = 4; // May (0-indexed)

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

    function refreshAgendaEffects() {
        if (!dynamicContainer) return;

        const revealTargets = dynamicContainer.querySelectorAll('.reveal-on-scroll');
        if (!revealTargets.length) return;

        revealTargets.forEach(target => target.classList.remove('active'));

        requestAnimationFrame(() => {
            if (typeof BVB.initRevealObservers === 'function') {
                BVB.initRevealObservers();
            } else if (typeof initRevealObservers === 'function') {
                initRevealObservers();
            } else {
                revealTargets.forEach(target => target.classList.add('active'));
            }
        });
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
                <div class="no-events-card reveal-on-scroll">
                    <p>Geen toekomstige activiteiten gevonden voor dit filter.</p>
                </div>
            `;
            refreshAgendaEffects();
            return;
        }

        let html = '<div class="agenda-container agenda-list-stack reveal-staggered reveal-on-scroll">';

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
            const tagClass = isHighlight ? 'highlight' : evt.type;

            // Construct add to calendar option values
            const calendarEndDate = evt.endDate || evt.startDate;

            html += `
                <div class="agenda-item ${isHighlight ? 'is-highlight' : ''}">
                    <div class="agenda-header-flex">
                        <div class="date-box">
                            <span class="day-num">${displayDate}</span>
                            <div class="month-year">
                                <span class="month">${displayMonthYear}</span>
                                <span class="weekday">${displayWeekday}</span>
                            </div>
                        </div>
                        <span class="event-tag ${tagClass}">${evt.tag}</span>
                    </div>
                    <div class="event-details">
                        <h3 class="event-title">${evt.title}</h3>
                        ${evt.extraInfo ? `<p class="event-extra">${evt.extraInfo}</p>` : ''}
                        <p class="event-description">${evt.description}</p>
                        
                        <div class="event-meta">
                            <div class="meta-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                <span>${evt.startTime} - ${evt.endTime} uur</span>
                            </div>
                            <div class="meta-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="12" r="3"/></svg>
                                <span>${evt.location}</span>
                            </div>
                        </div>

                        <div class="event-actions">
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
                            ${evt.detailsUrl ? `<a href="${evt.detailsUrl}" ${evt.detailsUrl.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''} class="nav-special agenda-more-link">Meer informatie</a>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';

        dynamicContainer.innerHTML = html;

        refreshAgendaEffects();
    }

    // CALENDAR VIEW RENDERER
    function renderCalendarView() {
        const filteredEvents = getFilteredEvents();

        // Build navigation and monthly header grid
        let html = `
            <div class="calendar-view-wrapper reveal-on-scroll">
                <div class="calendar-header">
                    <button type="button" class="calendar-nav-btn" id="prev-month" aria-label="Vorige maand">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <h3>${dutchMonths[calendarMonth]} ${calendarYear}</h3>
                    <button type="button" class="calendar-nav-btn" id="next-month" aria-label="Volgende maand">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                </div>
                
                <div class="calendar-grid reveal-staggered reveal-on-scroll">
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
                            ${idx > 0 ? '<hr class="calendar-divider">' : ''}
                            <div class="calendar-popover-header">
                                <span class="calendar-popover-tag ${evt.type}">${evt.tag}</span>
                                <span class="calendar-popover-date">
                                    ${weekdayCap} ${day} ${dutchMonths[calendarMonth]}
                                </span>
                            </div>
                            <h4 class="calendar-popover-title">${evt.title}</h4>
                            ${evt.extraInfo ? `<p class="calendar-popover-extra">${evt.extraInfo}</p>` : ''}
                            <p class="event-description">${evt.description}</p>
                            
                            <div class="event-meta">
                                <div class="meta-item">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                    <span>${evt.startTime} - ${evt.endTime} uur</span>
                                </div>
                                <div class="meta-item">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="12" r="3"/></svg>
                                    <span>${evt.location}</span>
                                </div>
                            </div>

                            <div class="event-actions compact">
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
                                ${evt.detailsUrl ? `<a href="${evt.detailsUrl}" ${evt.detailsUrl.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''} class="nav-special agenda-more-link compact">Meer informatie</a>` : ''}
                            </div>
                        `;
                    });

                    popover.innerHTML = popoverHtml;
                    
                } else {
                    popover.classList.add('active');
                    popover.classList.remove('event-mode', 'nbv-mode');
                    popover.innerHTML = `
                        <div class="calendar-popover-empty">
                            <p>
                                Geen activiteiten gepland op ${day} ${dutchMonths[calendarMonth]} ${calendarYear}.
                            </p>
                        </div>
                    `;
                }
            });
        });

        // Select the first event day by default so the month view opens with useful detail.
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

        refreshAgendaEffects();
    }

    // Helper to get events matching the current active filter
    function getFilteredEvents() {
        return agendaEvents.filter(evt => {
            if (currentFilter === 'all') return true;
            return evt.type === currentFilter;
        });
    }
});
