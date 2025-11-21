
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
;

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