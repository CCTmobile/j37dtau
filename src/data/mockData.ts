import type { Product } from '../App';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Elegant Evening Dress',
    category: 'Party',
    price: 2879.82,
    originalPrice: 3599.82,
    images: ['https://images.unsplash.com/photo-1678637803638-0bcc1e13ecae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwd29tZW4lMjBkcmVzcyUyMGVsZWdhbnR8ZW58MXx8fHwxNzU1ODA0ODU4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Black', 'Navy', 'Burgundy'],
    description: 'A sophisticated evening dress perfect for special occasions. Made from premium fabric with elegant draping.',
    reviews: [
      { id: '1', userId: '1', userName: 'Sarah M.', rating: 5, comment: 'Absolutely gorgeous! Perfect fit and quality.', date: '2024-01-15' }
    ],
    rating: 4.8,
    inStock: true
  },
  {
    id: '2',
    name: 'Casual Comfort Wear',
    category: 'Casual',
    price: 1439.82,
    images: ['https://images.unsplash.com/photo-1733564377865-997953d57fd4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2FzdWFsJTIwd2VhciUyMGNsb3RoaW5nfGVufDF8fHx8MTc1NTgwNDg2MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['White', 'Beige', 'Gray', 'Black'],
    description: 'Ultra-comfortable casual wear perfect for everyday styling. Soft, breathable fabric.',
    reviews: [
      { id: '2', userId: '2', userName: 'Emma L.', rating: 4, comment: 'Great quality and very comfortable!', date: '2024-01-12' }
    ],
    rating: 4.5,
    inStock: true
  },
  {
    id: '3',
    name: 'Designer Sneakers',
    category: 'Shoes',
    price: 2339.82,
    images: ['https://images.unsplash.com/photo-1627909298382-89c38c8ffc7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwc2hvZXMlMjBzbmVha2VycyUyMGhlZWxzfGVufDF8fHx8MTc1NTgwNDg2Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
    sizes: ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10'],
    colors: ['White', 'Black', 'Pink', 'Blue'],
    description: 'Trendy designer sneakers that combine style and comfort. Perfect for any casual outfit.',
    reviews: [],
    rating: 4.7,
    inStock: true
  },
  {
    id: '4',
    name: 'Premium Winter Jacket',
    category: 'Outwear',
    price: 4499.82,
    originalPrice: 5399.82,
    images: ['https://images.unsplash.com/photo-1727518154538-59e7dc479f8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwb3V0ZXJ3ZWFyJTIwamFja2V0JTIwY29hdHxlbnwxfHx8fDE3NTU4MDQ4NjR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Black', 'Brown', 'Camel'],
    description: 'Warm and stylish winter jacket made from premium materials. Weather-resistant and fashionable.',
    reviews: [],
    rating: 4.6,
    inStock: true
  },
  {
    id: '5',
    name: 'Sequin Party Dress',
    category: 'Party',
    price: 4410.00,
    originalPrice: 5382.00,
    images: ['https://images.unsplash.com/photo-1539008835657-9e8e9680c956?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwc2VxdWluJTIwZHJlc3N8ZW58MXx8fHwxNzU1ODA1MDUxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Gold', 'Silver', 'Black'],
    description: 'Stunning sequin dress that sparkles and shines. Perfect for New Year\'s Eve, parties, or any special occasion.',
    reviews: [
      { id: '3', userId: '3', userName: 'Lily R.', rating: 5, comment: 'Love this dress! So glamorous and comfortable.', date: '2024-12-01' }
    ],
    rating: 4.9,
    inStock: true
  },
  {
    id: '6',
    name: 'Floral Summer Dress',
    category: 'Dresses',
    price: 1619.82,
    images: ['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwd29tZW4lMjBmbG9yYWwlMjBkcmVzc3xlbnwxfHx8fDE3NTU4MDQ4NTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Blue', 'Pink', 'White'],
    description: 'Beautiful floral pattern summer dress with a flowy silhouette. Light and breathable for warm weather.',
    reviews: [
      { id: '4', userId: '4', userName: 'Anna K.', rating: 4, comment: 'Perfect summer dress! Very flattering cut.', date: '2024-06-15' }
    ],
    rating: 4.4,
    inStock: true
  },
  {
    id: '7',
    name: 'Vintage Denim Jacket',
    category: 'Outwear',
    price: 2519.82,
    images: ['https://images.unsplash.com/photo-1544022613-e87ca75a784a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwZGVuaW0lMjBqYWNrZXR8ZW58MXx8fHwxNzU1ODA0ODYxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Blue', 'Black', 'Light Blue'],
    description: 'Classic vintage washed denim jacket. Perfect for layering over any outfit all year round.',
    reviews: [
      { id: '5', userId: '5', userName: 'Mike D.', rating: 4, comment: 'Great quality denim, fits perfectly.', date: '2024-03-20' }
    ],
    rating: 4.3,
    inStock: true
  },
  {
    id: '8',
    name: 'Comfort Yoga Set',
    category: 'Casual',
    price: 1439.82,
    images: ['https://images.unsplash.com/photo-1506629905607-97b78c2464c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIweW9nYSUyMHNldHxlbnwxfHx8fDE3NTU4MDUwNTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Gray', 'Black', 'Purple', 'Teal'],
    description: 'Moisture-wicking yoga set perfect for workouts or lounging. Breathable and stretchy fabric.',
    reviews: [
      { id: '6', userId: '6', userName: 'Rachel G.', rating: 5, comment: 'Amazing quality and so comfortable!', date: '2024-08-10' }
    ],
    rating: 4.6,
    inStock: true
  },
  {
    id: '9',
    name: 'Leather Ankle Boots',
    category: 'Shoes',
    price: 2879.82,
    originalPrice: 3599.82,
    images: ['https://images.unsplash.com/photo-1544966503-7cc5ac882d5d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwc2hvZXMlMjBib290c3xlbnwxfHx8fDE3NTU4MDQ4NjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
    sizes: ['5', '6', '7', '8', '9', '10'],
    colors: ['Black', 'Brown', 'Tan'],
    description: 'Classic leather ankle boots with a comfortable fit and versatile style for any season.',
    reviews: [
      { id: '7', userId: '7', userName: 'Sophie B.', rating: 4, comment: 'Great boots, very comfortable and stylish.', date: '2024-09-05' }
    ],
    rating: 4.5,
    inStock: true
  },
  {
    id: '10',
    name: 'Crystal Statement Necklace',
    category: 'Accessories',
    price: 899.82,
    images: ['https://images.unsplash.com/photo-1535630278352-8b3eb041eba8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwYWNjZXNzb3JpZXMlMjBuZWNrbGFjZXxlbnwxfHx8fDE3NTU4MDQ4NjR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
    sizes: ['One Size'],
    colors: ['Silver', 'Gold'],
    description: 'Eye-catching crystal necklace that adds glamour to any outfit. Perfect for parties or elegant occasions.',
    reviews: [
      { id: '8', userId: '8', userName: 'Maria S.', rating: 5, comment: 'Beautiful crystals, great quality!', date: '2024-11-20' }
    ],
    rating: 4.7,
    inStock: true
  },
  {
    id: '11',
    name: 'Summer Beach Dress',
    category: 'Dresses',
    price: 1259.82,
    images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwc3VtZ25qciUyMGRmcmVzcyUyMGJlYWNofGVufDF8fHx8MTc1NTgwNTA1NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Coral', 'Blue', 'Yellow'],
    description: 'Light and breezy beach dress perfect for summer vacations. Flowy fabric and vibrant colors.',
    reviews: [],
    rating: 4.2,
    inStock: true
  },
  {
    id: '12',
    name: 'Professional Blazer',
    category: 'Outwear',
    price: 3419.82,
    images: ['https://images.unsplash.com/photo-1598808503746-f34c53b9323e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwcG93d2luZXRmyNZpbGV8ZW58MXx8fHwxNzU1ODA1MDU1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Black', 'Navy', 'Gray'],
    description: 'Tailored professional blazer for office wear or formal occasions. Elegant and sophisticated.',
    reviews: [
      { id: '9', userId: '9', userName: 'Jennifer W.', rating: 4, comment: 'Perfect for work, very professional.', date: '2024-07-15' }
    ],
    rating: 4.4,
    inStock: true
  },
  {
    id: '13',
    name: 'Sporty sneakers',
    category: 'Shoes',
    price: 1799.82,
    originalPrice: 2339.82,
    images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwc3BvcnR5JTIwc25lYWtlcnN8ZW58MXx8fHwxNzU1ODA1MDU2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
    sizes: ['6', '7', '8', '9', '10', '11'],
    colors: ['White', 'Black', 'Neon Green'],
    description: 'High-performance sneakers for running or casual wear. Excellent cushioning and support.',
    reviews: [],
    rating: 4.5,
    inStock: false
  },
  {
    id: '14',
    name: 'Delicate Silver Earrings',
    category: 'Accessories',
    price: 539.82,
    images: ['https://images.unsplash.com/photo-1520050191862-c4ba12322a58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwZWFycmluZ3MlMjBzaWx2ZXJ8ZW58MXx8fHwxNzU1ODA1MDU3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
    sizes: ['One Size'],
    colors: ['Silver', 'Gold'],
    description: 'Elegant silver drop earrings that add a touch of sophistication to any look.',
    reviews: [],
    rating: 4.3,
    inStock: true
  },
  {
    id: '15',
    name: 'Maxi Beach Skirt',
    category: 'Dresses',
    price: 1439.82,
    images: ['https://images.unsplash.com/photo-1594223274512-ad4803739b7c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbWF4aSUyMGJlyYWNofGVufDF8fHx8MTc1NTgwNTA1OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['White', 'Beige', 'Blue'],
    description: 'Flowy maxi skirt perfect for beach days or casual summer outings. Light and breezy.',
    reviews: [
      { id: '10', userId: '10', userName: 'Olivia M.', rating: 4, comment: 'Beautiful skirt, perfect for summer!', date: '2024-05-22' }
    ],
    rating: 4.5,
    inStock: true
  }
];
