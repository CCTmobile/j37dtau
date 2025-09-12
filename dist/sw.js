// Service Worker for Push Notifications
// Handles background push notifications and caching

const CACHE_NAME = 'rosemama-notifications-v1';
const urlsToCache = [
  '/',
  '/images/placeholder-product.svg'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const defaultData = {
    title: 'Rosémama Clothing',
    body: 'You have a new notification',
    icon: '/images/placeholder-product.svg',
    badge: '/images/placeholder-product.svg',
    tag: 'default'
  };

  let notificationData = defaultData;

  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        title: pushData.title || defaultData.title,
        body: pushData.body || defaultData.body,
        icon: pushData.icon || defaultData.icon,
        badge: pushData.badge || defaultData.badge,
        tag: pushData.tag || defaultData.tag,
        data: pushData.data || {},
        actions: pushData.actions || [],
        image: pushData.image,
        requireInteraction: pushData.requireInteraction || false,
        silent: pushData.silent || false,
        timestamp: Date.now(),
        dir: 'ltr',
        lang: 'en'
      };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    actions: notificationData.actions,
    image: notificationData.image,
    requireInteraction: notificationData.requireInteraction,
    silent: notificationData.silent,
    timestamp: notificationData.timestamp,
    dir: notificationData.dir,
    lang: notificationData.lang,
    vibrate: [200, 100, 200],
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  // Handle action buttons
  if (event.action) {
    console.log('Notification action clicked:', event.action);
    
    switch (event.action) {
      case 'view':
        event.waitUntil(
          clients.openWindow(event.notification.data.url || '/')
        );
        break;
      case 'dismiss':
        // Just close the notification
        break;
      default:
        console.log('Unknown action:', event.action);
    }
    return;
  }

  // Default click behavior - open the app
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // If there's already a window open, focus it
      for (const client of clientList) {
        if (client.url === self.registration.scope && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Otherwise, open a new window
      const urlToOpen = event.notification.data.url || '/';
      return clients.openWindow(urlToOpen);
    })
  );
});

// Notification close event - track dismissals
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
  
  // Track notification dismissal
  if (event.notification.data.notificationId) {
    // Could send analytics event here
    console.log('Notification dismissed:', event.notification.data.notificationId);
  }
});

// Background sync event - handle offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event);
  
  if (event.tag === 'notification-sync') {
    event.waitUntil(syncNotifications());
  }
});

// Sync notifications when coming back online
async function syncNotifications() {
  try {
    // Get stored notifications from IndexedDB
    const db = await openNotificationDB();
    const notifications = await getStoredNotifications(db);
    
    // Send stored notifications
    for (const notification of notifications) {
      await sendNotificationToServer(notification);
      await removeStoredNotification(db, notification.id);
    }
    
    console.log('Notifications synced successfully');
  } catch (error) {
    console.error('Error syncing notifications:', error);
  }
}

// IndexedDB helpers for offline notification storage
function openNotificationDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NotificationDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const objectStore = db.createObjectStore('notifications', { keyPath: 'id' });
      objectStore.createIndex('timestamp', 'timestamp', { unique: false });
    };
  });
}

function getStoredNotifications(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['notifications'], 'readonly');
    const objectStore = transaction.objectStore('notifications');
    const request = objectStore.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removeStoredNotification(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['notifications'], 'readwrite');
    const objectStore = transaction.objectStore('notifications');
    const request = objectStore.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function sendNotificationToServer(notification) {
  // Implement actual server sync logic here
  console.log('Sending notification to server:', notification);
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service worker unhandled rejection:', event.reason);
});

console.log('Service worker loaded successfully');