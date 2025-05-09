"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function OrderConfirmationPage() {
  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <div className="flex flex-col items-center">
        <CheckCircle className="w-16 h-16 text-green-500 mb-6" />
        <h1 className="text-3xl font-bold mb-4">Thank You for Your Order!</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Your order has been placed successfully (simulated). We'll (not really) send you an email confirmation shortly.
        </p>
        <Link href="/products" legacyBehavior>
          <Button size="lg">Continue Shopping</Button>
        </Link>
      </div>
    </div>
  );
} 