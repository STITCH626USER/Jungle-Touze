const CACHE_NAME = 'jungle-touze-v241';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './game.js',
    './manifest.json',
    './sw.js',
    './assets/home_bg_jungle.png',
    './assets/card_back.jpg',
    './assets/logo_neon.png',
    './assets/card_lion.jpg',
    './assets/card_chameleon.jpg',
    './assets/card_octopus.jpg',
    './assets/card_crocodile.jpg',
    './assets/card_monkey.jpg',
    './assets/card_crab.jpg',
    './assets/card_parrot.jpg',
    './assets/card_hermit_crab.jpg',
    './assets/icon-192.png',
    './assets/icon-512.png',
    './assets/apple-touch-icon.png',
    './assets/sfx_lion.mp3',
    './assets/sfx_monkey.mp3',
    './assets/sfx_crab.mp3',
    './assets/sfx_parrot.mp3',
    './assets/sfx_chameleon.mp3',
    './assets/sfx_octopus.mp3',
    './assets/sfx_crocodile.mp3',
    './assets/sfx_hermit.mp3',
    './assets/sfx_dice.mp3',
    './assets/sfx_win.mp3'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    const isAsset = e.request.url.includes('/assets/') || e.request.url.match(/\.(png|jpg|mp3|css)$/);
    if (isAsset) {
        // Cache First for assets
        e.respondWith(
            caches.match(e.request).then((response) => response || fetch(e.request))
        );
    } else {
        // Network First for HTML, JS, JSON
        e.respondWith(
            fetch(e.request).catch(() => caches.match(e.request))
        );
    }
});
