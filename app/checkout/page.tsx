"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // For structuring form sections

// Function to format price (can be moved to utils)
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getCartTotal, getItemCount, clearCart } = useCartStore();

  useEffect(() => {
    if (items.length === 0) {
      toast.error("Your cart is empty. Redirecting to products page.");
      router.replace('/products'); // Or '/cart' if you prefer
    }
  }, [items, router]);

  const handleSubmitOrder = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // In a real app, you'd collect form data and send it to a backend
    const formData = new FormData(event.currentTarget);
    const shippingAddress = {
      fullName: formData.get('fullName'),
      addressLine1: formData.get('addressLine1'),
      city: formData.get('city'),
      postalCode: formData.get('postalCode'),
      country: formData.get('country'),
      email: formData.get('email'),
      phone: formData.get('phone'),
    };

    console.log("Order Submitted (Simulated):");
    console.log("Items:", items);
    console.log("Total:", formatPrice(getCartTotal()));
    console.log("Shipping Address:", shippingAddress);

    // Simulate order placement
    clearCart();
    toast.success("Order placed successfully! Thank you for your purchase.");
    router.push('/order-confirmation'); // Redirect to a confirmation page (we'll create this next)
  };

  if (items.length === 0) {
    // This will briefly show while useEffect redirects
    return (
        <div className="container mx-auto px-4 py-12 text-center">
            <h1 className="text-2xl font-semibold">Loading Checkout...</h1>
            <p>If your cart is empty, you will be redirected shortly.</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Checkout</h1>
      <form onSubmit={handleSubmitOrder}>
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Shipping & Contact Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipping & Contact Information</CardTitle>
                <CardDescription>Please enter your details for order delivery.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" name="fullName" required />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" name="email" type="email" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="addressLine1">Address Line 1</Label>
                  <Input id="addressLine1" name="addressLine1" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" required />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input id="postalCode" name="postalCode" required />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" name="country" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input id="phone" name="phone" type="tel" />
                </div>
              </CardContent>
            </Card>

            {/* Placeholder for Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
                <CardDescription>Payment processing will be implemented later.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This is a placeholder for payment details. No actual payment will be processed at this time.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Section */}
          <div className="lg:col-span-1 p-6 border rounded-lg shadow-sm h-fit sticky top-8">
            <h2 className="text-2xl font-semibold mb-6">Order Summary</h2>
            <div className="space-y-2 mb-4">
              {items.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantityInCart}</p>
                  </div>
                  <p>{formatPrice(item.price * item.quantityInCart)}</p>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="space-y-2">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({getItemCount()} items)</span>
                    <span>{formatPrice(getCartTotal())}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>Calculated later</span>
                </div>
                <Separator className="my-2"/>
                <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatPrice(getCartTotal())}</span>
                </div>
            </div>
            <Button type="submit" size="lg" className="w-full mt-6">
              Place Order (Simulated)
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
} 