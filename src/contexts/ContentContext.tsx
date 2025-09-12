import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { ContentService, PageContent, ContentPage, ContentWithHistory, PageType, ContentSection } from '../utils/contentService';

// Types for the Content Context
interface ContentState {
  // Cache for page content
  contentCache: Record<PageType, PageContent | null>;
  // Loading states per page type
  loadingStates: Record<PageType, boolean>;
  // Error states per page type
  errorStates: Record<PageType, string | null>;
  // Last updated timestamps
  lastUpdated: Record<PageType, number>;
  // Admin content management state
  adminContent: Record<PageType, ContentPage | null>;
  // Version history for admin
  contentHistory: Record<PageType, ContentWithHistory | null>;
  // Global loading state
  isLoading: boolean;
  // Global error
  globalError: string | null;
  // Real-time subscriptions
  subscriptions: Record<PageType, any>;
  // Admin mode flag
  isAdminMode: boolean;
}

// Action types for the reducer
type ContentAction =
  | { type: 'SET_LOADING'; pageType: PageType; isLoading: boolean }
  | { type: 'SET_CONTENT'; pageType: PageType; content: PageContent | null }
  | { type: 'SET_ERROR'; pageType: PageType; error: string | null }
  | { type: 'SET_ADMIN_CONTENT'; pageType: PageType; adminContent: ContentPage | null }
  | { type: 'SET_CONTENT_HISTORY'; pageType: PageType; history: ContentWithHistory | null }
  | { type: 'SET_GLOBAL_LOADING'; isLoading: boolean }
  | { type: 'SET_GLOBAL_ERROR'; error: string | null }
  | { type: 'SET_SUBSCRIPTION'; pageType: PageType; subscription: any }
  | { type: 'REMOVE_SUBSCRIPTION'; pageType: PageType }
  | { type: 'SET_ADMIN_MODE'; isAdminMode: boolean }
  | { type: 'CLEAR_CACHE'; pageType?: PageType }
  | { type: 'INVALIDATE_CONTENT'; pageType: PageType };

// Initial state
const initialState: ContentState = {
  contentCache: {} as Record<PageType, PageContent | null>,
  loadingStates: {} as Record<PageType, boolean>,
  errorStates: {} as Record<PageType, string | null>,
  lastUpdated: {} as Record<PageType, number>,
  adminContent: {} as Record<PageType, ContentPage | null>,
  contentHistory: {} as Record<PageType, ContentWithHistory | null>,
  isLoading: false,
  globalError: null,
  subscriptions: {} as Record<PageType, any>,
  isAdminMode: false
};

// Reducer function
function contentReducer(state: ContentState, action: ContentAction): ContentState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [action.pageType]: action.isLoading
        }
      };

    case 'SET_CONTENT':
      return {
        ...state,
        contentCache: {
          ...state.contentCache,
          [action.pageType]: action.content
        },
        lastUpdated: {
          ...state.lastUpdated,
          [action.pageType]: Date.now()
        },
        loadingStates: {
          ...state.loadingStates,
          [action.pageType]: false
        },
        errorStates: {
          ...state.errorStates,
          [action.pageType]: null
        }
      };

    case 'SET_ERROR':
      return {
        ...state,
        errorStates: {
          ...state.errorStates,
          [action.pageType]: action.error
        },
        loadingStates: {
          ...state.loadingStates,
          [action.pageType]: false
        }
      };

    case 'SET_ADMIN_CONTENT':
      return {
        ...state,
        adminContent: {
          ...state.adminContent,
          [action.pageType]: action.adminContent
        }
      };

    case 'SET_CONTENT_HISTORY':
      return {
        ...state,
        contentHistory: {
          ...state.contentHistory,
          [action.pageType]: action.history
        }
      };

    case 'SET_GLOBAL_LOADING':
      return {
        ...state,
        isLoading: action.isLoading
      };

    case 'SET_GLOBAL_ERROR':
      return {
        ...state,
        globalError: action.error
      };

    case 'SET_SUBSCRIPTION':
      return {
        ...state,
        subscriptions: {
          ...state.subscriptions,
          [action.pageType]: action.subscription
        }
      };

    case 'REMOVE_SUBSCRIPTION':
      const newSubscriptions = { ...state.subscriptions };
      delete newSubscriptions[action.pageType];
      return {
        ...state,
        subscriptions: newSubscriptions
      };

    case 'SET_ADMIN_MODE':
      return {
        ...state,
        isAdminMode: action.isAdminMode
      };

    case 'CLEAR_CACHE':
      if (action.pageType) {
        const newCache = { ...state.contentCache };
        delete newCache[action.pageType];
        return {
          ...state,
          contentCache: newCache
        };
      }
      return {
        ...state,
        contentCache: {} as Record<PageType, PageContent | null>
      };

    case 'INVALIDATE_CONTENT':
      return {
        ...state,
        contentCache: {
          ...state.contentCache,
          [action.pageType]: null
        },
        lastUpdated: {
          ...state.lastUpdated,
          [action.pageType]: 0
        }
      };

    default:
      return state;
  }
}

