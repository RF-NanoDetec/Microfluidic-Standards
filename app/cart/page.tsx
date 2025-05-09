"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useCartStore, CartItem } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // For quantity input
import { Trash2, Plus, Minus } from 'lucide-react'; // Icons
import { Separator } from '@/components/ui/separator'; // For visual separation
import { toast } from 'sonner';

// Function to format price (can be moved to utils)
const formatPrice = (price: number) => {
  if (!Number.isFinite(price)) {
    console.error("formatPrice called with non-finite number:", price);
    return 'N/A'; // Or handle as an error, e.g., throw new Error("Invalid price");
  }
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
};

export default function CartPage() {
  const {
    items,
    removeFromCart,
    updateItemQuantity,
    clearCart,
    getItemCount,
    getCartTotal,
  } = useCartStore();

  const handleQuantityChange = (productId: string, rawNewQuantity: number) => {
    const currentItem = items.find(i => i.id === productId);

    if (isNaN(rawNewQuantity)) {
      if (currentItem) {
        // If input becomes NaN (e.g., user types 'abc' or deletes content),
        // we can choose to revert to the current quantity in cart.
        // The input field itself will re-sync on re-render as its value is item.quantityInCart.
        // Alternatively, one could set it to 1, or remove the item if preferred.
        // For now, let's revert to prevent NaN issues and inform the user.
        updateItemQuantity(productId, currentItem.quantityInCart);
        toast.warning(`Invalid quantity entered for ${currentItem.name}. Kept current quantity.`);
      } else {
        // This case should ideally not be reached if productId is valid and item is in cart
        toast.error("Error updating quantity: Invalid input and item not found.");
      }
      return;
    }

    // Ensure quantity is at least 1. If user enters 0 or negative, it becomes 1.
    const newQuantity = Math.max(1, rawNewQuantity);

    if (currentItem) {
      if (newQuantity !== currentItem.quantityInCart) {
        updateItemQuantity(productId, newQuantity);
        toast.info(`Quantity updated for ${currentItem.name}.`);
      }
      // If quantity is the same, no update or toast needed unless specific feedback is desired.
    } else {
      // Fallback if item somehow not found, though productId implies it exists
      // This part of the logic might be unreachable if currentItem is always found for a valid productId
      updateItemQuantity(productId, newQuantity);
      toast.info(`Quantity updated for item ID: ${productId}.`);
    }
  };

  const handleRemoveItem = (productId: string, productName: string) => {
    removeFromCart(productId);
    toast.error(`${productName} removed from cart.`);
  };

  const handleClearCart = () => {
    clearCart();
    toast.warning("Cart has been cleared.");
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-6">Your Shopping Cart</h1>
        <p className="text-xl text-muted-foreground mb-6">Your cart is currently empty.</p>
        <Button size="lg" asChild>
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items Section */}
        <div className="lg:col-span-2 space-y-6">
          {items.map((item: CartItem) => (
            <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg shadow-sm">
              <div className="relative w-20 h-20 aspect-square rounded overflow-hidden">
                <Image
                  src={item.imageUrl || '/images/product-placeholder.webp'}
                  alt={item.name}
                  layout="fill"
                  objectFit="contain"
                />
              </div>
              <div className="flex-grow">
                <Link href={`/products/${item.id}`} className="font-semibold text-lg hover:underline">
                  {item.name}
                </Link>
                <p className="text-sm text-muted-foreground">{formatPrice(item.price)} each</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(item.id, item.quantityInCart - 1)}
                  disabled={item.quantityInCart <= 1} // Disable if quantity is 1 to prevent going to 0 here
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={item.quantityInCart}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQuantityChange(item.id, parseInt(e.target.value, 10))}
                  className="w-16 text-center"
                  min="1" // min attribute is for browser validation, but JS logic handles robustly
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(item.id, item.quantityInCart + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="font-semibold w-24 text-right">
                {formatPrice(item.price * item.quantityInCart)}
              </p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveItem(item.id, item.name)}
                className="text-destructive hover:text-destructive-foreground hover:bg-destructive/90"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          ))}
        </div>

        {/* Order Summary Section */}
        <div className="lg:col-span-1 p-6 border rounded-lg shadow-sm h-fit">
          <h2 className="text-2xl font-semibold mb-6">Order Summary</h2>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span>Subtotal ({getItemCount()} items)</span>
              <span>{formatPrice(getCartTotal())}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="text-muted-foreground">Calculated at checkout</span>
            </div>
            {/* Add discounts/taxes here if needed later */}
            <Separator />
            <div className="flex justify-between font-bold text-xl">
              <span>Total</span>
              <span>{formatPrice(getCartTotal())}</span>
            </div>
          </div>
          <Button size="lg" className="w-full mb-3">
            Proceed to Checkout
          </Button>
          <Button variant="outline" className="w-full" onClick={handleClearCart}>
            Clear Cart
          </Button>
        </div>
      </div>
    </div>
  );
} 