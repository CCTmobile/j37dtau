import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useContent } from '../../contexts/ContentContext';
import { PageType, type ContentSection } from '../../utils/contentService';
import { Loader2, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';

interface ContentPageProps {
  pageType: PageType;
  defaultContent?: ContentSection[];
  className?: string;
  onRetry?: () => void;
}

export function ContentPage({ pageType, defaultContent = [], className = '', onRetry }: ContentPageProps) {
  const { getPageContent, state, subscribeToPageContent, unsubscribeFromPageContent } = useContent();
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateNotification, setUpdateNotification] = useState(false);
  const subscriptionRef = useRef<boolean>(false);

  // Load content when component mounts or pageType changes
  useEffect(() => {
    loadContent();
    
    // Subscribe to real-time updates only if not already subscribed
    if (!subscriptionRef.current) {
      subscribeToPageContent(pageType);
      subscriptionRef.current = true;
    }
    
    // Cleanup subscription on unmount or pageType change
    return () => {
      if (subscriptionRef.current) {
        unsubscribeFromPageContent(pageType);
        subscriptionRef.current = false;
      }
    };
  }, [pageType]); // Remove the problematic dependencies

  // Listen for real-time updates and refresh content
  useEffect(() => {
    const cachedContent = state.contentCache[pageType];
    if (cachedContent && cachedContent !== content) {
      setContent(cachedContent);
      
      // Show update notification
      if (content !== null) { // Don't show notification on initial load
        setUpdateNotification(true);
        const timeoutId = setTimeout(() => setUpdateNotification(false), 3000); // Hide after 3 seconds
        
        // Cleanup timeout on unmount
        return () => clearTimeout(timeoutId);
      }
    }
  }, [state.contentCache, pageType, content]);

  const loadContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getPageContent(pageType);
      setContent(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [pageType, getPageContent]);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      loadContent();
    }
  };

  // Loading state
  if (loading && !content) {
    return (
      <div className={`flex items-center justify-center min-h-64 ${className}`}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-rose-500" />
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  // Error state (only if no content available)
  if (error && !content && defaultContent.length === 0) {
    return (
      <div className={`flex items-center justify-center min-h-64 ${className}`}>
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Content</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRetry} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Use content from Supabase if available, otherwise fall back to default content
  const sectionsToRender = content?.sections || defaultContent;

  // If no content available at all
  if (sectionsToRender.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-gray-500">No content available for this page.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Real-time update notification */}
      {updateNotification && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <p className="text-green-800 text-sm font-medium">
              Content updated! You're viewing the latest version.
            </p>
            <RefreshCw className="h-4 w-4 text-green-600 ml-auto animate-spin" />
          </div>
        </div>
      )}

      {/* Show error banner if there's an error but we have fallback content */}
      {error && content && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
            <p className="text-amber-800 text-sm">
              Content may be outdated. {error}
            </p>
            <Button
              onClick={handleRetry}
              variant="ghost"
              size="sm"
              className="ml-auto text-amber-700 hover:text-amber-900"
            >
              Refresh
            </Button>
          </div>
        </div>
      )}

      {/* Render content sections */}
      {sectionsToRender.map((section: ContentSection, index: number) => (
        <ContentSectionComponent key={section.id || index} section={section} />
      ))}
    </div>
  );
}

interface ContentSectionComponentProps {
  section: ContentSection;
}

function ContentSectionComponent({ section }: ContentSectionComponentProps) {
  return (
    <section className="space-y-4">
      {section.title && (
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          {section.title}
        </h2>
      )}
      
      {section.content && (
        <div 
          className="prose prose-gray max-w-none
            prose-headings:text-gray-900 
            prose-p:text-gray-700 prose-p:leading-relaxed
            prose-ul:text-gray-700 prose-ol:text-gray-700
            prose-li:mb-1
            prose-strong:text-gray-900
            prose-a:text-rose-600 prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: section.content }}
        />
      )}
    </section>
  );
}