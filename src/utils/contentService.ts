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
   * with improved error handling and fallbacks
   */
  static async fetchPageContent(pageType: PageType): Promise<PageContent | null> {
    try {
      // Direct query instead of RPC function to avoid type issues
      const { data, error } = await (supabase as any)
        .from('content_pages')
        .select('page_data')
        .eq('page_type', pageType)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.warn(`Database error fetching content for ${pageType}:`, error);
        // Return fallback content instead of null
        return this.getFallbackContent(pageType);
      }

      // If no data returned, return fallback content
      if (!data || !data.page_data) {
        console.info(`No content found in database for ${pageType}, using fallback`);
        return this.getFallbackContent(pageType);
      }

      return data.page_data as unknown as PageContent;
    } catch (error) {
      console.error(`Unexpected error fetching content for ${pageType}:`, error);
      return this.getFallbackContent(pageType);
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

      return (data || []).map((page: any) => ({
        ...page,
        page_data: page.page_data as unknown as PageContent
      }));
    } catch (error) {
      console.error('Unexpected error fetching all content:', error);
      return [];
    }
  }

  /**
   * Get fallback content when database is not available or content is missing
   */
  static getFallbackContent(pageType: PageType): PageContent {
    const fallbackContent: Record<PageType, PageContent> = {
      about: {
        title: "About Rosémama Clothing",
        description: "Learn about our story, values, and team",
        sections: [
          {
            id: "company-story",
            title: "Our Story",
            content: "<p>Founded by Rosemary Oku, Rosémama began as a boutique in Midrand, South Africa with a vision to make beautiful, quality fashion accessible to every South African woman.</p>"
          },
          {
            id: "mission-values",
            title: "Our Mission & Values",
            content: "<p><strong>Our Mission:</strong> To democratize fashion by providing high-quality, sustainable clothing that empowers women to express their unique style with confidence.</p>"
          }
        ]
      },
      privacy: {
        title: "Privacy Policy",
        description: "Our commitment to protecting your privacy",
        sections: [
          {
            id: "introduction",
            title: "Introduction",
            content: "<p>At Rosémama Clothing, we are committed to protecting your privacy and personal information. This policy explains how we collect, use, and protect your data.</p>"
          }
        ]
      },
      terms: {
        title: "Terms & Conditions",
        description: "Legal terms and conditions",
        sections: [
          {
            id: "introduction",
            title: "Introduction",
            content: "<h4>Welcome to Terms & Conditions</h4><p>This is the introduction section. Edit this content to provide information about terms.</p><p>These terms and conditions govern your use of Rosémama Clothing's services. By using our website and services, you agree to these terms.</p>"
          },
          {
            id: "acceptance",
            title: "Acceptance of Terms",
            content: "<p>By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.</p>"
          },
          {
            id: "use-license",
            title: "Use License",
            content: "<p>Permission is granted to temporarily download one copy of the materials on Rosémama Clothing's website for personal, non-commercial transitory viewing only.</p>"
          },
          {
            id: "disclaimer",
            title: "Disclaimer",
            content: "<p>The materials on Rosémama Clothing's website are provided on an 'as is' basis. Rosémama Clothing makes no warranties, expressed or implied.</p>"
          }
        ]
      },
      shipping: {
        title: "Shipping Information",
        description: "Delivery options and policies",
        sections: [
          {
            id: "delivery-options",
            title: "Delivery Options",
            content: "<p>We offer various shipping options to suit your needs. Standard delivery takes 3-5 business days within South Africa.</p>"
          }
        ]
      },
      returns: {
        title: "Returns & Exchanges",
        description: "Our return and exchange policy",
        sections: [
          {
            id: "return-policy",
            title: "Return Policy",
            content: "<p>We accept returns within 72 hrs of purchase. Items must be in original condition with tags attached.</p>"
          }
        ]
      },
      help: {
        title: "Help & Support",
        description: "Get help with your orders and account",
        sections: [
          {
            id: "faq",
            title: "Frequently Asked Questions",
            content: "<p>Find answers to common questions about our products, orders, and services.</p>"
          }
        ]
      },
      contact: {
        title: "Contact Us",
        description: "Get in touch with our team",
        sections: [
          {
            id: "contact-info",
            title: "Contact Information",
            content: "<p>Reach out to us for any questions or support. We're here to help!</p>"
          }
        ]
      }
    };

    return fallbackContent[pageType];
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

      const formattedCurrentData = currentData ? {
        ...currentData,
        page_data: currentData.page_data as unknown as PageContent
      } : null;

      // Get version history
      const { data: historyData, error: historyError } = currentData ? await (supabase as any)
        .from('content_versions')
        .select('*')
        .eq('content_page_id', currentData.id)
        .order('version_number', { ascending: false }) : { data: [], error: null };

      if (historyError) {
        console.error(`Error fetching version history for ${pageType}:`, historyError);
        return { current: formattedCurrentData, history: [] };
      }

      const formattedHistory = (historyData || []).map((version: any) => ({
        ...version,
        page_data: version.page_data as unknown as PageContent
      }));

      return {
        current: formattedCurrentData,
        history: formattedHistory
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

      return {
        success: true,
        data: {
          ...data,
          page_data: data.page_data as unknown as PageContent
        }
      };
    } catch (error) {
      console.error(`Unexpected error saving content for ${pageType}:`, error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Update existing content page or create if it doesn't exist
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

      // First, try to get the current content
      const { data: currentContent, error: fetchError } = await (supabase as any)
        .from('content_pages')
        .select('id')
        .eq('page_type', pageType)
        .eq('is_active', true)
        .maybeSingle();

      // If page doesn't exist, create it
      if (!currentContent) {
        return await this.savePageContent(pageType, pageData, changeSummary);
      }

      // Update the existing content
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

      return {
        success: true,
        data: {
          ...data,
          page_data: data.page_data as unknown as PageContent
        }
      };
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
        versionData.page_data as unknown as PageContent,
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

      return (data || []).map((page: any) => ({
        ...page,
        page_data: page.page_data as unknown as PageContent
      }));
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

  /**
   * Check if the content management system is properly set up
   */
  static async checkDatabaseHealth(): Promise<{
    tableExists: boolean;
    hasData: boolean;
    error?: string;
  }> {
    try {
      // Try to query the content_pages table
      const { data, error } = await (supabase as any)
        .from('content_pages')
        .select('id, page_type')
        .limit(1);

      if (error) {
        return {
          tableExists: false,
          hasData: false,
          error: error.message
        };
      }

      return {
        tableExists: true,
        hasData: !!data && data.length > 0,
        error: undefined
      };
    } catch (error) {
      return {
        tableExists: false,
        hasData: false,
        error: (error as Error).message
      };
    }
  }
}

// Export default instance
export default ContentService;