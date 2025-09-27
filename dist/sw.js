// Service Worker for Push Notifications and AI Image Processing
// Handles background push notifications, caching, and reliable AI image processing

const CACHE_NAME = 'rosemama-notifications-v1';
const AI_CACHE_NAME = 'rosemama-ai-processing-v1';
const urlsToCache = [
  '/',
  '/images/placeholder-product.svg'
];

// AI Processing Queue and State Management
const aiProcessingQueue = [];
const aiProcessingState = {
  isProcessing: false,
  currentRequest: null,
  retryCount: 0,
  maxRetries: 3,
  networkStatus: 'online'
};

// IndexedDB setup for persistent queue storage
const DB_NAME = 'AIQueueDB';
const DB_VERSION = 1;
const QUEUE_STORE = 'aiQueue';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        const store = db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

async function saveQueueToDB() {
  try {
    const db = await openDB();
    const transaction = db.transaction([QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);

    // Clear existing queue
    await new Promise((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    // Save current queue
    for (const item of aiProcessingQueue) {
      await new Promise((resolve, reject) => {
        const addRequest = store.add(item);
        addRequest.onsuccess = () => resolve();
        addRequest.onerror = () => reject(addRequest.error);
      });
    }

    console.log(`💾 Saved ${aiProcessingQueue.length} items to persistent queue`);
  } catch (error) {
    console.error('❌ Failed to save queue to DB:', error);
  }
}

// Serialize a request into a plain object that can be stored in IndexedDB
async function serializeRequest(request) {
  const serializedHeaders = [];
  for (const [key, value] of request.headers.entries()) {
    serializedHeaders.push([key, value]);
  }

  let body = null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      body = await request.arrayBuffer();
    } catch (error) {
      console.error('⚠️ Failed to read request body for serialization:', error);
      body = null;
    }
  }

  return {
    url: request.url,
    method: request.method,
    headers: serializedHeaders,
    body,
  };
}

// Recreate a Request object from serialized request data
function deserializeRequest(serialized) {
  const headers = new Headers(serialized.headers || []);
  const body = serialized.body ? serialized.body.slice(0) : undefined;

  return new Request(serialized.url, {
    method: serialized.method,
    headers,
    body,
  });
}

async function loadQueueFromDB() {
  try {
    const db = await openDB();
    const transaction = db.transaction([QUEUE_STORE], 'readonly');
    const store = transaction.objectStore(QUEUE_STORE);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        aiProcessingQueue.length = 0; // Clear current queue
        aiProcessingQueue.push(...(request.result || []));
        console.log(`📂 Loaded ${aiProcessingQueue.length} items from persistent queue`);
        resolve(aiProcessingQueue);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ Failed to load queue from DB:', error);
    return [];
  }
}

// Network status monitoring
let networkTimeout;

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches and set up network monitoring
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activating...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== AI_CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Load persistent queue
      loadQueueFromDB().then(() => {
        console.log('📋 Persistent queue loaded, processing if online...');
        if (aiProcessingState.networkStatus === 'online' && aiProcessingQueue.length > 0) {
          processAIQueue();
        }
      })
    ])
  );
  self.clients.claim();

  // Start network monitoring
  monitorNetworkStatus();
});

// Network status monitoring function
function monitorNetworkStatus() {
  function updateNetworkStatus(online) {
    const newStatus = online ? 'online' : 'offline';
    if (aiProcessingState.networkStatus !== newStatus) {
      aiProcessingState.networkStatus = newStatus;
      console.log(`📡 Network status changed to: ${newStatus}`);

      // Notify all clients about network status change
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'NETWORK_STATUS_CHANGE',
            status: newStatus
          });
        });
      });

      // If coming back online, process queued requests
      if (online && aiProcessingQueue.length > 0) {
        console.log(`📤 Processing ${aiProcessingQueue.length} queued AI requests...`);
        processAIQueue();
      }
    }
  }

  // Listen for online/offline events
  self.addEventListener('online', () => updateNetworkStatus(true));
  self.addEventListener('offline', () => updateNetworkStatus(false));

  // Also check network status periodically and retry queued requests
  setInterval(() => {
    fetch('/favicon.ico', { method: 'HEAD', cache: 'no-cache' })
      .then(() => {
        updateNetworkStatus(true);
        // Also retry queued requests periodically when online
        if (aiProcessingQueue.length > 0 && !aiProcessingState.isProcessing) {
          console.log(`🔄 Periodic retry: Processing ${aiProcessingQueue.length} queued AI requests...`);
          processAIQueue();
        }
      })
      .catch(() => updateNetworkStatus(false));
  }, 10000); // Check every 10 seconds instead of 30

  // Initial network check
  updateNetworkStatus(navigator.onLine);
}

// Fetch event - serve from cache when offline, handle AI requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle AI processing requests
  if (url.pathname.includes('/functions/v1/qwen-proxy')) {
    event.respondWith(handleAIRequest(event.request));
    return;
  }

  // Handle other requests with cache fallback
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});

