/* ExpenseFlow Service Worker — Cache-first for static, network-first for API */

const CACHE = 'expenseflow-v1';
const STATIC = [
    './index.html',
    './css/styles.css',
    './js/app.js',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap',
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE)
            .then(c => c.addAll(STATIC))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k !== CACHE).map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    const { request } = e;
    const url = new URL(request.url);

    /* API calls: network-first, fail gracefully */
    if (url.port === '8080' || url.pathname.startsWith('/api/')) {
        e.respondWith(
            fetch(request).catch(() =>
                new Response(
                    JSON.stringify({ error: 'offline', message: 'No network connection' }),
                    { status: 503, headers: { 'Content-Type': 'application/json' } }
                )
            )
        );
        return;
    }

    /* Static assets: cache-first, fall back to network */
    e.respondWith(
        caches.match(request).then(cached => {
            if (cached) return cached;
            return fetch(request).then(res => {
                if (!res || res.status !== 200 || res.type === 'opaque') return res;
                const clone = res.clone();
                caches.open(CACHE).then(c => c.put(request, clone));
                return res;
            });
        })
    );
});
