import React, { useState, useEffect } from 'react';
import { Save, Edit3, Eye, RotateCcw, FileText, Shield, Truck, HelpCircle, Phone, Heart, Loader2, RefreshCw, Plus, Trash2, History, Clock, User } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Textarea } from '../../ui/textarea';
import { Input } from '../../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Badge } from '../../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { toast } from 'sonner';
import { useContent } from '../../../contexts/ContentContext';
import type { PageType, PageContent, ContentSection, ContentWithHistory } from '../../../utils/contentService';

// Page configurations with UI metadata
const pageConfigs: Array<{
  id: PageType;
  name: string;
  title: string;
  description: string;
  icon: any;
}> = [
  {
    id: 'about',
    name: 'About Us',
    title: 'About Rosémama Clothing',
    description: 'Company information, story, and values',
    icon: Heart,
  },
  {
    id: 'privacy',
    name: 'Privacy Policy',
    title: 'Privacy Policy',
    description: 'How we handle customer data and privacy',
    icon: Shield,
  },
  {
    id: 'terms',
    name: 'Terms of Service',
    title: 'Terms & Conditions',
    description: 'Legal terms and conditions',
    icon: FileText,
  },
  {
    id: 'shipping',
    name: 'Shipping Policy',
    title: 'Shipping & Delivery',
    description: 'Shipping methods and delivery information',
    icon: Truck,
  },
  {
    id: 'returns',
    name: 'Returns Policy',
    title: 'Returns & Exchanges',
    description: 'Return and exchange policy',
    icon: RotateCcw,
  },
  {
    id: 'help',
    name: 'Help Center',
    title: 'Help & Support',
    description: 'Frequently asked questions and support',
    icon: HelpCircle,
  },
  {
    id: 'contact',
    name: 'Contact Us',
    title: 'Contact Information',
    description: 'How to reach our customer service',
    icon: Phone,
  },
];

// Default content for new pages
const createDefaultContent = (pageType: PageType): PageContent => {
  const config = pageConfigs.find(p => p.id === pageType);
  const title = config?.title || 'Page Title';
  
  return {
    title,
    description: config?.description || 'Page description',
    sections: [
      {
        id: `${pageType}-intro`,
        title: 'Introduction',
        content: `<h4>Welcome to ${title}</h4><p>This is the introduction section. Edit this content to provide information about ${pageType}.</p>`,
      }
    ],
  };
};

