const CACHE = 'ls-gestao-v18';
const ASSETS = [
  'https://laissantosconfeitaria.github.io/gestao.html',
  'https://laissantosconfeitaria.github.io/icon-192.png',
  'https://laissantosconfeitaria.github.io/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:wght@300;400;500&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('message', e => {
  if(e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Nunca intercepta o próprio service worker ou arquivos de script de worker
  if(url.pathname.endsWith('sw.js')) return;

  // Só intercepta GET
  if(e.request.method !== 'GET') return;

  // Navegação (HTML): sempre busca da rede primeiro, cache como fallback
  if(e.request.mode === 'navigate'){
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.match('https://laissantosconfeitaria.github.io/gestao.html')
      )
    );
    return;
  }

  // Demais recursos: cache primeiro, rede como fallback
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(response => {
        if(response && response.status === 200){
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({type:'window', includeUncontrolled:true}).then(list => {
      for(const client of list){
        if(client.url.includes('gestao.html') && 'focus' in client)
          return client.focus();
      }
      return clients.openWindow('https://laissantosconfeitaria.github.io/gestao.html');
    })
  );
});
