import React, { useState } from 'react';
import { ArrowLeft, Menu, Info, FileText, HelpCircle, Shield, Truck, RotateCcw, Phone } from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';

interface InfoLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  onBack: () => void;
}

const infoPages = [
  {
    id: 'about',
    title: 'About Us',
    description: 'Learn about Rosémama Clothing',
    icon: Info,
    category: 'Company'
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    description: 'How we protect your data',
    icon: Shield,
    category: 'Legal'
  },
  {
    id: 'terms',
    title: 'Terms of Service',
    description: 'Our terms and conditions',
    icon: FileText,
    category: 'Legal'
  },
  {
    id: 'shipping',
    title: 'Shipping Policy',
    description: 'Delivery information',
    icon: Truck,
    category: 'Policies'
  },
  {
    id: 'returns',
    title: 'Return Policy',
    description: 'Returns and exchanges',
    icon: RotateCcw,
    category: 'Policies'
  },
  {
    id: 'help',
    title: 'Help Center',
    description: 'FAQ and support',
    icon: HelpCircle,
    category: 'Support'
  },
  {
    id: 'contact',
    title: 'Contact Us',
    description: 'Get in touch',
    icon: Phone,
    category: 'Support'
  }
];

export function InfoLayout({ children, title, description, onBack }: InfoLayoutProps) {
  const [showSidebar, setShowSidebar] = useState(false);

  const categories = Array.from(new Set(infoPages.map(page => page.category)));

  const NavigationContent = () => (
    <div className="space-y-6">
      <div className="text-center pb-4 border-b">
        <h3 className="font-semibold text-lg">Information Center</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Everything you need to know about Rosémama
        </p>
      </div>
      
      {categories.map(category => (
        <div key={category} className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            {category}
          </h4>
          <div className="space-y-1">
            {infoPages
              .filter(page => page.category === category)
              .map(page => {
                const IconComponent = page.icon;
                return (
                  <Button
                    key={page.id}
                    variant="ghost"
                    className="w-full justify-start h-auto p-3 text-left"
                    onClick={() => {
                      // Navigation logic will be implemented later
                      setShowSidebar(false);
                    }}
                  >
                    <IconComponent className="h-4 w-4 mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{page.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {page.description}
                      </div>
                    </div>
                  </Button>
                );
              })
            }
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex-1">
              <h1 className="text-xl font-bold">{title}</h1>
              {description && (
                <p className="text-sm text-white/80 mt-1">{description}</p>
              )}
            </div>

            {/* Mobile Menu */}
            <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-white hover:bg-white/20"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <NavigationContent />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-24 bg-card border rounded-lg p-4">
              <NavigationContent />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-card border rounded-lg p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}