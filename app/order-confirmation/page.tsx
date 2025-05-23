"use client";

import { useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';

export default function OrderConfirmationPage() {
  const { clearCart } = useCartStore();

  useEffect(() => {
    // We'll clear the cart when this page loads, assuming the order was successful
    // In a real app, you&apos;d want to clear cart only after confirming payment success
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-muted/20 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center shadow-lg">
            <CardHeader className="space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold text-foreground mb-2">
                  Order Confirmed!
                </CardTitle>
                <p className="text-lg text-muted-foreground">
                  Thank you for your order. We&apos;ll send you a confirmation email shortly.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-6">
                <div className="flex items-center justify-center mb-4">
                  <Package className="w-6 h-6 text-primary mr-2" />
                  <h3 className="text-lg font-semibold">What&apos;s Next?</h3>
                </div>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>• You&apos;ll receive an order confirmation email within 5 minutes</p>
                  <p>• We&apos;ll notify you when your items are ready to ship</p>
                  <p>• Estimated delivery: 3-5 business days</p>
                  <p>• Track your order using the link in your confirmation email</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/products">
                    Continue Shopping
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full sm:w-auto">
                  <Link href="/">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                  </Link>
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground pt-4 border-t">
                <p>Questions about your order? Contact us at <span className="font-medium">orders@example.com</span></p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 