self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('sagi-cache').then(cache => {
      return cache.addAll([
        // Recursos estáticos
        // HTML
        '/html/index.html',
        '/html/menu.html',
        '/html/products.html',
        '/html/add-product.html',
        '/html/providers.html',
        '/html/add-provider.html',
        '/html/receipts.html',
        '/html/add-receipt.html',
        '/html/view-receipt.html',
        '/html/movements.html',
        '/html/add-movement.html',
        '/html/users.html',
        '/html/add-user.html',
        '/html/roles.html',
        '/html/edit-role.html',

        // CSS
        '/css/style.css',

        // JS (solo los que realmente existan)
        '/js/config.js',
        '/js/auth.js',
        '/js/products.js',
        '/js/dashboard.js',
        '/js/providers.js',
        '/js/receipts.js',
        '/js/movements.js',
        '/js/users.js',
        '/js/roles.js',
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
