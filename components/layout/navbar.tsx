import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { useQuoteStore } from '@/store/quoteStore';
// Assuming you will have a CartIcon component or similar
// import CartIcon from '@/components/ui/cart-icon';

const Navbar = () => {
  const quoteCount = useQuoteStore((state) => state.getItemCount());

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Image
            src="/logo.png"
            alt="Microfluidics Company Logo"
            width={200} // Adjust width as needed, maintain aspect ratio
            height={38} // Adjust height based on the actual aspect ratio of your SVG
            className="h-auto" // Ensure responsive height
          />
        </Link>
        <nav className="hidden flex-1 items-center justify-end space-x-6 text-sm font-medium md:flex">
          <Link href="/products" className="text-foreground/60 transition-colors hover:text-foreground/80">
            Products
          </Link>
          <Link href="/canvas" className="text-foreground/60 transition-colors hover:text-foreground/80">
            Canvas
          </Link>
          <Link href="/library" className="text-foreground/60 transition-colors hover:text-foreground/80">
            Library
          </Link>
          <Link href="/standards" className="text-foreground/60 transition-colors hover:text-foreground/80">
            Standards
          </Link>
          <Button variant="ghost" size="icon" asChild className="relative">
            <Link href="/quote">
              <FileText className="h-5 w-5" />
              <span className="sr-only">Quote</span>
              {quoteCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#B91C1C] text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center font-bold">
                  {quoteCount}
                </span>
              )}
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cart">
              {/* <CartIcon className="h-5 w-5" /> Replace with your actual cart icon */}
              <span className="sr-only">Cart</span>
              {/* Placeholder for Cart Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            </Link>
          </Button>
        </nav>
        {/* Mobile Menu Button (optional, can be added later) */}
        {/* <div className="md:hidden">
          <Button variant="ghost" size="icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="12" y2="12"></line><line x1="3" x2="21" y1="6" y2="6"></line><line x1="3" x2="21" y1="18" y2="18"></line></svg>
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div> */}
      </div>
    </header>
  );
};

export default Navbar; 