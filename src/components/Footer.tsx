import React from 'react';
import { Heart, Mail, Phone, MapPin, Shield, FileText, HelpCircle } from 'lucide-react';

interface FooterProps {
  onInfoClick?: (page: string) => void;
}

export function Footer({ onInfoClick }: FooterProps) {
  const handleInfoNavigation = (page: string) => {
    if (onInfoClick) {
      onInfoClick(page);
    }
  };

  return (
    <footer className="bg-gradient-to-r from-slate-900 to-slate-800 text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-rose-400" />
              <h3 className="text-xl font-bold">Rosémama</h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Fashion that inspires, quality that endures. Creating beautiful pieces 
              for the modern woman since 2014.
            </p>
            <div className="flex gap-4 pt-2">
              <button className="text-slate-300 hover:text-white transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </button>
              <button className="text-slate-300 hover:text-white transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.747-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                </svg>
              </button>
              <button className="text-slate-300 hover:text-white transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Shop</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><button className="hover:text-white transition-colors">New Arrivals</button></li>
              <li><button className="hover:text-white transition-colors">Women</button></li>
              <li><button className="hover:text-white transition-colors">Men</button></li>
              <li><button className="hover:text-white transition-colors">Sale</button></li>
              <li><button className="hover:text-white transition-colors">Size Guide</button></li>
            </ul>
          </div>

          {/* Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Information</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <button 
                  onClick={() => handleInfoNavigation('about')}
                  className="hover:text-white transition-colors flex items-center gap-2"
                >
                  <Heart className="h-3 w-3" />
                  About Us
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleInfoNavigation('shipping')}
                  className="hover:text-white transition-colors"
                >
                  Shipping & Returns
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleInfoNavigation('help')}
                  className="hover:text-white transition-colors flex items-center gap-2"
                >
                  <HelpCircle className="h-3 w-3" />
                  FAQ & Support
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleInfoNavigation('contact')}
                  className="hover:text-white transition-colors"
                >
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <button 
                  onClick={() => handleInfoNavigation('privacy')}
                  className="hover:text-white transition-colors flex items-center gap-2"
                >
                  <Shield className="h-3 w-3" />
                  Privacy Policy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleInfoNavigation('terms')}
                  className="hover:text-white transition-colors flex items-center gap-2"
                >
                  <FileText className="h-3 w-3" />
                  Terms of Service
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleInfoNavigation('returns')}
                  className="hover:text-white transition-colors"
                >
                  Return Policy
                </button>
              </li>
            </ul>
            
            {/* Contact Info */}
            <div className="pt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Mail className="h-3 w-3" />
                hello@rosemamaclothing.store
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Phone className="h-3 w-3" />
                +27 735 514 705
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <MapPin className="h-3 w-3" />
                Midrand, South Africa
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-400">
            © 2024 Rosémama Clothing. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-slate-400">
            <button 
              onClick={() => handleInfoNavigation('privacy')}
              className="hover:text-white transition-colors"
            >
              Privacy
            </button>
            <button 
              onClick={() => handleInfoNavigation('terms')}
              className="hover:text-white transition-colors"
            >
              Terms
            </button>
            <button 
              onClick={() => handleInfoNavigation('help')}
              className="hover:text-white transition-colors"
            >
              Support
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}