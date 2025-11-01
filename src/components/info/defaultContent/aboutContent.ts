import { ContentSection } from '../../../utils/contentService';

export const defaultAboutContent: ContentSection[] = [
  {
    id: 'hero-section',
    title: 'Welcome to Rosémama Clothing',
    content: `
      <p class="text-xl text-gray-600 mb-6">Where fashion meets passion, and style tells your story.</p>
      
      <p>Rosémama Clothing was born from a simple belief: every woman deserves to feel confident, beautiful, and empowered through fashion. Founded in South Africa, we've grown from a small boutique dream into a trusted destination for women who appreciate quality, style, and authentic craftsmanship.</p>
    `
  },
  {
    id: 'our-story',
    title: 'Our Story',
    content: `
      <p>What started as a passion project in 2015 has blossomed into a movement celebrating women of all ages, sizes, and styles. Our founder, Rosemary, noticed a gap in the market for fashion that was both accessible and aspirational – clothing that made women feel amazing without breaking the bank.</p>
      
      <p>From our headquarters in Midrand, Johannesburg, we carefully curate and design pieces that celebrate the modern African woman. Each piece in our collection is selected or created with intention, ensuring it meets our high standards for quality, comfort, and style.</p>
    `
  },
  {
    id: 'our-mission',
    title: 'Our Mission',
    content: `
      <p>To empower women through fashion by providing:</p>
      
      <ul>
        <li><strong>Quality Pieces:</strong> Carefully selected fabrics and construction that last</li>
        <li><strong>Inclusive Sizing:</strong> Fashion for every body type and size</li>
        <li><strong>Accessible Luxury:</strong> High-end looks at reasonable prices</li>
        <li><strong>Sustainable Practices:</strong> Ethical sourcing and environmental responsibility</li>
        <li><strong>Personal Style:</strong> Pieces that help you express your unique personality</li>
      </ul>
    `
  },
  {
    id: 'our-values',
    title: 'Our Values',
    content: `
      <div class="grid md:grid-cols-2 gap-6 mt-6">
        <div class="p-6 bg-rose-50 rounded-lg">
          <h4 class="font-semibold text-rose-800 mb-2">Quality First</h4>
          <p class="text-gray-700">We believe in investing in pieces that will love you back. Every item undergoes rigorous quality checks.</p>
        </div>
        
        <div class="p-6 bg-pink-50 rounded-lg">
          <h4 class="font-semibold text-pink-800 mb-2">Customer-Centric</h4>
          <p class="text-gray-700">Your satisfaction drives everything we do. From design to delivery, you're at the heart of our decisions.</p>
        </div>
        
        <div class="p-6 bg-purple-50 rounded-lg">
          <h4 class="font-semibold text-purple-800 mb-2">Sustainable Fashion</h4>
          <p class="text-gray-700">We're committed to reducing our environmental impact through responsible sourcing and packaging.</p>
        </div>
        
        <div class="p-6 bg-blue-50 rounded-lg">
          <h4 class="font-semibold text-blue-800 mb-2">Authentic Style</h4>
          <p class="text-gray-700">Fashion should reflect who you are, not who you think you should be. We celebrate individuality.</p>
        </div>
      </div>
    `
  },
  {
    id: 'our-team',
    title: 'Meet Our Team',
    content: `
      <p class="mb-8">Behind every great fashion brand is a passionate team of dreamers, creators, and style enthusiasts.</p>
      
      <div class="grid md:grid-cols-3 gap-8">
        <div class="text-center">
          <img src="/images/placeholder-product.svg" alt="Rosemary Oku" class="w-32 h-32 rounded-full mx-auto mb-4 object-cover">
          <h4 class="font-semibold text-lg">Rosemary Oku</h4>
          <p class="text-rose-600 font-medium">Founder & CEO</p>
          <p class="text-gray-600 text-sm mt-2">Fashion visionary with 15+ years in luxury retail, bringing dreams to life through sustainable fashion.</p>
        </div>
        
        <div class="text-center">
          <img src="/images/placeholder-product.svg" alt="James Chen" class="w-32 h-32 rounded-full mx-auto mb-4 object-cover">
          <h4 class="font-semibold text-lg">James Chen</h4>
          <p class="text-rose-600 font-medium">Creative Director</p>
          <p class="text-gray-600 text-sm mt-2">Award-winning designer from Milan Fashion Week, creating pieces that blend elegance with everyday wearability.</p>
        </div>
        
        <div class="text-center">
          <img src="/images/placeholder-product.svg" alt="Sarah Johnson" class="w-32 h-32 rounded-full mx-auto mb-4 object-cover">
          <h4 class="font-semibold text-lg">Sarah Johnson</h4>
          <p class="text-rose-600 font-medium">Head of Sustainability</p>
          <p class="text-gray-600 text-sm mt-2">Environmental advocate ensuring our fashion choices contribute to a better world for future generations.</p>
        </div>
      </div>
    `
  },
  {
    id: 'our-stats',
    title: 'Our Impact',
    content: `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div class="p-4">
          <div class="text-3xl font-bold text-rose-600 mb-2">50K+</div>
          <div class="text-gray-600">Happy Customers</div>
        </div>
        
        <div class="p-4">
          <div class="text-3xl font-bold text-rose-600 mb-2">25+</div>
          <div class="text-gray-600">Countries Served</div>
        </div>
        
        <div class="p-4">
          <div class="text-3xl font-bold text-rose-600 mb-2">10+</div>
          <div class="text-gray-600">Years of Excellence</div>
        </div>
        
        <div class="p-4">
          <div class="text-3xl font-bold text-rose-600 mb-2">4.9</div>
          <div class="text-gray-600">Customer Rating</div>
        </div>
      </div>
    `
  },
  {
    id: 'contact-info',
    title: 'Get in Touch',
    content: `
      <p class="mb-6">We'd love to hear from you! Whether you have questions about our products, need styling advice, or want to share your feedback, we're here to help.</p>
      
      <div class="grid md:grid-cols-3 gap-6">
        <div class="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
          <div class="bg-rose-100 p-2 rounded-full">
            <svg class="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
          </div>
          <div>
            <h5 class="font-semibold mb-1">Email Us</h5>
            <p class="text-gray-600 text-sm">hello@rosemamaclothing.store</p>
          </div>
        </div>
        
        <div class="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
          <div class="bg-rose-100 p-2 rounded-full">
            <svg class="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
            </svg>
          </div>
          <div>
            <h5 class="font-semibold mb-1">Call Us</h5>
            <p class="text-gray-600 text-sm">+27 73 551 4705</p>
          </div>
        </div>
        
        <div class="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
          <div class="bg-rose-100 p-2 rounded-full">
            <svg class="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </div>
          <div>
            <h5 class="font-semibold mb-1">Visit Us</h5>
            <p class="text-gray-600 text-sm">New Road, Midrand<br>Johannesburg, South Africa</p>
          </div>
        </div>
      </div>
    `
  }
];