import React, { useState, useCallback, memo } from 'react';
import { ShoppingCart, User, Search, Menu, Sun, Moon, Sparkles, Users, UserCheck, Tag, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useCart } from '../utils/cartUtils';
import { useTheme } from '../utils/ThemeContext';
import { VerificationBadge } from './VerificationBanner';
import { NotificationCenter } from './notifications/NotificationCenter';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onSearch?: (query: string) => void;
  cartItemCount?: number;
  onProfileClick?: () => void;
  onInfoClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch, cartItemCount = 0, onProfileClick, onInfoClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { cart } = useCart();
  const { user } = useAuth();
  
  const actualCartItemCount = cart?.reduce((total, item) => total + item.quantity, 0) || cartItemCount;

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  }, [onSearch, searchQuery]);

  const navItems = [
    { name: 'New Arrivals', href: '#new', icon: Sparkles, onClick: () => {} },
    { name: 'Women', href: '#women', icon: Users, onClick: () => {} },
    { name: 'Men', href: '#men', icon: UserCheck, onClick: () => {} },
    { name: 'Sale', href: '#sale', icon: Tag, onClick: () => {} },
    { name: 'About', href: '#about', icon: Info, onClick: () => onInfoClick?.() },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <a href="#" className="text-2xl font-bold text-primary">
              Rosemama<br />
              <span className="text-xs mt-1 block">CLOTHING</span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={item.onClick}
                  className="p-2 rounded-md text-foreground hover:text-primary hover:bg-muted transition-colors"
                  title={item.name}
                  aria-label={item.name}
                >
                  <IconComponent className="h-5 w-5" />
                </button>
              );
            })}
          </nav>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 bg-muted/50 border-0 focus:bg-background"
                />
              </div>
            </form>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full hover:bg-muted"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* Notifications - only show for authenticated users */}
            {user && (
              <NotificationCenter className="rounded-full hover:bg-muted" />
            )}

            {/* Cart */}
            <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-muted">
              <ShoppingCart className="h-5 w-5" />
              {actualCartItemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-[10px] font-bold">
                  {actualCartItemCount}
                </Badge>
              )}
            </Button>

            {/* User Account */}
            <VerificationBadge />
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted" onClick={onProfileClick}>
              <User className="h-5 w-5" />
            </Button>

            {/* Mobile Menu Trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden rounded-full hover:bg-muted">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-8">
                  {/* Mobile Search */}
                  <form onSubmit={handleSearch}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10"
                      />
                    </div>
                  </form>

                  {/* Mobile Navigation */}
                  <nav className="flex flex-col space-y-3">
                    {navItems.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <button
                          key={item.name}
                          onClick={() => {
                            item.onClick();
                            setIsMobileMenuOpen(false);
                          }}
                          className="flex items-center text-lg font-medium text-foreground hover:text-primary transition-colors py-2 text-left"
                        >
                          <IconComponent className="h-5 w-5 mr-3" />
                          {item.name}
                        </button>
                      );
                    })}
                  </nav>

                  {/* Mobile Actions */}
                  <div className="flex flex-col space-y-3 border-t pt-4">
                    <Button variant="ghost" className="justify-start" onClick={toggleTheme}>
                      {theme === 'dark' ? (
                        <><Sun className="h-4 w-4 mr-2" /> Light mode</>
                      ) : (
                        <><Moon className="h-4 w-4 mr-2" /> Dark mode</>
                      )}
                    </Button>
                    <Button variant="ghost" className="justify-start">
                      <User className="h-4 w-4 mr-2" />
                      Account
                    </Button>
                    <Button variant="ghost" className="justify-start">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Cart ({actualCartItemCount})
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default memo(Header);
