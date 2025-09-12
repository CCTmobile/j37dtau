// Service Worker Registration and Push Notification Setup
// Handles service worker registration and push notification permission

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private pushSubscription: PushSubscription | null = null;

  async register(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers are not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service worker registered successfully:', this.registration);

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available
              console.log('New service worker available');
              this.showUpdateAvailableNotification();
            }
          });
        }
      });

      return true;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return false;
    }
  }

  async requestPushPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Push notifications are not supported');
      return false;
    }

    if (!this.registration) {
      console.error('Service worker not registered');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      
      if (permission === 'granted') {
        await this.subscribeToPush();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting push permission:', error);
      return false;
    }
  }

  async subscribeToPush(): Promise<PushSubscriptionData | null> {
    if (!this.registration) {
      console.error('Service worker not registered');
      return null;
    }

    try {
      // Check if already subscribed
      this.pushSubscription = await this.registration.pushManager.getSubscription();
      
      if (!this.pushSubscription) {
        // Subscribe to push notifications
        const vapidPublicKey = await this.getVapidPublicKey();
        
        this.pushSubscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey
        });
      }

      const subscriptionData: PushSubscriptionData = {
        endpoint: this.pushSubscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(this.pushSubscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(this.pushSubscription.getKey('auth')!)
        }
      };

      console.log('Push subscription created:', subscriptionData);
      return subscriptionData;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      return null;
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.pushSubscription) {
      return true;
    }

    try {
      const success = await this.pushSubscription.unsubscribe();
      if (success) {
        this.pushSubscription = null;
        console.log('Push subscription removed');
      }
      return success;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      return false;
    }
  }

  async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (!this.registration) {
      console.error('Service worker not registered');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      await this.registration.showNotification(title, {
        icon: '/images/placeholder-product.svg',
        badge: '/images/placeholder-product.svg',
        ...options
      } as any);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  private async getVapidPublicKey(): Promise<string> {
    // In a real app, this would be fetched from your server
    // For now, we'll return null to avoid push subscription setup
    return '';
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach((b) => binary += String.fromCharCode(b));
    return window.btoa(binary);
  }

  private showUpdateAvailableNotification(): void {
    // Show a notification that an update is available
    this.showNotification('App Update Available', {
      body: 'A new version of the app is available. Click to update.',
      tag: 'app-update',
      requireInteraction: true
    } as any);
  }

  // Get the current notification permission status
  getNotificationPermission(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  // Check if push notifications are supported
  isPushSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  // Get the current push subscription
  async getCurrentPushSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      return null;
    }

    try {
      return await this.registration.pushManager.getSubscription();
    } catch (error) {
      console.error('Error getting push subscription:', error);
      return null;
    }
  }
}

// Create a singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

// Initialize service worker when the module loads
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    serviceWorkerManager.register();
  });

  // Handle service worker messages
  navigator.serviceWorker?.addEventListener('message', (event) => {
    console.log('Message from service worker:', event.data);
    
    if (event.data?.type === 'NOTIFICATION_CLICK') {
      // Handle notification click events
      console.log('Notification clicked:', event.data.notificationId);
    }
  });
}

export default serviceWorkerManager;