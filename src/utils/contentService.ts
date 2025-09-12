import { supabase } from './supabase/client';
import type { Database } from './supabase/types';

// Type-safe supabase client
type SupabaseClient = typeof supabase;

// Type helpers
type ContentPagesTable = Database['public']['Tables']['content_pages'];
type ContentVersionsTable = Database['public']['Tables']['content_versions'];

// TypeScript interfaces for Content Management
export interface ContentSection {
  id: string;
  title: string;
  content: string;
}

export interface PageContent {
  title: string;
  description: string;
  sections: ContentSection[];
  lastUpdated?: string;
  updatedBy?: string;
  version?: number;
}

export interface ContentPage {
  id: string;
  page_type: string;
  page_data: PageContent;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ContentVersion {
  id: string;
  content_page_id: string;
  version_number: number;
  page_data: PageContent;
  change_summary: string | null;
  created_at: string;
  created_by: string | null;
}

export interface ContentWithHistory {
  current: ContentPage | null;
  history: ContentVersion[];
}

export type PageType = 'about' | 'privacy' | 'terms' | 'shipping' | 'returns' | 'help' | 'contact';

// Content Service Class
export class ContentService {
  /**
   * Fetch active content for a specific page type (public access)
   */
  static async fetchPageContent(pageType: PageType): Promise<PageContent | null> {
    try {
      // Direct query instead of RPC function to avoid type issues
      const { data, error } = await (supabase as any)
        .from('content_pages')
        .select('page_data')
        .eq('page_type', pageType)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error(`Error fetching content for ${pageType}:`, error);
        return null;
      }

      // If no data returned, return null
      if (!data || !data.page_data) {
        return null;
      }

      return data.page_data as PageContent;
    } catch (error) {
      console.error(`Unexpected error fetching content for ${pageType}:`, error);
      return null;
    }
  }

  /**
   * Fetch all active content pages (admin access)
   */
  static async fetchAllContent(): Promise<ContentPage[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('content_pages')
        .select('*')
        .eq('is_active', true)
        .order('page_type');

      if (error) {
        console.error('Error fetching all content:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error fetching all content:', error);
      return [];
    }
  }

  /**
   * Fetch content with version history (admin access)
   */
  static async fetchContentWithHistory(pageType: PageType): Promise<ContentWithHistory | null> {
    try {
      // Get current content
      const { data: currentData, error: currentError } = await (supabase as any)
        .from('content_pages')
        .select('*')
        .eq('page_type', pageType)
        .eq('is_active', true)
        .single();

      if (currentError && currentError.code !== 'PGRST116') {
        console.error(`Error fetching current content for ${pageType}:`, currentError);
        return null;
      }

      // Get version history
      const { data: historyData, error: historyError } = currentData ? await (supabase as any)
        .from('content_versions')
        .select('*')
        .eq('content_page_id', currentData.id)
        .order('version_number', { ascending: false }) : { data: [], error: null };

      if (historyError) {
        console.error(`Error fetching version history for ${pageType}:`, historyError);
        return { current: currentData || null, history: [] };
      }

      return {
        current: currentData || null,
        history: historyData || []
      };
    } catch (error) {
      console.error(`Unexpected error fetching content history for ${pageType}:`, error);
      return null;
    }
  }

  /**
   * Save new content page
   */
  static async savePageContent(
    pageType: PageType, 
    pageData: PageContent, 
    changeSummary?: string
  ): Promise<{ success: boolean; data?: ContentPage; error?: string }> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await (supabase as any)
        .from('content_pages')
        .insert({
          page_type: pageType,
          page_data: pageData,
          created_by: userData.user.id,
          updated_by: userData.user.id
        })
        .select()
        .single();

