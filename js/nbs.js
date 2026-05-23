(() => {
    'use strict';

    const BVB = window.BVB || {};
    const onReady = BVB.onReady || ((callback) => document.addEventListener('DOMContentLoaded', callback));

    onReady(() => {
        const shareFlyerBtn = document.getElementById('share-flyer-btn');
        if (!shareFlyerBtn) return;

        shareFlyerBtn.addEventListener('click', () => {
            const shareData = {
                title: 'NBS 2026 - Nationale Bonsai Show',
                text: 'Kom je ook naar de Nationale Bonsai Show 2026? Bekijk de flyer en het programma!',
                url: window.location.href
            };

            if (navigator.share) {
                navigator.share(shareData).catch(error => console.log('Error sharing:', error));
                return;
            }

            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareData.text} ${shareData.url}`)}`;
            window.open(whatsappUrl, '_blank');
        });
    });
})();
