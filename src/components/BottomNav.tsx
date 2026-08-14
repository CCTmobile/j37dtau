import React, { useState, useEffect, useRef } from 'react';
import { Home, Search, ShoppingBag, User, Award, Settings, Bug } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import '../styles/nav.css';

interface BottomNavProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function BottomNav({ currentPage, onPageChange }: BottomNavProps) {
  const { isAdmin } = useAuth();
  const { items } = useCart();
  const cartItemCount = items ? items.reduce((acc, item) => acc + item.quantity, 0) : 0;

  const navItems = [
    { id: 'home',    label: 'Home',    icon: Home },
    { id: 'catalog', label: 'Shop',    icon: Search },
    { id: 'cart',    label: 'Cart',    icon: ShoppingBag, badge: cartItemCount },
    { id: 'rewards', label: 'Rewards', icon: Award },
    { id: 'profile', label: 'Profile', icon: User },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Settings }] : []),
    ...(process.env.NODE_ENV === 'development' ? [{ id: 'debug', label: 'Debug', icon: Bug }] : []),
  ] as { id: string; label: string; icon: React.ElementType; badge?: number }[];

  // Scroll-collapse for home page top nav
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentPage !== 'home') { setIsHidden(false); return; }

    const handleScroll = () => {
      const current = window.scrollY;
      if (current > 80) {
        setIsHidden(current > lastScrollY.current);
      } else {
        setIsHidden(false);
      }
      lastScrollY.current = current;

      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => setIsHidden(false), 1500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [currentPage]);

  const isHome = currentPage === 'home';

  /* ── Home page: compact top bar ── */
  if (isHome) {
    return (
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${isHidden ? '-translate-y-full' : 'translate-y-0'}`}
        style={{ background: 'rgba(17,17,17,0.88)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      >
        <div className="flex items-center justify-around px-1" style={{ height: '3.25rem' }}>
          {navItems.map(({ id, label, icon: Icon, badge }) => {
            const active = currentPage === id;
            return (
              <button
                key={id}
                onClick={() => onPageChange(id)}
                className="nav-home-btn"
                data-active={active}
                aria-label={label}
              >
                <span className="nav-home-icon-wrap" data-active={active}>
                  <Icon size={16} strokeWidth={active ? 2.5 : 1.8} />
                  {badge && badge > 0 ? (
                    <span className="nav-badge">{badge > 9 ? '9+' : badge}</span>
                  ) : null}
                </span>
                <span className="nav-home-label" data-active={active}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  /* ── All other pages: floating bottom pill ── */
  return (
    <div className="nav-float-wrap">
      <nav className="nav-float-pill">
        {navItems.map(({ id, label, icon: Icon, badge }) => {
          const active = currentPage === id;
          return (
            <button
              key={id}
              onClick={() => onPageChange(id)}
              className={`nav-float-btn${active ? ' nav-float-btn-active' : ''}`}
              aria-label={label}
            >
              {active && <span className="nav-float-indicator" aria-hidden />}
              <span className="nav-float-icon-wrap">
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                {badge && badge > 0 ? (
                  <span className="nav-badge nav-badge-dark">{badge > 9 ? '9+' : badge}</span>
                ) : null}
              </span>
              <span className="nav-float-label">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}