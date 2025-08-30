const CACHE_NAME = 'warehouse-scanner-' + new Date().toISOString().split('T')[0];

self.addEventListener('install', function(e) {
    console.log('Service Worker установлен');
    self.skipWaiting();
});

self.addEventListener('activate', function(e) {
    console.log('Service Worker активирован');
});

self.addEventListener('fetch', function(e) {
    // Просто пропускаем все запросы
    e.respondWith(fetch(e.request));
});