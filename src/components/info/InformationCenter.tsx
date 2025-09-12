import React, { useState } from 'react';
import { InfoLayout } from './InfoLayout';
import { AboutUs } from './AboutUs';
import { PolicyPage } from './PolicyPage';

interface InformationCenterProps {
  onBack: () => void;
  initialPage?: string;
}

export function InformationCenter({ onBack, initialPage = 'about' }: InformationCenterProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'about': return 'About Us';
      case 'privacy': return 'Privacy Policy';
      case 'terms': return 'Terms of Service';
      case 'shipping': return 'Shipping Policy';
      case 'returns': return 'Return Policy';
      case 'help': return 'Help Center';
      case 'contact': return 'Contact Us';
      default: return 'Information Center';
    }
  };

  const getPageDescription = () => {
    switch (currentPage) {
      case 'about': return 'Learn about our story, values, and team';
      case 'privacy': return 'How we protect and use your personal information';
      case 'terms': return 'Terms and conditions for using our services';
      case 'shipping': return 'Shipping methods, costs, and delivery information';
      case 'returns': return 'Return and exchange policies and procedures';
      case 'help': return 'Frequently asked questions and support resources';
      case 'contact': return 'Get in touch with our customer service team';
      default: return 'Your one-stop destination for helpful information';
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'about':
        return <AboutUs onNavigate={handleNavigate} />;
      case 'privacy':
        return <PolicyPage type="privacy" />;
      case 'terms':
        return <PolicyPage type="terms" />;
      case 'shipping':
        return <PolicyPage type="shipping" />;
      case 'returns':
        return <PolicyPage type="returns" />;
      case 'help':
        return <PolicyPage type="help" />;
      case 'contact':
        return <PolicyPage type="contact" />;
      default:
        return <AboutUs onNavigate={handleNavigate} />;
    }
  };

  return (
    <InfoLayout
      title={getPageTitle()}
      description={getPageDescription()}
      onBack={onBack}
    >
      {renderContent()}
    </InfoLayout>
  );
}