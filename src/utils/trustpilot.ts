/**
 * Trustpilot Integration Service
 * Handles all Trustpilot interactions including product reviews, service reviews, and widgets
 */

export interface TrustpilotProduct {
  sku: string;
  productUrl: string;
  imageUrl: string;
  name: string;
}

export interface TrustpilotInvitation {
  recipientEmail: string;
  recipientName: string;
  referenceId: string;
  source: string;
  productSkus?: string[];
  products?: TrustpilotProduct[];
}

declare global {
  interface Window {
    tp: (action: string, data: any) => void;
    TrustpilotObject: string;
  }
}

/**
 * Send a product review invitation to a customer after purchase
 */
export const sendProductReviewInvitation = async (
  customerEmail: string,
  customerName: string,
  orderId: string,
  products: Array<{
    id: string;
    name: string;
    image: string;
  }>
): Promise<boolean> => {
  try {
    // Wait for Trustpilot to be loaded
    if (!window.tp) {
      console.warn('Trustpilot not loaded yet, waiting...');
      await waitForTrustpilot();
    }

    const baseUrl = 'https://rosemamaclothing.store';
    
    const trustpilotProducts: TrustpilotProduct[] = products.map(product => ({
      sku: product.id,
      productUrl: `${baseUrl}/product/${product.id}`,
      imageUrl: product.image.startsWith('http') 
        ? product.image 
        : `${baseUrl}/images/${product.image}`,
      name: product.name,
    }));

    const invitation: TrustpilotInvitation = {
      recipientEmail: customerEmail,
      recipientName: customerName,
      referenceId: `Order_${orderId}`,
      source: 'PostPurchase',
      productSkus: products.map(p => p.id),
      products: trustpilotProducts,
    };

    window.tp('createInvitation', invitation);
    
    console.log('Trustpilot invitation sent successfully:', invitation);
    return true;
  } catch (error) {
    console.error('Failed to send Trustpilot invitation:', error);
    return false;
  }
};

/**
 * Send a service review invitation for overall company experience
 */
export const sendServiceReviewInvitation = async (
  customerEmail: string,
  customerName: string,
  orderId: string
): Promise<boolean> => {
  try {
    if (!window.tp) {
      await waitForTrustpilot();
    }

    const invitation: TrustpilotInvitation = {
      recipientEmail: customerEmail,
      recipientName: customerName,
      referenceId: `Service_${orderId}`,
      source: 'ServiceExperience',
    };

    window.tp('createInvitation', invitation);
    
    console.log('Trustpilot service invitation sent successfully:', invitation);
    return true;
  } catch (error) {
    console.error('Failed to send Trustpilot service invitation:', error);
    return false;
  }
};

/**
 * Wait for Trustpilot script to load
 */
const waitForTrustpilot = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait

    const checkTrustpilot = () => {
      if (typeof window.tp === 'function' && window.TrustpilotObject) {
        resolve();
      } else if (attempts >= maxAttempts) {
        reject(new Error('Trustpilot failed to load'));
      } else {
        attempts++;
        setTimeout(checkTrustpilot, 100);
      }
    };

    checkTrustpilot();
  });
};

/**
 * Load a Trustpilot widget dynamically
 */
export const loadTrustpilotWidget = (
  elementId: string,
  widgetType: 'trustbox' | 'product-review' | 'review-carousel',
  options: Record<string, any> = {}
): void => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with ID ${elementId} not found`);
    return;
  }

  // Clear existing content
  element.innerHTML = '';

  // Create trustbox div
  const trustbox = document.createElement('div');
  trustbox.className = 'trustpilot-widget';
  trustbox.setAttribute('data-locale', 'en-US');
  trustbox.setAttribute('data-template-id', getTemplateId(widgetType));
  trustbox.setAttribute('data-businessunit-id', 'jqNE0wslhWspQelA');
  trustbox.setAttribute('data-style-height', options.height || '350px');
  trustbox.setAttribute('data-style-width', options.width || '100%');
  
  // Add product-specific attributes for product reviews
  if (widgetType === 'product-review' && options.productSku) {
    trustbox.setAttribute('data-sku', options.productSku);
  }

  element.appendChild(trustbox);

  // Load the widget
  if (typeof window.tp === 'function') {
    window.tp('loadFromElement', trustbox);
  } else {
    console.warn('Trustpilot not loaded, widget will load when script is ready');
  }
};

/**
 * Get Trustpilot template ID for different widget types
 */
const getTemplateId = (widgetType: string): string => {
  const templates: Record<string, string> = {
    'trustbox': '5419b6a8b0d04a076446a9ad', // Standard trustbox
    'product-review': '5419b6a8b0d04a076446a9ae', // Product reviews
    'review-carousel': '5419b6a8b0d04a076446a9af', // Review carousel
  };
  
  return templates[widgetType] || templates['trustbox'];
};

/**
 * Initialize Trustpilot widgets on page load
 */
export const initializeTrustpilotWidgets = (): void => {
  // Wait for both DOM and Trustpilot to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadWidgets);
  } else {
    loadWidgets();
  }
};

const loadWidgets = async (): Promise<void> => {
  try {
    await waitForTrustpilot();
    
    // Find all trustpilot widget containers and initialize them
    const widgets = document.querySelectorAll('[data-trustpilot-widget]');
    widgets.forEach((widget) => {
      const element = widget as HTMLElement;
      const widgetType = element.dataset.trustpilotWidget as any;
      const options = {
        height: element.dataset.height,
        width: element.dataset.width,
        productSku: element.dataset.productSku,
      };
      
      loadTrustpilotWidget(element.id, widgetType, options);
    });
  } catch (error) {
    console.error('Failed to initialize Trustpilot widgets:', error);
  }
};

/**
 * Track purchase completion and send appropriate invitations
 */
export const trackPurchaseCompletion = async (orderData: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  products: Array<{
    id: string;
    name: string;
    image: string;
  }>;
}): Promise<void> => {
  try {
    // Send both product and service review invitations
    await Promise.all([
      sendProductReviewInvitation(
        orderData.customerEmail,
        orderData.customerName,
        orderData.orderId,
        orderData.products
      ),
      sendServiceReviewInvitation(
        orderData.customerEmail,
        orderData.customerName,
        orderData.orderId
      )
    ]);
    
    console.log('All Trustpilot invitations sent successfully');
  } catch (error) {
    console.error('Error sending Trustpilot invitations:', error);
  }
};

/**
 * Get product rating and review count from Trustpilot
 * This is a mock implementation since actual Trustpilot API requires server-side calls
 */
export const getTrustpilotProductRating = async (productSku: string): Promise<{
  rating: number;
  reviewCount: number;
  trustScore: number;
} | null> => {
  try {
    // In a real implementation, this would make an API call to Trustpilot
    // For now, we'll return mock data that looks realistic
    const mockRatings: Record<string, { rating: number; reviewCount: number; trustScore: number }> = {
      // Default ratings for demo purposes
      'default': { rating: 4.2, reviewCount: 8, trustScore: 4.2 },
      'sku_1': { rating: 4.5, reviewCount: 12, trustScore: 4.5 },
      'sku_2': { rating: 4.1, reviewCount: 5, trustScore: 4.1 },
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return mockRatings[productSku] || mockRatings['default'];
  } catch (error) {
    console.error('Error fetching Trustpilot product rating:', error);
    return null;
  }
};