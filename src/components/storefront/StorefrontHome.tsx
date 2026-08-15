import React, { useState } from 'react';
import { Search, User, ShoppingCart, ArrowUpRight, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { LoadingSprite } from '../ui/LoadingSprite';
import { Badge } from '../ui/badge';
import type { StorefrontCallbacks } from './types';
import '../../styles/home.css';

const CATEGORIES = ['Dresses', 'Casual', 'Shoes', 'Outwear', 'Party', 'Accessories'];

const FEATURED = [
  { img: '/images/rosemama003.png', name: 'Jackets', count: 361, category: 'Outwear', tall: true },
  { img: '/images/rosemama004.png', name: 'Shirts', count: 174, category: 'Casual', tall: false },
  { img: '/images/rosemama005.png', name: 'Trousers', count: 89, category: 'Casual', tall: false },
  { img: '/images/rosemama006.png', name: 'Accessories', count: 42, category: 'Accessories', tall: true },
];

const AVATARS = [
  { initials: 'JD', gradient: 'linear-gradient(135deg, #a78bfa, #7c3aed)' },
  { initials: 'SM', gradient: 'linear-gradient(135deg, #fb923c, #ec4899)' },
  { initials: 'AL', gradient: 'linear-gradient(135deg, #34d399, #06b6d4)' },
];

export function StorefrontHome({
  onViewProduct,
  onNavigateToCategory,
  onShopAll
}: StorefrontCallbacks) {
  const [activeTab, setActiveTab] = useState('Dresses');
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return <LoadingSprite onComplete={() => setIsLoading(false)} />;
  }

  return (
    <div className="home-page">
      <div className="home-inner">

        {/* ──────────── HEADER ──────────── */}
        <header className="home-header">
          <div className="home-logo" onClick={() => onShopAll?.()}>
            <span className="home-logo-main">ROSEMAMA</span>
            <span className="home-logo-tag">CLOTHING</span>
          </div>

          <nav className="home-nav-links">
            <a href="#" onClick={e => { e.preventDefault(); onNavigateToCategory?.('All'); }} className="home-nav-link">Shop</a>
            <a href="#" onClick={e => { e.preventDefault(); onNavigateToCategory?.('Dresses'); }} className="home-nav-link">Collections</a>
            <a href="#" onClick={e => { e.preventDefault(); onShopAll?.(); }} className="home-nav-link">New In</a>
          </nav>

          <div className="home-header-actions">
            <button className="home-icon-btn home-search-btn" onClick={() => onShopAll?.()} aria-label="Search">
              <Search size={18} />
            </button>
            <button className="home-icon-btn home-profile-btn" aria-label="Profile">
              <User size={18} />
            </button>
            <button className="home-icon-btn home-cart-btn" onClick={() => onShopAll?.()} aria-label="Cart">
              <ShoppingCart size={18} />
              <span className="home-cart-dot" />
            </button>
          </div>
        </header>

        {/* ──────────── HERO ──────────── */}
        <section className="home-hero">

          {/* Image — first on mobile */}
          <div className="home-hero-image-col">
            <div className="home-hero-img-wrap">
              <img
                src="/images/rosemama001.png"
                alt="Fashion Model"
                className="home-hero-img"
              />
              <div className="home-hero-img-overlay" />
              <button className="home-hero-cta-btn" onClick={() => onShopAll?.()}>
                <ArrowUpRight size={20} />
              </button>
            </div>
            <div className="home-dot home-dot-1" />
            <div className="home-dot home-dot-2" />
          </div>

          {/* Text */}
          <div className="home-hero-text-col">
            <h1 className="home-hero-title">
              where<span className="home-hero-dash" />a&nbsp;style
              <br />moment
            </h1>

            <div className="home-social-proof">
              <div className="home-avatar-stack">
                {AVATARS.map(({ initials, gradient }) => (
                  <div key={initials} className="home-avatar" style={{ background: gradient }}>{initials}</div>
                ))}
              </div>
              <p className="home-social-text">
                Loved by <strong>+20K</strong><br />happy customers
              </p>
            </div>

            <div className="home-stat-row">
              <span className="home-stat-label">Active<br/>Followers</span>
              <span className="home-stat-number">320K</span>
            </div>

            <button className="home-shop-btn" onClick={() => onShopAll?.()}>
              Shop the Collection <ArrowRight size={14} />
            </button>
          </div>
        </section>

        {/* ──────────── CATEGORY TABS ──────────── */}
        <div className="home-tabs-wrap">
          <div className="home-tabs">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setActiveTab(cat); onNavigateToCategory?.(cat); }}
                className={`home-tab${activeTab === cat ? ' home-tab-active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ──────────── BRAND STORY ──────────── */}
        <section className="home-story-grid">

          {/* Left: heading + image */}
          <div className="home-story-left">
            <div className="home-story-heading">
              <span className="home-eyebrow">Our Story</span>
              <h2 className="home-story-title">
                It's about<br />
                <em>moments.</em>
                <sup>©24</sup>
              </h2>
            </div>

            <div className="home-story-img-wrap">
              <img
                src="/images/rosemama002.png"
                alt="Featured collection"
                className="home-story-img"
              />
              <div className="home-story-img-overlay" />
              <button className="home-story-img-btn" onClick={() => onNavigateToCategory?.(activeTab)}>
                <ArrowUpRight size={16} />
              </button>
              <div className="home-story-img-label">{activeTab} Collection</div>
            </div>
          </div>

          {/* Right: dark testimonial card */}
          <div className="home-story-right">
            <div className="home-testimonial-card">
              {/* Orange glow blob */}
              <div className="home-testimonial-glow" />

              <div className="home-testimonial-inner">
                {/* Stars */}
                <div className="home-stars">
                  {'★★★★★'.split('').map((s, i) => (
                    <span key={i} className="home-star">{s}</span>
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="home-testimonial-quote">
                  "Finally, a brand that truly understands modern elegance. The quality is amazing & every piece feels like it was made for me."
                </blockquote>

                {/* Reviewer */}
                <div className="home-reviewer">
                  <div className="home-reviewer-avatar">R</div>
                  <div className="home-reviewer-info">
                    <p className="home-reviewer-name">Roxy M.</p>
                    <p className="home-reviewer-title">Verified Customer · Gold Member</p>
                  </div>
                  <div className="home-verified-badge">✓</div>
                </div>

                {/* Tagline footer */}
                <p className="home-testimonial-footer">
                  Fashion is more than clothing — it's an expression of who you are.
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div className="home-mini-stats">
              {[
                { value: '4.9★', label: 'Avg Rating' },
                { value: '48h', label: 'Fast Shipping' },
                { value: '30d', label: 'Free Returns' },
              ].map(({ value, label }) => (
                <div key={label} className="home-mini-stat">
                  <span className="home-mini-stat-value">{value}</span>
                  <span className="home-mini-stat-label">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ──────────── SELECTED PIECES ──────────── */}
        <section className="home-pieces">
          <div className="home-pieces-header">
            <div>
              <h3 className="home-pieces-title">
                Selected <em>Pieces</em>
              </h3>
              <p className="home-pieces-subtitle">Hand-picked from this season's edit</p>
            </div>
            <a
              href="#"
              onClick={e => { e.preventDefault(); onShopAll?.(); }}
              className="home-view-all-btn"
            >
              View All <ArrowUpRight size={12} />
            </a>
          </div>

          <div className="home-pieces-grid">
            {FEATURED.map((item, idx) => (
              <div
                key={idx}
                className={`home-piece-card${item.tall ? ' home-piece-tall' : ' home-piece-short'}`}
                onClick={() => onNavigateToCategory?.(item.category)}
              >
                <img src={item.img} alt={item.name} className="home-piece-img" />
                <div className="home-piece-overlay" />

                <span className="home-piece-num">
                  {String(idx + 1).padStart(2, '0')}
                </span>

                <div className="home-piece-info">
                  <h4 className="home-piece-name">{item.name}</h4>
                  <div className="home-piece-meta">
                    <span>{item.count} styles</span>
                    <span className="home-piece-arrow"><ArrowUpRight size={14} /></span>
                  </div>
                </div>
              </div>
            ))}
            {/* Add empty state when no featured items */}
            {FEATURED.length === 0 && <p className="home-empty-state">No items found matching your criteria</p>}
          </div>
        </section>

        {/* ──────────── NEWSLETTER ──────────── */}
        <section className="home-newsletter">
          <div className="home-newsletter-glow home-newsletter-glow-1" />
          <div className="home-newsletter-glow home-newsletter-glow-2" />
          <div className="home-newsletter-content">
            <span className="home-eyebrow home-eyebrow-orange">Stay in the loop</span>
            <h4 className="home-newsletter-title">
              Early access to<br /><em>new drops & sales.</em>
            </h4>
            <div className="home-newsletter-form">
              <input type="email" placeholder="your@email.com" className="home-newsletter-input" />
              <button className="home-newsletter-btn" onClick={() => {}}>Join</button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