export function ContentManager() {
  const { 
    state, 
    getPageContent, 
    savePageContent, 
    updatePageContent,
    refreshContent,
    setAdminMode,
    getContentHistory,
    revertToVersion 
  } = useContent();
  
  const [selectedPage, setSelectedPage] = useState<PageType>('about');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [editTitle, setEditTitle] = useState<string>('');
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [currentPageContent, setCurrentPageContent] = useState<PageContent | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState<boolean>(false);
  const [versionHistory, setVersionHistory] = useState<ContentWithHistory | null>(null);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Set admin mode on mount
  useEffect(() => {
    setAdminMode(true);
  }, [setAdminMode]);

  // Load current page content
  useEffect(() => {
    const loadPageContent = async () => {
      const content = await getPageContent(selectedPage);
      const finalContent = content || createDefaultContent(selectedPage);
      setCurrentPageContent(finalContent);
    };
    
    loadPageContent();
  }, [selectedPage, getPageContent]);

  const currentPageConfig = pageConfigs.find(p => p.id === selectedPage);
  const isLoading = state.loadingStates[selectedPage] || false;
  const error = state.errorStates[selectedPage];

  const handleEditSection = (sectionId: string) => {
    const section = currentPageContent?.sections.find(s => s.id === sectionId);
    if (section) {
      setEditingSection(sectionId);
      setEditContent(section.content);
      setEditTitle(section.title);
    }
  };

  const handleSaveSection = async () => {
    if (!editingSection || !currentPageContent) return;

    // Update the local content
    const updatedContent: PageContent = {
      ...currentPageContent,
      sections: currentPageContent.sections.map(section => {
        if (section.id === editingSection) {
          return {
            ...section,
            title: editTitle,
            content: editContent,
          };
        }
        return section;
      })
    };

    // Save to Supabase
    const success = await updatePageContent(selectedPage, updatedContent, 'Updated section content');
    
    if (success) {
      setCurrentPageContent(updatedContent);
      setEditingSection(null);
      setEditContent('');
      setEditTitle('');
      toast.success('Section updated successfully!');
    } else {
      toast.error('Failed to update section. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditContent('');
    setEditTitle('');
  };

  const handleAddSection = async () => {
    if (!currentPageContent) return;

    const newSection: ContentSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      content: '<p>Enter your content here...</p>',
    };

    const updatedContent: PageContent = {
      ...currentPageContent,
      sections: [...currentPageContent.sections, newSection]
    };

    const success = await updatePageContent(selectedPage, updatedContent, 'Added new section');
    
    if (success) {
      setCurrentPageContent(updatedContent);
      toast.success('New section added!');
    } else {
      toast.error('Failed to add section. Please try again.');
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!currentPageContent) return;

    const updatedContent: PageContent = {
      ...currentPageContent,
      sections: currentPageContent.sections.filter(s => s.id !== sectionId)
    };

    const success = await updatePageContent(selectedPage, updatedContent, 'Deleted section');
    
    if (success) {
      setCurrentPageContent(updatedContent);
      toast.success('Section deleted!');
    } else {
      toast.error('Failed to delete section. Please try again.');
    }
  };

  const handleSaveAll = async () => {
    if (!currentPageContent) return;
    
    const success = await updatePageContent(selectedPage, currentPageContent, 'Saved all changes');
    
    if (success) {
      toast.success('All changes saved successfully!');
    } else {
      toast.error('Failed to save changes. Please try again.');
    }
  };

  const handleRestoreDefaults = async () => {
    const defaultContent = createDefaultContent(selectedPage);
    
    const success = await updatePageContent(selectedPage, defaultContent, 'Restored to defaults');
    
    if (success) {
      setCurrentPageContent(defaultContent);
      toast.success('Content restored to defaults!');
    } else {
      toast.error('Failed to restore defaults. Please try again.');
    }
  };

  const handleRefresh = async () => {
    await refreshContent(selectedPage);
    const content = await getPageContent(selectedPage, true);
    setCurrentPageContent(content || createDefaultContent(selectedPage));
    toast.success('Content refreshed!');
  };

  const handleViewHistory = async () => {
    setLoadingHistory(true);
    try {
      const history = await getContentHistory(selectedPage);
      setVersionHistory(history);
      setShowVersionHistory(true);
    } catch (error) {
      toast.error('Failed to load version history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRevertToVersion = async (versionNumber: number) => {
    try {
      const success = await revertToVersion(selectedPage, versionNumber);
      if (success) {
        const content = await getPageContent(selectedPage, true);
        setCurrentPageContent(content || createDefaultContent(selectedPage));
        setShowVersionHistory(false);
        toast.success(`Reverted to version ${versionNumber} successfully!`);
      } else {
        toast.error('Failed to revert to selected version');
      }
    } catch (error) {
      toast.error('Failed to revert to selected version');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!currentPageConfig) {
    return <div>Page configuration not found</div>;
  }

  return (
    <div className="space-y-6 w-full overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">Content Management System</h1>
        <p className="text-purple-100">
          Manage information pages, policies, and user-helpful content with Supabase integration
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={handleSaveAll} 
            className="bg-green-600 hover:bg-green-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {isPreviewMode ? 'Edit Mode' : 'Preview Mode'}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            onClick={handleViewHistory}
            disabled={loadingHistory}
          >
            {loadingHistory ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <History className="h-4 w-4 mr-2" />
            )}
            Version History
          </Button>
        </div>
        <Button 
          variant="destructive" 
          onClick={handleRestoreDefaults}
          className="bg-orange-600 hover:bg-orange-700"
          disabled={isLoading}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Restore Defaults
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-4">
            <p className="text-red-700 dark:text-red-300">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Page Tabs */}
      <Tabs value={selectedPage} onValueChange={(value) => setSelectedPage(value as PageType)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 h-auto min-h-[3rem] p-1">
          {pageConfigs.map(page => {
            const IconComponent = page.icon;
            return (
              <TabsTrigger 
                key={page.id} 
                value={page.id} 
                className="flex items-center gap-2 px-2 py-2 text-xs sm:text-sm whitespace-nowrap overflow-hidden"
              >
                <IconComponent className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate">{page.name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={selectedPage} className="space-y-6 mt-6">
          
          {/* Page Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <currentPageConfig.icon className="h-5 w-5" />
                {currentPageConfig.title}
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{currentPageConfig.description}</p>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <Badge variant="secondary">
                  {currentPageContent?.sections.length || 0} section{(currentPageContent?.sections.length || 0) !== 1 ? 's' : ''}
                </Badge>
                <Button onClick={handleAddSection} size="sm" disabled={isLoading}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Section
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sections */}
          <div className="space-y-4">
            {/* Debug info */}
            <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
              Debug: currentPageContent = {currentPageContent ? 'exists' : 'null'}, 
              sections = {currentPageContent?.sections.length || 0}
            </div>
            
            {currentPageContent?.sections.map((section) => (
              <Card key={section.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                        <span>Section ID: {section.id}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {editingSection === section.id ? (
                        <>
                          <Button size="sm" onClick={handleSaveSection} disabled={isLoading}>
                            <Save className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditSection(section.id)}
                            disabled={isLoading}
                          >
                            <Edit3 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteSection(section.id)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {editingSection === section.id ? (
                    <div className="space-y-4">
                      <Input 
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Section title"
                      />
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[200px] font-mono text-sm"
                        placeholder="Section content (supports HTML)"
                      />
                      <div className="text-xs text-muted-foreground">
                        💡 You can use HTML tags like &lt;h4&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, etc.
                      </div>
                    </div>
                  ) : isPreviewMode ? (
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: section.content }}
                    />
                  ) : (
                    <div className="bg-muted p-4 rounded border font-mono text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {section.content}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {/* Show message when no sections exist */}
            {(!currentPageContent?.sections || currentPageContent.sections.length === 0) && (
              <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                      No Content Sections
                    </h3>
                    <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                      This page doesn't have any content sections yet. Click "Add Section" to get started.
                    </p>
                    <Button onClick={handleAddSection} disabled={isLoading}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Section
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

        </TabsContent>
      </Tabs>

      {/* Help Text */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Content Management Tips</h4>
              <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                <li>• Content is automatically saved to Supabase database</li>
                <li>• Use HTML tags for formatting (h4, p, ul, li, strong, etc.)</li>
                <li>• Preview mode shows how content will appear to users</li>
                <li>• Changes are synced across all admin users in real-time</li>
                <li>• Use "Restore Defaults" to reset content to original state</li>
                <li>• Version history tracks all changes with timestamps</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Version History Dialog */}
      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History - {currentPageConfig?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {versionHistory ? (
              <>
                {/* Current Version */}
                {versionHistory.current && (
                  <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Badge variant="default" className="bg-green-600">
                              Current Version {versionHistory.current.version}
                            </Badge>
                          </CardTitle>
                          <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(versionHistory.current.updated_at)}
                            </span>
                            {versionHistory.current.updated_by && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {versionHistory.current.updated_by}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm">
                        <strong>Title:</strong> {versionHistory.current.page_data.title}
                      </div>
                      <div className="text-sm mt-1">
                        <strong>Sections:</strong> {versionHistory.current.page_data.sections.length}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Version History */}
                {versionHistory.history.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Previous Versions</h4>
                    {versionHistory.history.map((version) => (
                      <Card key={version.id} className="border-gray-200">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Badge variant="outline">
                                  Version {version.version_number}
                                </Badge>
                              </CardTitle>
                              <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(version.created_at)}
                                </span>
                                {version.created_by && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {version.created_by}
                                  </span>
                                )}
                              </div>
                              {version.change_summary && (
                                <div className="text-xs text-gray-600 mt-1">
                                  <strong>Changes:</strong> {version.change_summary}
                                </div>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRevertToVersion(version.version_number)}
                              className="text-xs"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Revert
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xs">
                            <strong>Title:</strong> {version.page_data.title}
                          </div>
                          <div className="text-xs mt-1">
                            <strong>Sections:</strong> {version.page_data.sections.length}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-gray-200">
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No version history available</p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Loading version history...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}