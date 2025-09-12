import React from 'react';
import { Heart, Star, Users, Globe, Award, Sparkles, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface AboutUsProps {
  onNavigate?: (page: string) => void;
}

export function AboutUs({ onNavigate }: AboutUsProps) {
  const stats = [
    { icon: Users, label: 'Happy Customers', value: '50K+' },
    { icon: Globe, label: 'Countries Served', value: '25+' },
    { icon: Award, label: 'Years of Excellence', value: '10+' },
    { icon: Star, label: 'Customer Rating', value: '4.9' }
  ];

  const team = [
    {
      name: 'Maria Rodriguez',
      role: 'Founder & CEO',
      description: 'Fashion visionary with 15+ years in luxury retail',
      image: '/images/placeholder-product.svg'
    },
    {
      name: 'James Chen',
      role: 'Creative Director',
      description: 'Award-winning designer from Milan Fashion Week',
      image: '/images/placeholder-product.svg'
    },
    {
      name: 'Sarah Johnson',
      role: 'Head of Sustainability',
      description: 'Environmental advocate and ethical fashion expert',
      image: '/images/placeholder-product.svg'
    }
  ];

  const values = [
    {
      icon: Heart,
      title: 'Passion for Fashion',
      description: 'We believe fashion is a form of self-expression that should be accessible to everyone.'
    },
    {
      icon: Globe,
      title: 'Sustainable Practices',
      description: 'Committed to eco-friendly materials and ethical manufacturing processes.'
    },
    {
      icon: Users,
      title: 'Community First',
      description: 'Building a inclusive community where every customer feels valued and beautiful.'
    },
    {
      icon: Sparkles,
      title: 'Quality & Style',
      description: 'Curating premium pieces that combine timeless elegance with modern trends.'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white px-4 py-2 rounded-full">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">About Rosémama Clothing</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Fashion that Inspires, Quality that Endures
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Since 2014, Rosémama has been dedicated to bringing you carefully curated fashion pieces 
          that celebrate individuality while maintaining the highest standards of quality and sustainability.
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="text-center p-4 bg-gradient-to-br from-muted/50 to-muted rounded-lg">
              <IconComponent className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column 1: Our Story */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary/5 to-secondary/10 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Our Story</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Founded in 2014 by Maria Rodriguez, Rosémama began as a small boutique in Midrand, South Africa 
                with a simple mission: to make high-quality, sustainable fashion accessible to everyone.
              </p>
              <p>
                What started as a passion project has grown into a beloved South African brand, but our core values 
                remain unchanged. We believe that fashion should be a force for good, both for our 
                customers and for the community.
              </p>
              <p>
                Today, we're proud to serve customers across South Africa and beyond, each one part of our 
                growing Rosémama family. Every piece in our collection is carefully selected or 
                designed with love, attention to detail, and respect for our beautiful country and environment.
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Get in Touch</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-sm">hello@rosemamaclothing.store</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-sm">+27 735 514 705</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm">New Road, Midrand, South Africa</span>
              </div>
            </div>
            <Button 
              className="w-full mt-4" 
              onClick={() => onNavigate?.('contact')}
            >
              Contact Us
            </Button>
          </div>
        </div>

        {/* Column 2: Our Values */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-secondary/5 to-primary/10 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Our Values</h2>
            <div className="space-y-4">
              {values.map((value, index) => {
                const IconComponent = value.icon;
                return (
                  <div key={index} className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{value.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{value.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sustainability Focus */}
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-3 text-green-800 dark:text-green-200">
              Sustainability Commitment
            </h3>
            <div className="space-y-3 text-sm text-green-700 dark:text-green-300">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-900">100%</Badge>
                <span>Sustainable materials by 2025</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-900">Carbon</Badge>
                <span>Neutral shipping & packaging</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-900">Fair</Badge>
                <span>Trade certified suppliers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Our Team */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-accent/5 to-muted/10 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Meet Our Team</h2>
            <div className="space-y-4">
              {team.map((member, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-muted rounded-full overflow-hidden">
                      <img 
                        src={member.image} 
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{member.name}</h4>
                    <p className="text-sm text-primary font-medium">{member.role}</p>
                    <p className="text-xs text-muted-foreground mt-1">{member.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mission Statement */}
          <div className="bg-gradient-to-br from-primary to-secondary text-white p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Our Mission</h3>
            <p className="text-sm opacity-90 leading-relaxed">
              "To democratize fashion by providing high-quality, sustainable clothing that empowers 
              individuals to express their unique style while contributing to a more ethical and 
              environmentally conscious fashion industry."
            </p>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-xs opacity-75 italic">- Maria Rodriguez, Founder & CEO</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Learn More</h3>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => onNavigate?.('shipping')}
              >
                Shipping & Returns
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => onNavigate?.('help')}
              >
                Size Guide & FAQ
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => onNavigate?.('privacy')}
              >
                Privacy & Terms
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center p-8 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
        <h3 className="text-xl font-semibold mb-2">Join the Rosémama Family</h3>
        <p className="text-muted-foreground mb-4">
          Be the first to know about new collections, exclusive offers, and sustainability initiatives.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => onNavigate?.('catalog')}>
            Shop Now
          </Button>
          <Button variant="outline" onClick={() => onNavigate?.('contact')}>
            Newsletter Signup
          </Button>
        </div>
      </div>
    </div>
  );
}