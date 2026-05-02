/**
 * BVB Seasons Theme Logic
 * Handles automatic season detection, the hidden easter egg,
 * and high-fidelity seasonal effects on the original logo.
 */

const Seasons = {
    SPRING: 'theme-spring',
    SUMMER: 'theme-summer',
    AUTUMN: 'theme-autumn',
    WINTER: 'theme-winter'
};

function getCurrentSeason() {
    const month = new Date().getMonth(); // 0-11
    if (month >= 2 && month <= 4) return Seasons.SPRING; // Mar, Apr, May
    if (month >= 5 && month <= 7) return Seasons.SUMMER; // Jun, Jul, Aug
    if (month >= 8 && month <= 10) return Seasons.AUTUMN; // Sep, Oct, Nov
    return Seasons.WINTER; // Dec, Jan, Feb
}

function applyTheme(theme) {
    document.body.classList.remove(...Object.values(Seasons));
    document.body.classList.add(theme);
    localStorage.setItem('bvb-theme', theme);
    
    // Reset any JS-based effects
    stopAutumnEffects();
    
    if (theme === Seasons.AUTUMN) {
        startAutumnEffects();
    }
}

let autumnInterval = null;
function startAutumnEffects() {
    const wrapper = document.querySelector('.logo-wrapper');
    if (!wrapper) return;
    
    autumnInterval = setInterval(() => {
        const leaf = document.createElement('div');
        leaf.className = 'falling-leaf';
        leaf.style.left = Math.random() * 80 + 10 + '%';
        leaf.style.top = Math.random() * 20 + '%';
        wrapper.appendChild(leaf);
        
        setTimeout(() => leaf.remove(), 3000);
    }, 1000);
}

function stopAutumnEffects() {
    if (autumnInterval) {
        clearInterval(autumnInterval);
        autumnInterval = null;
    }
}

function initSeasons() {
    // 1. Wrap the logo for effects
    const logo = document.querySelector('.main-logo');
    if (logo && !logo.parentElement.classList.contains('logo-wrapper')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'logo-wrapper';
        logo.parentNode.insertBefore(wrapper, logo);
        wrapper.appendChild(logo);
        
        const overlay = document.createElement('div');
        overlay.className = 'logo-overlay';
        wrapper.appendChild(overlay);
    }

    // 2. Load theme
    const savedTheme = localStorage.getItem('bvb-theme');
    const initialTheme = savedTheme || getCurrentSeason();
    applyTheme(initialTheme);

    // 3. Easter Egg Toggle
    const tagline = document.querySelector('.site-tagline');
    if (tagline) {
        tagline.style.cursor = 'pointer';
        tagline.addEventListener('click', () => {
            const current = Object.values(Seasons).find(s => document.body.classList.contains(s));
            const themes = Object.values(Seasons);
            const nextIndex = (themes.indexOf(current) + 1) % themes.length;
            applyTheme(themes[nextIndex]);
            
            tagline.style.transform = 'scale(1.05)';
            setTimeout(() => tagline.style.transform = 'scale(1)', 200);
        });
    }
}

document.addEventListener('DOMContentLoaded', initSeasons);
