import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { Plus, Minus, Trash2, ShoppingBag, Tag } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';
import type { CartItem } from '../App';
import { BottomSpacer } from './ui/bottom-spacer';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  onRemoveItem: (productId: string, size: string, color: string) => void;
  onProceedToCheckout: () => void;
  onContinueShopping?: () => void;
}

export function Cart({ items, onUpdateQuantity, onRemoveItem, onProceedToCheckout, onContinueShopping }: CartProps) {
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null);

  // Calculate order totals with proper South African pricing
  const productsTotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0); // VAT-inclusive total
  const discount = appliedDiscount?.amount || 0;
  
  // Calculate VAT (15%) - extract VAT from VAT-inclusive price
  const vatAmount = (productsTotal * 15) / 115; // Extract 15% VAT from total
  const subtotal = productsTotal - vatAmount; // VAT-exclusive amount
  
  // Shipping calculation: FREE for orders ≥ R3500 subtotal, R110 otherwise
  const shippingCost = subtotal >= 3500 ? 0 : 110;
  const shipping = shippingCost;
  
  // Final total: products total (VAT-inclusive) + shipping
  const total = productsTotal - discount + shipping;

  const applyDiscount = () => {
    const discountCodes = {
      'WELCOME10': 10,
      'SAVE20': 20,
      'MEMBER15': 15,
      'FREESHIP': 9.99
    };

    const code = discountCode.toUpperCase();
    if (discountCodes[code as keyof typeof discountCodes]) {
      setAppliedDiscount({
        code,
        amount: discountCodes[code as keyof typeof discountCodes]
      });
      toast.success(`Discount code ${code} applied!`);
    } else {
      toast.error('Invalid discount code');
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-6 py-12 pb-24">
        <div className="text-center max-w-md mx-auto">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Looks like you haven't added anything to your cart yet.
          </p>
          <Button onClick={onContinueShopping || (() => window.history.back())}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-6 pb-24">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart ({items.length} items)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={`${item.productId}-${item.size}-${item.color}`}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <ImageWithFallback
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-24 h-24 object-cover rounded-lg"
                    loading="eager"
                  />
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{item.product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Size: {item.size} • Color: {item.color}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveItem(item.productId, item.size, item.color)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onUpdateQuantity(item.productId, item.size, item.color, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onUpdateQuantity(item.productId, item.size, item.color, item.quantity + 1)}
                          disabled={item.quantity >= 10}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="text-right">
                        <span className="font-semibold">
                          R{(item.product.price * item.quantity).toFixed(2)}
                        </span>
                        {item.product.originalPrice && (
                          <p className="text-xs text-muted-foreground line-through">
                            R{(item.product.originalPrice * item.quantity).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Discount Code */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Discount Code</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter code"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={applyDiscount}>
                    <Tag className="h-4 w-4" />
                  </Button>
                </div>
                {appliedDiscount && (
                  <div className="flex items-center justify-between text-sm text-green-600">
                    <span>Code: {appliedDiscount.code}</span>
                    <span>-R{appliedDiscount.amount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Price Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>R{subtotal.toFixed(2)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-R{discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      `R${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Tax (15% VAT)</span>
                  <span>R{vatAmount.toFixed(2)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>R{total.toFixed(2)}</span>
              </div>

              {subtotal < 3500 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-600">
                    Add R{(3500 - subtotal).toFixed(2)} more for FREE shipping!
                  </p>
                </div>
              )}

              <Button className="w-full" size="lg" onClick={onProceedToCheckout}>
                Proceed to Checkout
              </Button>

              <div className="text-center">
                <Button variant="link" onClick={onContinueShopping || (() => window.history.back())}>
                  Continue Shopping
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <BottomSpacer />
    </div>
  );
}