      if (error) {
        console.error(`Error saving content for ${pageType}:`, error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error(`Unexpected error saving content for ${pageType}:`, error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Update existing content page
   */
  static async updatePageContent(
    pageType: PageType, 
    pageData: PageContent, 
    changeSummary?: string
  ): Promise<{ success: boolean; data?: ContentPage; error?: string }> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        return { success: false, error: 'User not authenticated' };
      }

      // First, get the current content to update
      const { data: currentContent, error: fetchError } = await (supabase as any)
        .from('content_pages')
        .select('id')
        .eq('page_type', pageType)
        .eq('is_active', true)
        .single();

      if (fetchError || !currentContent) {
        console.error(`Error fetching current content for update:`, fetchError);
        return { success: false, error: 'Content not found for update' };
      }

      // Update the content
      const { data, error } = await (supabase as any)
        .from('content_pages')
        .update({
          page_data: pageData,
          updated_by: userData.user.id
        })
        .eq('id', currentContent.id)
        .select()
        .single();

      if (error) {
        console.error(`Error updating content for ${pageType}:`, error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error(`Unexpected error updating content for ${pageType}:`, error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Delete content page (sets is_active to false)
   */
  static async deletePageContent(pageType: PageType): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await (supabase as any)
        .from('content_pages')
        .update({ 
          is_active: false,
          updated_by: userData.user.id
        })
        .eq('page_type', pageType)
        .eq('is_active', true);

      if (error) {
        console.error(`Error deleting content for ${pageType}:`, error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error(`Unexpected error deleting content for ${pageType}:`, error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Revert to a specific version
   */
  static async revertToVersion(
    pageType: PageType, 
    versionNumber: number
  ): Promise<{ success: boolean; data?: ContentPage; error?: string }> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get the content from the specific version
      const { data: versionData, error: versionError } = await (supabase as any)
        .from('content_versions')
        .select('page_data')
        .eq('version_number', versionNumber)
        .limit(1)
        .single();

      if (versionError || !versionData) {
        return { success: false, error: 'Version not found' };
      }

      // Update current content with the version data
      return await this.updatePageContent(
        pageType, 
        versionData.page_data, 
        `Reverted to version ${versionNumber}`
      );
    } catch (error) {
      console.error(`Unexpected error reverting to version:`, error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Subscribe to real-time content changes
   */
  static subscribeToContentChanges(
    pageType: PageType,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel(`content-${pageType}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content_pages',
          filter: `page_type=eq.${pageType}`
        },
        callback
      )
      .subscribe();
  }

  /**
   * Unsubscribe from content changes
   */
  static unsubscribeFromContentChanges(subscription: any) {
    return supabase.removeChannel(subscription);
  }

  /**
   * Get content pages by multiple types (batch fetch)
   */
  static async fetchMultiplePageContent(pageTypes: PageType[]): Promise<Record<PageType, PageContent | null>> {
    try {
      const results: Record<PageType, PageContent | null> = {} as Record<PageType, PageContent | null>;

      // Fetch all requested page types in parallel
      const fetchPromises = pageTypes.map(async (pageType) => {
        const content = await this.fetchPageContent(pageType);
        return { pageType, content };
      });

      const resolvedResults = await Promise.all(fetchPromises);

      // Build the results object
      resolvedResults.forEach(({ pageType, content }) => {
        results[pageType] = content;
      });

      return results;
    } catch (error) {
      console.error('Error fetching multiple page content:', error);
      return {} as Record<PageType, PageContent | null>;
    }
  }

  /**
   * Search content across all pages
   */
  static async searchContent(query: string): Promise<ContentPage[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('content_pages')
        .select('*')
        .eq('is_active', true)
        .textSearch('page_data', query);

      if (error) {
        console.error('Error searching content:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error searching content:', error);
      return [];
    }
  }

  /**
   * Check if user has admin access
   */
  static async checkAdminAccess(): Promise<boolean> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        return false;
      }

      // Check if user has admin role
      const userMetadata = userData.user.user_metadata;
      return userMetadata?.role === 'admin';
    } catch (error) {
      console.error('Error checking admin access:', error);
      return false;
    }
  }
}

// Export default instance
export default ContentService;