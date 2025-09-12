import { Home, Search, ShoppingBag, User, Award, Settings, Bug } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Button } from './ui/button';

interface BottomNavProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function BottomNav({ currentPage, onPageChange }: BottomNavProps) {
  const { isAdmin } = useAuth();
  const { items } = useCart();
  const cartItemCount = items ? items.reduce((acc, item) => acc + item.quantity, 0) : 0;

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'catalog', label: 'Shop', icon: Search },
    { id: 'cart', label: 'Cart', icon: ShoppingBag, badge: cartItemCount },
    { id: 'rewards', label: 'Rewards', icon: Award },
    { id: 'profile', label: 'Profile', icon: User },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Settings }] : []),
    ...(process.env.NODE_ENV === 'development' ? [{ id: 'debug', label: 'Debug', icon: Bug }] : [])
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t z-40">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={`flex-col h-auto p-2 min-w-0 flex-1 ${
              currentPage === item.id ? 'text-primary' : 'text-muted-foreground'
            }`}
            onClick={() => onPageChange(item.id)}
          >
            <div className="relative">
              <item.icon className="h-5 w-5" />
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">{item.label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
}