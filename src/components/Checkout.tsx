import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import { ArrowLeft, CreditCard, Gift } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';
import { createOrderFromCart, createGuestOrder } from '../utils/supabase/client';
import { useCart } from '../contexts/CartContext';
import type { CartItem, User } from '../App';
import { BottomSpacer } from './ui/bottom-spacer';

interface CheckoutProps {
  items: CartItem[];
  user: User | null; // Allow null for guest checkout
  onOrderComplete: () => void;
  onBack: () => void;
}

export function Checkout({ items, user, onOrderComplete, onBack }: CheckoutProps) {
  const { isGuestCart } = useCart(); // Access cart context for clearing after order
  const [shippingForm, setShippingForm] = useState({
    firstName: user?.name.split(' ')[0] || '',
    lastName: user?.name.split(' ')[1] || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'South Africa'
  });

  const [paymentMethod, setPaymentMethod] = useState('cash-on-delivery');
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });

  const [createAccount, setCreateAccount] = useState(false); // For guest users
  const [accountForm, setAccountForm] = useState({
    password: '',
    confirmPassword: ''
  });

  const [usePointsDiscount, setUsePointsDiscount] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const pointsDiscount = usePointsDiscount && user ? Math.min(user.points * 0.01, subtotal * 0.2) : 0; // 1 cent per point, max 20% off
  const shipping = subtotal > 100 ? 0 : 9.99;
  const tax = (subtotal - pointsDiscount) * 0.08;
  const total = subtotal - pointsDiscount + shipping + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Validate forms
      if (!shippingForm.address || !shippingForm.city || !shippingForm.state || !shippingForm.zipCode) {
        toast.error('Please fill in all shipping address fields');
        setIsProcessing(false);
        return;
      }

      if (paymentMethod === 'credit-card' && (!paymentForm.cardNumber || !paymentForm.expiryDate || !paymentForm.cvv)) {
        toast.error('Please fill in all payment details');
        setIsProcessing(false);
        return;
      }

      // Validate guest account creation if selected
      if (!user && createAccount) {
        if (!accountForm.password || accountForm.password.length < 6) {
          toast.error('Password must be at least 6 characters long');
          setIsProcessing(false);
          return;
        }
        
        if (accountForm.password !== accountForm.confirmPassword) {
          toast.error('Passwords do not match');
          setIsProcessing(false);
          return;
        }
      }

      // Create shipping address object
      const shippingAddress = {
        firstName: shippingForm.firstName,
        lastName: shippingForm.lastName,
        email: shippingForm.email,
        phone: shippingForm.phone,
        address: shippingForm.address,
        city: shippingForm.city,
        state: shippingForm.state,
        zipCode: shippingForm.zipCode,
        country: shippingForm.country,
        paymentMethod: paymentMethod,
        usePointsDiscount: usePointsDiscount,
        pointsUsed: usePointsDiscount && user ? Math.min(user.points, Math.floor(subtotal * 20)) : 0
      };

      let orderId;

      if (user) {
        // Authenticated user - use existing cart-based order creation
        orderId = await createOrderFromCart(shippingAddress);
      } else {
        // Guest user - create order directly from cart items
        const customerInfo = {
          email: shippingForm.email,
          firstName: shippingForm.firstName,
          lastName: shippingForm.lastName,
          phone: shippingForm.phone
        };

        orderId = await createGuestOrder(
          items, 
          shippingAddress, 
          customerInfo, 
          createAccount, 
          createAccount ? accountForm.password : undefined
        );
      }

      if (!orderId) {
        throw new Error('Failed to create order');
      }

      // Clear cart after successful order
      if (isGuestCart) {
        // Clear guest cart from localStorage
        localStorage.removeItem('rosemama_guest_cart');
      }
      // For authenticated users, the cart will be cleared by the backend

      // Show success message based on payment method
      let successMessage = 'Order placed successfully!';
      
      // Add verification reminder for new accounts
      if (!user && createAccount) {
        successMessage += ' Check your email to verify your account for order tracking.';
      }
      
      if (paymentMethod === 'cash-on-delivery') {
        successMessage = `Order placed successfully! Pay R${total.toFixed(2)} on delivery.`;
        if (!user && createAccount) {
          successMessage += ' Check your email to verify your account.';
        }
      } else if (paymentMethod === 'bank-transfer') {
        successMessage = `Order placed successfully! Please send R${total.toFixed(2)} to our bank account.`;
        if (!user && createAccount) {
          successMessage += ' Check your email to verify your account.';
        }
      } else {
        successMessage = `Order placed successfully! Payment processed via ${paymentMethod}.`;
      }

      toast.success(successMessage);
      onOrderComplete();

    } catch (error) {
      console.error('Order submission failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-6 pb-24 max-w-6xl">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Cart
      </Button>

      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={shippingForm.firstName}
                      onChange={(e) => setShippingForm(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={shippingForm.lastName}
                      onChange={(e) => setShippingForm(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={shippingForm.email}
                      onChange={(e) => setShippingForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={shippingForm.phone}
                      onChange={(e) => setShippingForm(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={shippingForm.address}
                    onChange={(e) => setShippingForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Street address"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={shippingForm.city}
                      onChange={(e) => setShippingForm(prev => ({ ...prev, city: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">Province</Label>
                    <Select
                      value={shippingForm.state}
                      onValueChange={(value: string) => setShippingForm(prev => ({ ...prev, state: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EC">Eastern Cape</SelectItem>
                        <SelectItem value="FS">Free State</SelectItem>
                        <SelectItem value="GP">Gauteng</SelectItem>
                        <SelectItem value="KZN">KwaZulu-Natal</SelectItem>
                        <SelectItem value="LP">Limpopo</SelectItem>
                        <SelectItem value="MP">Mpumalanga</SelectItem>
                        <SelectItem value="NC">Northern Cape</SelectItem>
                        <SelectItem value="NW">North West</SelectItem>
                        <SelectItem value="WC">Western Cape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="zipCode">Postal Code</Label>
                    <Input
                      id="zipCode"
                      value={shippingForm.zipCode}
                      onChange={(e) => setShippingForm(prev => ({ ...prev, zipCode: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Guest Account Creation Option */}
            {!user && (
              <Card>
                <CardHeader>
                  <CardTitle>Account Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="createAccount"
                      checked={createAccount}
                      onCheckedChange={(checked) => setCreateAccount(checked as boolean)}
                    />
                    <Label htmlFor="createAccount" className="text-sm">
                      Create an account to track your orders and earn rewards points
                    </Label>
                  </div>
                  
                  {createAccount && (
                    <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={accountForm.password}
                          onChange={(e) => setAccountForm(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Create a password"
                          required={createAccount}
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={accountForm.confirmPassword}
                          onChange={(e) => setAccountForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirm your password"
                          required={createAccount}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="cash-on-delivery" id="cash-on-delivery" />
                    <Label htmlFor="cash-on-delivery" className="flex items-center gap-2 flex-1 cursor-pointer">
                      <Gift className="h-4 w-4" />
                      Cash on Delivery
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="bank-transfer" id="bank-transfer" />
                    <Label htmlFor="bank-transfer" className="flex items-center gap-2 flex-1 cursor-pointer">
                      <div className="w-4 h-4 bg-green-600 rounded" />
                      Bank Transfer (Manual Payment)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="credit-card" id="credit-card" />
                    <Label htmlFor="credit-card" className="flex items-center gap-2 flex-1 cursor-pointer">
                      <CreditCard className="h-4 w-4" />
                      Credit/Debit Card
                    </Label>
                  </div>
                  {paymentMethod === 'bank-transfer' && (
                    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                      <h4 className="font-medium mb-2 text-sm">Bank Transfer Details:</h4>
                      <div className="text-sm space-y-1">
                        <p><strong>Account Name:</strong> CLARA RANYAMA</p>
                        <p><strong>Bank:</strong> FNB</p>
                        <p><strong>Account Number:</strong> 62804733766</p>
                        <p><strong>Branch Code:</strong> 250655</p>
                        <p className="text-blue-600 mt-2"><strong>Reference:</strong> Dolls send me proof of payment ✌</p>
                      </div>
                    </div>
                  )}
                </RadioGroup>

                {paymentMethod === 'credit-card' && (
                  <div className="space-y-4 mt-4 p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={paymentForm.cardNumber}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, cardNumber: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input
                          id="expiryDate"
                          placeholder="MM/YY"
                          value={paymentForm.expiryDate}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          value={paymentForm.cvv}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, cvv: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cardholderName">Cardholder</Label>
                        <Input
                          id="cardholderName"
                          placeholder="Full name"
                          value={paymentForm.cardholderName}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, cardholderName: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-3">
                          <ImageWithFallback
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded"
                        loading="eager"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.size} • {item.color} • Qty {item.quantity}
                        </p>
                      </div>
                      <span className="text-sm font-medium">
                        R{(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Points Discount */}
                {user && user.points > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="use-points"
                        checked={usePointsDiscount}
                        onCheckedChange={(checked: boolean) => setUsePointsDiscount(checked)}
                      />
                        <Label htmlFor="use-points" className="text-sm">
                        Use {Math.min(user?.points || 0, Math.floor(subtotal * 20))} points (save R{pointsDiscount.toFixed(2)})
                      </Label>
                    </div>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>R{subtotal.toFixed(2)}</span>
                  </div>

                  {pointsDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Points Discount</span>
                      <span>-R{pointsDiscount.toFixed(2)}</span>
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
                    <span>Tax</span>
                    <span>R{tax.toFixed(2)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>R{total.toFixed(2)}</span>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isProcessing}>
                  {isProcessing ? 'Processing...' : `Place Order - R${total.toFixed(2)}`}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  By placing your order, you agree to our Terms & Conditions and Privacy Policy.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
      <BottomSpacer />
    </div>
  );
}