// Context interface
interface ContentContextType {
  // State
  state: ContentState;
  
  // Public content methods
  getPageContent: (pageType: PageType, forceRefresh?: boolean) => Promise<PageContent | null>;
  getMultiplePageContent: (pageTypes: PageType[]) => Promise<Record<PageType, PageContent | null>>;
  
  // Admin content methods
  savePageContent: (pageType: PageType, content: PageContent, changeSummary?: string) => Promise<boolean>;
  updatePageContent: (pageType: PageType, content: PageContent, changeSummary?: string) => Promise<boolean>;
  deletePageContent: (pageType: PageType) => Promise<boolean>;
  getContentHistory: (pageType: PageType) => Promise<ContentWithHistory | null>;
  revertToVersion: (pageType: PageType, versionNumber: number) => Promise<boolean>;
  
  // Real-time subscriptions
  subscribeToPageContent: (pageType: PageType) => void;
  unsubscribeFromPageContent: (pageType: PageType) => void;
  
  // Utility methods
  clearCache: (pageType?: PageType) => void;
  setAdminMode: (isAdmin: boolean) => void;
  refreshContent: (pageType: PageType) => Promise<void>;
  
  // Search functionality
  searchContent: (query: string) => Promise<ContentPage[]>;
}

// Create the context
const ContentContext = createContext<ContentContextType | undefined>(undefined);

// Cache expiry time (5 minutes)
const CACHE_EXPIRY_TIME = 5 * 60 * 1000;

