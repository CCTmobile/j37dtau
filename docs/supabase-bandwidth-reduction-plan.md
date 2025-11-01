# Supabase Bandwidth Reduction Plan

## Current Situation
- **Cached Egress Used**: 5.569 GB / 5 GB (111%)
- **Storage Objects**: 387 product images (57 MB)
- **Active Products**: 25 products with ~2.1 images each
- **Problem**: Excessive bandwidth from image loading without caching

## Root Causes

### 1. Image Loading Inefficiency
```typescript
// PROBLEM: Every product fetch generates Supabase Storage URLs
const publicUrl = supabase.storage.from('product-images').getPublicUrl(cleanPath).data.publicUrl;
```

### 2. Responsive Image Srcset Multiplier
```typescript
// PROBLEM: Generates 4 versions of each image URL
const sizes = [400, 800, 1200, 1600];
return sizes.map(size => `${baseSrc}?width=${size} ${size}w`).join(', ');
```
This means **1 image = 4 bandwidth requests**!

### 3. No Browser Caching
- Supabase Storage URLs change on every page load
- No Cache-Control headers optimization
- Images re-downloaded on every visit

---

## SOLUTION PLAN

### Phase 1: IMMEDIATE FIXES (Today)

#### 1.1 Remove Srcset Width Parameters
**Impact**: Reduces bandwidth by 75%

```typescript
// src/components/ui/responsive-image.tsx
const generateSrcSet = (baseSrc: string) => {
  // REMOVE width parameter variations
  return baseSrc; // Just use base URL
};
```

#### 1.2 Add Image URL Caching
**Impact**: Reduces repeated URL generation

```typescript
// Create URL cache in ProductContext
const imageUrlCache = new Map<string, string>();

const getImageUrl = (imagePath: string): string => {
  if (imageUrlCache.has(imagePath)) {
    return imageUrlCache.get(imagePath)!;
  }
  
  const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
  const publicUrl = supabase.storage
    .from('product-images')
    .getPublicUrl(cleanPath).data.publicUrl;
  
  imageUrlCache.set(imagePath, publicUrl);
  return publicUrl;
};
```

#### 1.3 Implement Lazy Loading Properly
**Impact**: Only load visible images

```typescript
// Ensure IntersectionObserver is working
loading="lazy" // Add to all <img> tags
```

---

### Phase 2: SHORT-TERM OPTIMIZATIONS (This Week)

#### 2.1 Image Optimization
- Compress all product images (target: 50-80 KB each)
- Convert to WebP format (60-70% smaller than JPEG)
- Use tools: `sharp`, `imagemin`, or online compressors

**Expected savings**: 50-60% storage & bandwidth reduction

#### 2.2 Move Image URLs to Database
Store full Supabase URLs in `products.images` column to avoid runtime URL generation:

```sql
-- Migration: Store full URLs instead of paths
UPDATE products 
SET images = (
  SELECT jsonb_agg(
    'https://your-project.supabase.co/storage/v1/object/public/product-images/' || elem::text
  )
  FROM jsonb_array_elements_text(images) elem
);
```

#### 2.3 Enable Supabase Storage Cache Headers
In Supabase Dashboard > Storage > product-images bucket:
- Set `Cache-Control: public, max-age=31536000` (1 year)
- Enable immutable caching

---

### Phase 3: MEDIUM-TERM SOLUTIONS (Next Sprint)

#### 3.1 Implement CDN Integration
**Options:**
- **Cloudflare CDN** (Free tier available)
  - Configure as reverse proxy for Supabase Storage
  - Enable image optimization & caching
  - Reduce Supabase egress by 80-90%

- **Cloudinary / ImageKit.io** (Free tiers)
  - Upload images to CDN service
  - Auto-optimization & WebP delivery
  - Update `products.images` URLs

**Implementation:**
```typescript
// Replace Supabase URLs with CDN URLs
const CDN_BASE = 'https://cdn.rosemamaclothing.store/images/';
const imageUrl = CDN_BASE + imagePath;
```

#### 3.2 Implement Progressive Image Loading
```typescript
// Load thumbnail first, then full image
<img 
  src={thumbnailUrl} // Low-res placeholder
  data-full={fullImageUrl}
  onLoad={loadFullImage}
/>
```

---

### Phase 4: LONG-TERM ARCHITECTURE (Future)

#### 4.1 Upgrade Supabase Plan
If traffic continues to grow:
- **Pro Plan**: $25/month → 50 GB egress included
- **Team Plan**: $599/month → 250 GB egress

#### 4.2 Hybrid Storage Strategy
- **Supabase**: Store data, auth, realtime features
- **External CDN**: Serve all static assets (images, CSS, JS)
- **GitHub Pages**: Already hosting frontend

#### 4.3 Implement Service Worker Caching
```typescript
// Cache images aggressively in browser
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/images/')) {
    event.respondWith(
      caches.match(event.request).then(response => 
        response || fetch(event.request)
      )
    );
  }
});
```

---

## IMPLEMENTATION PRIORITY

### 🔴 Critical (Do Today)
1. ✅ Remove srcset width parameters
2. ✅ Add image URL caching in ProductContext
3. ✅ Verify lazy loading is working

### 🟡 High Priority (This Week)
4. ⏳ Compress existing product images
5. ⏳ Store full URLs in database
6. ⏳ Configure Supabase Storage cache headers

### 🟢 Medium Priority (Next Sprint)
7. ⏳ Implement CDN (Cloudflare recommended)
8. ⏳ Add service worker image caching
9. ⏳ Monitor bandwidth usage

---

## MONITORING

### Track Bandwidth Usage
```sql
-- Query to estimate data transfer
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  SUM((metadata->>'size')::bigint) as total_bytes,
  pg_size_pretty(SUM((metadata->>'size')::bigint)) as total_size
FROM storage.objects
GROUP BY bucket_id;
```

### Set Up Alerts
- Supabase Dashboard > Settings > Usage Alerts
- Set threshold at 80% of quota

---

## EXPECTED RESULTS

| Phase | Action | Bandwidth Reduction | Timeline |
|-------|--------|---------------------|----------|
| 1 | Remove srcset params | **-75%** | Today |
| 1 | Add URL caching | **-20%** | Today |
| 2 | Image compression | **-50%** | This week |
| 2 | Database URL storage | **-30%** | This week |
| 3 | CDN integration | **-80%** | Next sprint |

**Combined estimated reduction**: **85-90% bandwidth savings**

---

## NEXT STEPS

1. Review and approve this plan
2. I'll implement Phase 1 fixes immediately
3. Test on staging/local environment
4. Deploy to production
5. Monitor bandwidth for 24-48 hours
6. Proceed to Phase 2 if needed

Would you like me to start implementing Phase 1 fixes now?
