"use client"; // Mark as a Client Component

import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnyProduct } from '@/lib/types'; // Assuming your types are here
import { Badge } from '@/components/ui/badge'; // We'll use Badge for category
import { PlusSquare, ShoppingCart } from 'lucide-react'; // Import new icons
import { toast } from 'sonner'; // Import toast for notifications
import { useCartStore } from '@/store/cartStore'; // Import the cart store

interface ProductCardProps {
  product: AnyProduct;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCartStore(); // Get the addToCart function

  // Function to format price, can be moved to a utils file later
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR', // Assuming EUR, adjust if needed
    }).format(price);
  };

  // Function to truncate description
  const truncateDescription = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, text.lastIndexOf(' ', maxLength)) + '...';
  };

  const handleAddToCart = () => {
    addToCart(product); // Call the actual addToCart function from the store
    toast.success(`${product.name} added to cart!`);
    console.log('Add to Cart clicked for product:', product.id, 'and added to store.'); // Updated log
  };

  return (
    <Card className="w-80 flex flex-col overflow-hidden h-full bg-card hover:shadow-xl transition-transform duration-200 ease-in-out hover:-translate-y-1"> {/* Added w-80, ensuring card bg is consistent and adding hover animation*/}
      <CardHeader className="pb-2">
        <Link href={`/products/${product.id}`} className="block group">
          <div className="relative w-full h-48 mb-4 overflow-hidden rounded-t-lg"> {/* Added overflow-hidden and rounded here */}
            <Image
              src={product.imageUrl && product.imageUrl.trim() !== '' ? product.imageUrl : '/product.png'} // Robust fallback to /product.png
              alt={product.name || 'Microfluidic product'}
              layout="fill"
              objectFit="contain" // Or "cover", depending on desired image behavior
              className="group-hover:scale-105 transition-transform duration-200 ease-in-out" // Removed rounded-t-lg from here, added hover effect
              loading="lazy"
            />
          </div>
          <CardTitle className="text-lg font-semibold text-primary group-hover:text-accent transition-colors">{product.name}</CardTitle> {/* Product name uses text-primary, hover to accent */}
        </Link>
        <CardDescription className="text-sm text-muted-foreground h-12 overflow-hidden mt-1"> {/* Product description uses text-muted-foreground, added mt-1 */}
          {truncateDescription(product.description, 80)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow pt-0"> {/* flex-grow to push footer down */}
        <div className="flex justify-between items-center mb-2">
          <p className="text-lg font-bold text-primary">
            {formatPrice(product.price)}
          </p>
          {/* Badge for category, text color set to muted-foreground */}
          <Badge variant="outline" className="text-muted-foreground border-muted-foreground/50">{product.category}</Badge>
        </div>
        {/* We can add more specific details here later if needed */}
      </CardContent>
      <CardFooter className="pt-0 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full"> {/* Updated for flex layout and gap */}
        <Button 
          onClick={() => console.log('Add to Canvas clicked for product:', product.id)} 
          className="w-full sm:flex-1 sm:min-w-0 sm:px-4 sm:py-2" // Share space, more horizontal padding for sm+
        >
          <PlusSquare className="h-4 w-4 sm:mr-1" /> To Canvas {/* Shortened text, adjusted icon margin for sm+ */}
        </Button>
        <Button 
          variant="ghost" 
          onClick={handleAddToCart} // Use the new handler
          className="w-full sm:flex-1 sm:min-w-0 sm:px-3 sm:py-2" // Share space, tighter horizontal padding for sm+
        >
          <ShoppingCart className="h-4 w-4 sm:mr-1" /> Add to Cart {/* Adjusted icon margin for sm+ */}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard; 