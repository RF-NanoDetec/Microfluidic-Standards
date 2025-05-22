import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShoppingCart, FileText } from 'lucide-react';

/**
 * Represents the header of the website.
 * It includes the site logo and primary navigation links according to the Microfluidic Standards Style Guide.
 */
const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-zinc-950/95 dark:supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          {/* Style Guide: Maintain clear-space equal to cap-height "M" on all sides. 
              Never recolor; use monochrome (Primary Blue) over light backgrounds and reversed white over dark. */}
          <Image
            src="/logo.svg" // Assuming logo.svg is designed to work on light/dark backgrounds or a specific version is chosen.
            alt="Microfluidics Company Logo" // Primary Blue: #003C7E
            width={180} // Adjusted for potential better visual balance, can be fine-tuned
            height={80} // Adjusted to maintain aspect ratio of original viewBox (391.21 x 96.63)
            className="h-auto" // Ensures responsive height. Add filter for dark mode if needed and logo isn't dual-colored.
          />
        </Link>
        <nav className="hidden flex-1 items-center justify-end space-x-1 md:flex md:space-x-2 lg:space-x-4">
          {/* Style Guide: Navbar: right nav: Products · Canvas · Library · Standards · Quote (icon) · Cart (icon) */}
          <Button variant="link" asChild className="text-sm font-medium text-primary hover:text-primary/80 dark:text-slate-50 dark:hover:text-slate-300">
            <Link href="/products">Products</Link>
          </Button>
          <Button variant="link" asChild className="text-sm font-medium text-primary hover:text-primary/80 dark:text-slate-50 dark:hover:text-slate-300">
            <Link href="/canvas">Canvas</Link>
          </Button>
          <Button variant="link" asChild className="text-sm font-medium text-primary hover:text-primary/80 dark:text-slate-50 dark:hover:text-slate-300">
            <Link href="/library">Library</Link>
          </Button>
          <Button variant="link" asChild className="text-sm font-medium text-primary hover:text-primary/80 dark:text-slate-50 dark:hover:text-slate-300">
            <Link href="/standards">Standards</Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="group text-primary hover:text-white dark:text-slate-50 dark:hover:text-primary">
            <Link href="/quote">
              {/* Style Guide: Icons: Line icons (2px stroke) from lucide-react. Use Primary Blue; fill on hover. */}
              <FileText
                className="h-5 w-5 stroke-current group-hover:fill-white/10 dark:group-hover:fill-primary/10"
                strokeWidth={2} // Style guide: 2px stroke
              />
              <span className="sr-only">Quote</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="group text-primary hover:text-white dark:text-slate-50 dark:hover:text-primary">
            <Link href="/cart">
              {/* Style Guide: Icons: Line icons (2px stroke) from lucide-react. Use Primary Blue; fill on hover. */}
              <ShoppingCart
                className="h-5 w-5 stroke-current group-hover:fill-white/10 dark:group-hover:fill-primary/10"
                strokeWidth={2} // Style guide: 2px stroke
              />
              <span className="sr-only">Cart</span>
            </Link>
          </Button>
        </nav>
        {/* Mobile Menu Button (Placeholder - implement if needed) */}
        {/* <div className="md:hidden">
          <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80 dark:text-slate-50 dark:hover:text-slate-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="12" y2="12"></line><line x1="3" x2="21" y1="6" y2="6"></line><line x1="3" x2="21" y1="18" y2="18"></line></svg>
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div> */}
      </div>
    </header>
  );
};

export default Header;