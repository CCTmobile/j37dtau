import { useEffect, useState } from 'react';
import { initializeTrustpilotWidgets } from '../../utils/trustpilot';

interface TrustpilotWidgetProps {
  widgetType: 'trustbox' | 'product-review' | 'review-carousel';
  productSku?: string;
  businessUnitId?: string;
  height?: string;
  width?: string;
  className?: string;
}

export function TrustpilotWidget({
  widgetType,
  productSku,
  businessUnitId = '66e3a5c8fe53e5eddc65b0fd', // Default Rosémama business unit ID
  height = '350px',
  width = '100%',
  className = ''
}: TrustpilotWidgetProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const widgetId = `trustpilot-widget-${widgetType}-${productSku || 'general'}`;

  useEffect(() => {
    // Initialize Trustpilot widgets when component mounts
    initializeTrustpilotWidgets();

    // Check if we're in development environment
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname.includes('localhost');

    // Set a timeout to stop showing loading state after 5 seconds
    const timeout = setTimeout(() => {
      setIsLoading(false);
      if (isDevelopment) {
        setHasError(true); // In development, assume widgets won't load due to domain restrictions
      }
    }, isDevelopment ? 3000 : 5000); // Shorter timeout in development

    // Also check if the widget element gets populated by Trustpilot
    const checkInterval = setInterval(() => {
      const element = document.getElementById(widgetId);
      if (element) {
        // Check if Trustpilot has populated the widget with iframe or content
        const hasIframe = element.querySelector('iframe');
        const hasPopulatedContent = element.children.length > 1 || 
          (element.children[0] && element.children[0].children.length > 0);
        
        if (hasIframe || hasPopulatedContent) {
          setIsLoading(false);
          setHasError(false);
          clearInterval(checkInterval);
        }
      }
    }, 1000);

    // Listen for network errors that might indicate 403 or other issues
    const handleError = (event: ErrorEvent) => {
      if (event.message && event.message.includes('trustpilot')) {
        console.warn('Trustpilot widget loading issue detected');
        setHasError(true);
        setIsLoading(false);
      }
    };

    window.addEventListener('error', handleError);

    return () => {
      clearTimeout(timeout);
      clearInterval(checkInterval);
      window.removeEventListener('error', handleError);
    };
  }, [widgetId]);

  const renderWidget = () => {
    const baseProps = {
      className: `trustpilot-widget ${className}`,
      'data-locale': 'en-US',
      'data-template-id': businessUnitId,
      'data-businessunit-id': businessUnitId,
      'data-style-height': height,
      'data-style-width': width,
    };

    switch (widgetType) {
      case 'review-carousel':
        return (
          <div
            id={widgetId}
            {...baseProps}
            data-widget="carousel"
            data-stars="1,2,3,4,5"
            data-schema-type="Organization"
          >
            {/* Enhanced fallback content */}
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <div className="text-center">
                {isLoading && !hasError ? (
                  <>
                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                    <div className="animate-pulse">Loading customer reviews...</div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white text-lg font-bold">T</span>
                    </div>
                    <div className="text-lg font-medium text-foreground mb-2">
                      {hasError ? 'Reviews Loading...' : 'Customer Reviews'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {hasError 
                        ? (window.location.hostname === 'localhost' || window.location.hostname.includes('localhost')
                            ? 'Widgets restricted on localhost - will work on live domain'
                            : 'We\'re setting up our review system. Check back soon!')
                        : 'See what our customers are saying'
                      }
                    </div>
                  </>
                )}
                <div className="text-xs mt-2 text-muted-foreground">Powered by Trustpilot</div>
              </div>
            </div>
          </div>
        );
      
      case 'product-review':
        return (
          <div
            id={widgetId}
            {...baseProps}
            data-widget="product-review"
            data-sku={productSku}
          >
            {isLoading && !hasError ? (
              <div className="flex items-center justify-center py-8 text-center">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                  <div className="text-sm text-muted-foreground">Loading product reviews...</div>
                  <div className="text-xs text-muted-foreground mt-1">Powered by Trustpilot</div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white text-lg font-bold">T</span>
                  </div>
                  <h4 className="text-lg font-medium text-foreground mb-2">
                    {hasError ? 'Reviews Currently Unavailable' : 'No reviews yet'}
                  </h4>
                  <p className="text-sm text-muted-foreground max-w-md">
                    {hasError 
                      ? (window.location.hostname === 'localhost' || window.location.hostname.includes('localhost')
                          ? 'Trustpilot widgets are restricted on localhost for security. They will work on the live domain (rosemamaclothing.store). You can still test the "Write a Review" button functionality.'
                          : 'We\'re working on getting reviews set up. In the meantime, you can leave a review directly on Trustpilot.')
                      : 'Be the first to share your experience with this product. Your review helps other customers make informed decisions.'
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Powered by</span>
                  <div className="flex items-center gap-1 font-medium">
                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">T</span>
                    </div>
                    Trustpilot
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'trustbox':
      default:
        return (
          <div
            id={widgetId}
            {...baseProps}
            data-widget="trustbox"
            data-stars="1,2,3,4,5"
          >
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">T</span>
                  </div>
                  <span>Loading reviews...</span>
                </div>
                <div className="text-xs">Be the first to leave a review!</div>
              </div>
            </div>
          </div>
        );
    }
  };

  return renderWidget();
}

export default TrustpilotWidget;