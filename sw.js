const CACHE = 'todo-v4.0';
const BESTANDEN = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js'
];

// Installatie: sla bestanden op in cache
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(['./', './index.html']);
    })
  );
  self.skipWaiting();
});

// Activatie: verwijder oude caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: gebruik cache als offline, anders netwerk
self.addEventListener('fetch', function(e) {
  // Firebase API calls altijd via netwerk
  if (e.request.url.includes('firebasedatabase.app') ||
      e.request.url.includes('googleapis.com/identitytoolkit') ||
      e.request.url.includes('securetoken.google.com')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) {
        // Geef cache terug, maar update op de achtergrond
        fetch(e.request).then(function(response) {
          if (response && response.status === 200) {
            caches.open(CACHE).then(function(cache) {
              cache.put(e.request, response);
            });
          }
        }).catch(function() {});
        return cached;
      }
      // Niet in cache: probeer netwerk
      return fetch(e.request).then(function(response) {
        if (response && response.status === 200) {
          const kopie = response.clone();
          caches.open(CACHE).then(function(cache) {
            cache.put(e.request, kopie);
          });
        }
        return response;
      }).catch(function() {
        // Offline en niet in cache: geef index.html terug
        return caches.match('./index.html');
      });
    })
  );
});
