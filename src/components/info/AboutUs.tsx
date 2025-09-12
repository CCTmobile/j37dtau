import React from 'react';
import { ContentPage } from './ContentPage';
import { defaultAboutContent } from './defaultContent/aboutContent';

interface AboutUsProps {
  onNavigate?: (page: string) => void;
}

export function AboutUs({ onNavigate }: AboutUsProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <ContentPage 
        pageType="about" 
        defaultContent={defaultAboutContent}
        className="space-y-12"
      />
    </div>
  );
}