// Content Provider Component
export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(contentReducer, initialState);
  
  // Debug logging
  console.log('ContentProvider rendered with state:', state);
  
  // Use refs to access current state and functions in stable callbacks
  const stateRef = useRef(state);
  const getPageContentRef = useRef<((pageType: PageType, forceRefresh?: boolean) => Promise<PageContent | null>) | null>(null);
  stateRef.current = state;

  // Check if cached content is still valid
  const isCacheValid = useCallback((pageType: PageType): boolean => {
    const lastUpdated = state.lastUpdated[pageType];
    if (!lastUpdated) return false;
    return (Date.now() - lastUpdated) < CACHE_EXPIRY_TIME;
  }, [state.lastUpdated]);

  // Get page content with caching
  const getPageContent = useCallback(async (pageType: PageType, forceRefresh = false): Promise<PageContent | null> => {
    // Return cached content if valid and not forcing refresh
    if (!forceRefresh && state.contentCache[pageType] && isCacheValid(pageType)) {
      return state.contentCache[pageType];
    }

    // Set loading state
    dispatch({ type: 'SET_LOADING', pageType, isLoading: true });

    try {
      const content = await ContentService.fetchPageContent(pageType);
      dispatch({ type: 'SET_CONTENT', pageType, content });
      return content;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch content';
      dispatch({ type: 'SET_ERROR', pageType, error: errorMessage });
      return null;
    }
  }, [state.contentCache, isCacheValid]);

  // Update the ref whenever getPageContent changes
  getPageContentRef.current = getPageContent;

  // Get multiple page content in parallel
  const getMultiplePageContent = useCallback(async (pageTypes: PageType[]): Promise<Record<PageType, PageContent | null>> => {
    dispatch({ type: 'SET_GLOBAL_LOADING', isLoading: true });

    try {
      const results = await ContentService.fetchMultiplePageContent(pageTypes);
      
      // Update cache for each page type
      Object.entries(results).forEach(([pageType, content]) => {
        dispatch({ type: 'SET_CONTENT', pageType: pageType as PageType, content });
      });

      dispatch({ type: 'SET_GLOBAL_LOADING', isLoading: false });
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch multiple content';
      dispatch({ type: 'SET_GLOBAL_ERROR', error: errorMessage });
      dispatch({ type: 'SET_GLOBAL_LOADING', isLoading: false });
      return {} as Record<PageType, PageContent | null>;
    }
  }, []);

  // Save new page content (admin only)
  const savePageContent = useCallback(async (pageType: PageType, content: PageContent, changeSummary?: string): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', pageType, isLoading: true });

    try {
      const result = await ContentService.savePageContent(pageType, content, changeSummary);
      
      if (result.success) {
        // Update cache with new content
        dispatch({ type: 'SET_CONTENT', pageType, content });
        if (result.data) {
          dispatch({ type: 'SET_ADMIN_CONTENT', pageType, adminContent: result.data });
        }
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', pageType, error: result.error || 'Failed to save content' });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save content';
      dispatch({ type: 'SET_ERROR', pageType, error: errorMessage });
      return false;
    }
  }, []);

  // Update existing page content (admin only)
  const updatePageContent = useCallback(async (pageType: PageType, content: PageContent, changeSummary?: string): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', pageType, isLoading: true });

    try {
      const result = await ContentService.updatePageContent(pageType, content, changeSummary);
      
      if (result.success) {
        // Update cache with new content
        dispatch({ type: 'SET_CONTENT', pageType, content });
        if (result.data) {
          dispatch({ type: 'SET_ADMIN_CONTENT', pageType, adminContent: result.data });
        }
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', pageType, error: result.error || 'Failed to update content' });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update content';
      dispatch({ type: 'SET_ERROR', pageType, error: errorMessage });
      return false;
    }
  }, []);

  // Delete page content (admin only)
  const deletePageContent = useCallback(async (pageType: PageType): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', pageType, isLoading: true });

    try {
      const result = await ContentService.deletePageContent(pageType);
      
      if (result.success) {
        // Clear from cache
        dispatch({ type: 'CLEAR_CACHE', pageType });
        dispatch({ type: 'SET_ADMIN_CONTENT', pageType, adminContent: null });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', pageType, error: result.error || 'Failed to delete content' });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete content';
      dispatch({ type: 'SET_ERROR', pageType, error: errorMessage });
      return false;
    }
  }, []);

  // Get content with version history (admin only)
  const getContentHistory = useCallback(async (pageType: PageType): Promise<ContentWithHistory | null> => {
    dispatch({ type: 'SET_LOADING', pageType, isLoading: true });

    try {
      const history = await ContentService.fetchContentWithHistory(pageType);
      dispatch({ type: 'SET_CONTENT_HISTORY', pageType, history });
      dispatch({ type: 'SET_LOADING', pageType, isLoading: false });
      return history;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch content history';
      dispatch({ type: 'SET_ERROR', pageType, error: errorMessage });
      return null;
    }
  }, []);

  // Revert to a specific version (admin only)
  const revertToVersion = useCallback(async (pageType: PageType, versionNumber: number): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', pageType, isLoading: true });

    try {
      const result = await ContentService.revertToVersion(pageType, versionNumber);
      
      if (result.success && result.data) {
        // Update cache with reverted content
        dispatch({ type: 'SET_CONTENT', pageType, content: result.data.page_data });
        dispatch({ type: 'SET_ADMIN_CONTENT', pageType, adminContent: result.data });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', pageType, error: result.error || 'Failed to revert content' });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to revert content';
      dispatch({ type: 'SET_ERROR', pageType, error: errorMessage });
      return false;
    }
  }, []);

  // Subscribe to real-time updates
  const subscribeToPageContent = useCallback((pageType: PageType) => {
    // Don't subscribe if already subscribed
    if (stateRef.current.subscriptions[pageType]) {
      return;
    }

    const subscription = ContentService.subscribeToContentChanges(pageType, (payload) => {
      console.log('Real-time content update received:', payload);
      
      // Invalidate cache to force refresh on next access
      dispatch({ type: 'INVALIDATE_CONTENT', pageType });
      
      // If in admin mode, refresh the content immediately
      if (stateRef.current.isAdminMode && getPageContentRef.current) {
        getPageContentRef.current(pageType, true);
      }
    });

    dispatch({ type: 'SET_SUBSCRIPTION', pageType, subscription });
  }, []); // Remove dependencies to prevent recreation

  // Unsubscribe from real-time updates
  const unsubscribeFromPageContent = useCallback((pageType: PageType) => {
    const subscription = stateRef.current.subscriptions[pageType];
    if (subscription) {
      ContentService.unsubscribeFromContentChanges(subscription);
      dispatch({ type: 'REMOVE_SUBSCRIPTION', pageType });
    }
  }, []); // Remove dependencies to prevent recreation

  // Clear cache
  const clearCache = useCallback((pageType?: PageType) => {
    dispatch({ type: 'CLEAR_CACHE', pageType });
  }, []);

  // Set admin mode
  const setAdminMode = useCallback((isAdmin: boolean) => {
    dispatch({ type: 'SET_ADMIN_MODE', isAdminMode: isAdmin });
  }, []);

  // Refresh content
  const refreshContent = useCallback(async (pageType: PageType) => {
    await getPageContent(pageType, true);
  }, [getPageContent]);

  // Search content
  const searchContent = useCallback(async (query: string): Promise<ContentPage[]> => {
    dispatch({ type: 'SET_GLOBAL_LOADING', isLoading: true });

    try {
      const results = await ContentService.searchContent(query);
      dispatch({ type: 'SET_GLOBAL_LOADING', isLoading: false });
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search content';
      dispatch({ type: 'SET_GLOBAL_ERROR', error: errorMessage });
      dispatch({ type: 'SET_GLOBAL_LOADING', isLoading: false });
      return [];
    }
  }, []);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      Object.values(state.subscriptions).forEach(subscription => {
        if (subscription) {
          ContentService.unsubscribeFromContentChanges(subscription);
        }
      });
    };
  }, [state.subscriptions]);

  const contextValue: ContentContextType = {
    state,
    getPageContent,
    getMultiplePageContent,
    savePageContent,
    updatePageContent,
    deletePageContent,
    getContentHistory,
    revertToVersion,
    subscribeToPageContent,
    unsubscribeFromPageContent,
    clearCache,
    setAdminMode,
    refreshContent,
    searchContent
  };

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      Object.keys(stateRef.current.subscriptions).forEach((pageType) => {
        const subscription = stateRef.current.subscriptions[pageType as PageType];
        if (subscription) {
          ContentService.unsubscribeFromContentChanges(subscription);
        }
      });
    };
  }, []);

  return (
    <ContentContext.Provider value={contextValue}>
      {children}
    </ContentContext.Provider>
  );
};

// Custom hook to use the Content Context
export const useContent = (): ContentContextType => {
  const context = useContext(ContentContext);
  if (context === undefined) {
    console.error('useContent hook called outside ContentProvider. Component tree:', {
      stackTrace: new Error().stack
    });
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};

// Export types for use in other components
export type { ContentState, PageType, PageContent, ContentPage, ContentWithHistory, ContentSection };