// Handle AI image processing requests with retry logic and queuing
async function handleAIRequest(request) {
  console.log('🤖 AI Request intercepted by Service Worker');

  // Clone the request for processing
  const requestClone = request.clone();

  try {
    // Try to process immediately
    const response = await fetch(requestClone);
    console.log('✅ AI Request successful');
    return response;
  } catch (error) {
    console.log('❌ AI Request failed, queuing for retry:', error.message);

    // Queue the request for later retry
    const serializedRequest = await serializeRequest(request.clone());

    const queuedRequest = {
      id: Date.now() + Math.random(),
      requestData: serializedRequest,
      timestamp: Date.now(),
      retryCount: 0
    };

    aiProcessingQueue.push(queuedRequest);
    saveQueueToDB(); // Save to persistent storage (fire-and-forget)

    // Notify client about queuing
    notifyClients({
      type: 'AI_REQUEST_QUEUED',
      requestId: queuedRequest.id,
      queueLength: aiProcessingQueue.length,
      error: error.message
    });

    // Don't respond to the fetch - let it fail naturally so qwenImageEditor can handle it
    // The service worker will process the queue in the background
    throw error; // Re-throw the error to let the fetch fail naturally
  }
}

// Process queued AI requests
async function processAIQueue() {
  if (aiProcessingState.isProcessing || aiProcessingQueue.length === 0) {
    return;
  }

  aiProcessingState.isProcessing = true;
  console.log(`🚀 Starting queue processing with ${aiProcessingQueue.length} requests`);

  while (aiProcessingQueue.length > 0 && aiProcessingState.networkStatus === 'online') {
    const queuedRequest = aiProcessingQueue.shift();
    await saveQueueToDB(); // Save after removing item
    console.log(`🔄 Processing queued AI request: ${queuedRequest.id} (attempt ${queuedRequest.retryCount + 1})`);

    try {
      const requestToSend = deserializeRequest(queuedRequest.requestData);

      const response = await fetch(requestToSend);

      if (response.ok) {
        console.log(`✅ Queued AI request ${queuedRequest.id} successful`);

        // Get the response data
        const responseData = await response.json();

        // Convert base64 image data to blob if present
        let imageBlob = null;
        if (responseData.output && responseData.output.results && responseData.output.results[0]) {
          const resultItem = responseData.output.results[0];
          if (resultItem.imageData && resultItem.imageData.startsWith('data:image')) {
            // Convert base64 data URL to blob
            const base64Data = resultItem.imageData.split(',')[1];
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            imageBlob = new Blob([bytes], { type: 'image/png' });
            console.log(`🖼️ Converted base64 to blob for request ${queuedRequest.id}`);
          }
        }

        // Notify client of success with the image blob
        notifyClients({
          type: 'AI_REQUEST_SUCCESS',
          requestId: queuedRequest.id,
          queueLength: aiProcessingQueue.length,
          imageBlob: imageBlob
        });

        // Cache the successful response for potential reuse
        await cacheSuccessfulResponse(queuedRequest, new Response(JSON.stringify(responseData)));
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      console.log(`❌ Queued AI request ${queuedRequest.id} failed:`, error.message);

      queuedRequest.retryCount++;

      if (queuedRequest.retryCount < aiProcessingState.maxRetries) {
        // Calculate exponential backoff delay (2^retryCount seconds, max 60 seconds)
        const delayMs = Math.min(1000 * Math.pow(2, queuedRequest.retryCount), 60000);

        // Re-queue for another attempt with exponential backoff
        aiProcessingQueue.unshift(queuedRequest);
        await saveQueueToDB(); // Save after re-queuing
        console.log(`🔄 Re-queued AI request ${queuedRequest.id} (attempt ${queuedRequest.retryCount + 1}), next retry in ${delayMs}ms`);

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        // Max retries exceeded
        console.log(`💀 AI request ${queuedRequest.id} failed permanently after ${queuedRequest.retryCount} attempts`);

        notifyClients({
          type: 'AI_REQUEST_FAILED',
          requestId: queuedRequest.id,
          error: error.message,
          maxRetriesExceeded: true,
          queueLength: aiProcessingQueue.length
        });
      }
    }

    // Small delay between requests to avoid overwhelming the network
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  aiProcessingState.isProcessing = false;
  console.log(`🏁 Queue processing completed. ${aiProcessingQueue.length} requests remaining.`);
}

// Cache successful AI responses for potential reuse
async function cacheSuccessfulResponse(request, response) {
  try {
    const cache = await caches.open(AI_CACHE_NAME);
    const cacheKey = `ai-${Date.now()}-${Math.random()}`;
    await cache.put(cacheKey, response);

    // Clean up old cached responses (keep last 10)
    const keys = await cache.keys();
    if (keys.length > 10) {
      const keysToDelete = keys.slice(0, keys.length - 10);
      await Promise.all(keysToDelete.map(key => cache.delete(key)));
    }
  } catch (error) {
    console.log('⚠️ Failed to cache AI response:', error.message);
  }
}

// Notify all connected clients
function notifyClients(message) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage(message);
    });
  });
}

// Message handling for client communication
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'GET_NETWORK_STATUS':
      event.ports[0].postMessage({
        type: 'NETWORK_STATUS',
        status: aiProcessingState.networkStatus
      });
      break;

    case 'GET_QUEUE_STATUS':
      event.ports[0].postMessage({
        type: 'QUEUE_STATUS',
        queueLength: aiProcessingQueue.length,
        isProcessing: aiProcessingState.isProcessing
      });
      break;

    case 'RETRY_FAILED_REQUESTS':
      if (aiProcessingState.networkStatus === 'online') {
        console.log('🔄 Manual retry of failed requests triggered');
        processAIQueue();
      }
      break;

    case 'CLEAR_AI_QUEUE':
      console.log('🗑️ Clearing AI processing queue');
      aiProcessingQueue.length = 0; // Clear the queue
      saveQueueToDB(); // Save empty queue (fire-and-forget)
      notifyClients({
        type: 'AI_REQUEST_QUEUE_CLEARED',
        queueLength: 0
      });
      break;

    default:
      console.log('📨 Unknown message type:', type);
  }
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