// ============================================================
//  Mistrz Czasu — Service Worker
//  Strategia: Network-first z fallback na cache.
//  Przy każdym starcie próbuje pobrać aktualną wersję z sieci.
//  Jeśli brak internetu — serwuje z cache (działa offline).
//  Gdy nowa wersja SW zostanie wykryta, przejmuje kontrolę
//  natychmiast i odświeża wszystkie otwarte karty.
// ============================================================

const CACHE_NAME = 'mistrz-czasu-v1';

const APP_SHELL = [
  './',
  './index.html',
  './layout.css',
  './clock-styles.css',
  './clock-renderer.js',
  './game-state.js',
  './question-logic.js',
  './transitions.js',
  './godziny.html',
  './nauka.html',
  './wpisz.html',
  './szybka-gra.html',
  './wyzwanie.html',
  './mapa.html',
  './garderoba.html',
  './profil.html',
  './trofea.html',
  './ustawienia.html',
  './ustaw.html',
  './kalendarz-dni.html',
  './kalendarz-miesiace.html',
  './roman-pairs.html',
  './roman-pairs-bonus.html',
  './digit-placer-arabic.html',
  './digit-placer-roman.html',
  './manifest.json',
];

// ----- INSTALL: wstępne zapisanie wszystkich plików do cache -----
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  // Przejdź od razu do aktywacji — nie czekaj na zamknięcie starej karty
  self.skipWaiting();
});

// ----- ACTIVATE: usuń stare wersje cache -----
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  // Przejdź kontrolę nad wszystkimi otwartymi kartami natychmiast
  self.clients.claim();
});

// ----- FETCH: Network-first, fallback na cache -----
self.addEventListener('fetch', (event) => {
  // Obsługuj tylko żądania GET (nie blokuj POST/PUT localStorage itp.)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Odpowiedź z sieci — zaktualizuj cache i zwróć
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Brak sieci — serwuj z cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Fallback dla nieznanych stron HTML
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});
