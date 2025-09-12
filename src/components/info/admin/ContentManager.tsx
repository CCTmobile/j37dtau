import React, { useState, useEffect } from 'react';
import { Save, Edit3, Eye, RotateCcw, FileText, Shield, Truck, HelpCircle, Phone, Heart } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Textarea } from '../../ui/textarea';
import { Input } from '../../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Badge } from '../../ui/badge';
import { toast } from 'sonner';

interface ContentSection {
  id: string;
  title: string;
  content: string;
  lastUpdated: string;
  updatedBy: string;
}

interface PageContent {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: any;
  sections: ContentSection[];
}

const defaultPages: PageContent[] = [
  {
    id: 'about',
    name: 'About Us',
    title: 'About Rosémama Clothing',
    description: 'Company information, story, and values',
    icon: Heart,
    sections: [
      {
        id: 'company-story',
        title: 'Our Story',
        content: 'Founded in 2014 by Maria Rodriguez, Rosémama began as a small boutique...',
        lastUpdated: '2024-12-01',
        updatedBy: 'Admin'
      },
      {
        id: 'mission',
        title: 'Our Mission',
        content: 'To democratize fashion by providing high-quality, sustainable clothing...',
        lastUpdated: '2024-12-01',
        updatedBy: 'Admin'
      }
    ]
  },
  {
    id: 'privacy',
    name: 'Privacy Policy',
    title: 'Privacy Policy',
    description: 'How we handle customer data and privacy',
    icon: Shield,
    sections: [
      {
        id: 'data-collection',
        title: 'Information We Collect',
        content: 'We collect information you provide directly to us...',
        lastUpdated: '2024-12-01',
        updatedBy: 'Admin'
      }
    ]
  },
  {
    id: 'shipping',
    name: 'Shipping Policy',
    title: 'Shipping & Delivery',
    description: 'Shipping methods and delivery information',
    icon: Truck,
    sections: [
      {
        id: 'shipping-methods',
        title: 'Shipping Methods',
        content: 'Standard Shipping (5-7 business days)...',
        lastUpdated: '2024-12-01',
        updatedBy: 'Admin'
      }
    ]
  }
];

export function ContentManager() {
  const [pages, setPages] = useState<PageContent[]>(defaultPages);
  const [selectedPage, setSelectedPage] = useState<string>('about');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);

  // Load content from localStorage on mount
  useEffect(() => {
    const savedContent = localStorage.getItem('rosemama-content-pages');
    if (savedContent) {
      try {
        const parsed = JSON.parse(savedContent);
        setPages(parsed);
      } catch (error) {
        console.error('Error loading saved content:', error);
      }
    }
  }, []);

  // Save content to localStorage
  const saveContent = () => {
    try {
      localStorage.setItem('rosemama-content-pages', JSON.stringify(pages));
      toast.success('Content saved successfully!');
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Failed to save content');
    }
  };

  const currentPage = pages.find(p => p.id === selectedPage);

  const handleEditSection = (sectionId: string) => {
    const section = currentPage?.sections.find(s => s.id === sectionId);
    if (section) {
      setEditingSection(sectionId);
      setEditContent(section.content);
    }
  };

  const handleSaveSection = () => {
    if (!editingSection || !currentPage) return;

    const updatedPages = pages.map(page => {
      if (page.id === selectedPage) {
        return {
          ...page,
          sections: page.sections.map(section => {
            if (section.id === editingSection) {
              return {
                ...section,
                content: editContent,
                lastUpdated: new Date().toISOString().split('T')[0],
                updatedBy: 'Admin'
              };
            }
            return section;
          })
        };
      }
      return page;
    });

    setPages(updatedPages);
    setEditingSection(null);
    setEditContent('');
    toast.success('Section updated successfully!');
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditContent('');
  };

  const handleAddSection = () => {
    if (!currentPage) return;

    const newSection: ContentSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      content: 'Enter your content here...',
      lastUpdated: new Date().toISOString().split('T')[0],
      updatedBy: 'Admin'
    };

    const updatedPages = pages.map(page => {
      if (page.id === selectedPage) {
        return {
          ...page,
          sections: [...page.sections, newSection]
        };
      }
      return page;
    });

    setPages(updatedPages);
    toast.success('New section added!');
  };

  const handleDeleteSection = (sectionId: string) => {
    if (!currentPage) return;

    const updatedPages = pages.map(page => {
      if (page.id === selectedPage) {
        return {
          ...page,
          sections: page.sections.filter(s => s.id !== sectionId)
        };
      }
      return page;
    });

    setPages(updatedPages);
    toast.success('Section deleted!');
  };

  const handleRestoreDefaults = () => {
    setPages(defaultPages);
    localStorage.removeItem('rosemama-content-pages');
    toast.success('Content restored to defaults!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">Content Management System</h1>
        <p className="text-purple-100">
          Manage information pages, policies, and user-helpful content
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div className="flex gap-2">
          <Button onClick={saveContent} className="bg-green-600 hover:bg-green-700">
            <Save className="h-4 w-4 mr-2" />
            Save All Changes
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {isPreviewMode ? 'Edit Mode' : 'Preview Mode'}
          </Button>
        </div>
        <Button 
          variant="destructive" 
          onClick={handleRestoreDefaults}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Restore Defaults
        </Button>
      </div>

      {/* Page Tabs */}
      <Tabs value={selectedPage} onValueChange={setSelectedPage}>
        <TabsList className="grid w-full grid-cols-3">
          {pages.map(page => {
            const IconComponent = page.icon;
            return (
              <TabsTrigger key={page.id} value={page.id} className="flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                {page.name}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {pages.map(page => (
          <TabsContent key={page.id} value={page.id} className="space-y-6">
            
            {/* Page Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <page.icon className="h-5 w-5" />
                  {page.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{page.description}</p>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <Badge variant="secondary">
                    {page.sections.length} section{page.sections.length !== 1 ? 's' : ''}
                  </Badge>
                  <Button onClick={handleAddSection} size="sm">
                    Add Section
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sections */}
            <div className="space-y-4">
              {page.sections.map((section) => (
                <Card key={section.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{section.title}</CardTitle>
                        <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                          <span>Last updated: {section.lastUpdated}</span>
                          <span>By: {section.updatedBy}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {editingSection === section.id ? (
                          <>
                            <Button size="sm" onClick={handleSaveSection}>
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
                            >
                              <Edit3 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDeleteSection(section.id)}
                            >
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
                          value={section.title}
                          onChange={(e) => {
                            const updatedPages = pages.map(p => {
                              if (p.id === selectedPage) {
                                return {
                                  ...p,
                                  sections: p.sections.map(s => 
                                    s.id === section.id ? { ...s, title: e.target.value } : s
                                  )
                                };
                              }
                              return p;
                            });
                            setPages(updatedPages);
                          }}
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
            </div>

          </TabsContent>
        ))}
      </Tabs>

      {/* Help Text */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Content Management Tips</h4>
              <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                <li>• Use HTML tags for formatting (h4, p, ul, li, strong, etc.)</li>
                <li>• Changes are saved locally until you click "Save All Changes"</li>
                <li>• Preview mode shows how content will appear to users</li>
                <li>• Use "Restore Defaults" to reset all content to original state</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}