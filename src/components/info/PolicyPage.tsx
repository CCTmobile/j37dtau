import React from 'react';
import { ContentPage } from './ContentPage';
import { 
  defaultPrivacyContent, 
  defaultTermsContent, 
  defaultShippingContent, 
  defaultReturnsContent,
  defaultHelpContent,
  defaultContactContent 
} from './defaultContent/policyContent';
import { PageType } from '../../utils/contentService';

interface PolicyPageProps {
  type: 'privacy' | 'terms' | 'shipping' | 'returns' | 'help' | 'contact';
}

const contentMap = {
  privacy: { content: defaultPrivacyContent, pageType: 'privacy' as PageType },
  terms: { content: defaultTermsContent, pageType: 'terms' as PageType },
  shipping: { content: defaultShippingContent, pageType: 'shipping' as PageType },
  returns: { content: defaultReturnsContent, pageType: 'returns' as PageType },
  help: { content: defaultHelpContent, pageType: 'help' as PageType },
  contact: { content: defaultContactContent, pageType: 'contact' as PageType }
};

export function PolicyPage({ type }: PolicyPageProps) {
  const { content, pageType } = contentMap[type];

  return (
    <div className="max-w-4xl mx-auto">
      <ContentPage 
        pageType={pageType}
        defaultContent={content}
        className="space-y-8"
      />
    </div>
  );
}