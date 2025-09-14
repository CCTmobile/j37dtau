import { useEffect } from 'react';
import { initializeTrustpilotWidgets } from '../../utils/trustpilot';

interface TrustpilotWidgetProps {
  widgetType: 'trustbox' | 'product-review' | 'review-carousel';
  productSku?: string;
  height?: string;
  width?: string;
  className?: string;
}

export function TrustpilotWidget({
  widgetType,
  productSku,
  height = '350px',
  width = '100%',
  className = ''
}: TrustpilotWidgetProps) {
  const widgetId = `trustpilot-widget-${widgetType}-${productSku || 'general'}`;

  useEffect(() => {
    // Initialize Trustpilot widgets when component mounts
    initializeTrustpilotWidgets();
  }, []);

  return (
    <div
      id={widgetId}
      className={`trustpilot-widget-container ${className}`}
      data-trustpilot-widget={widgetType}
      data-height={height}
      data-width={width}
      data-product-sku={productSku}
    >
      {/* Trustpilot widget will be loaded here */}
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        Loading reviews...
      </div>
    </div>
  );
}

export default TrustpilotWidget;