import Link from 'next/link';

/**
 * Represents the footer of the website.
 * It typically contains copyright information and supplementary links.
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-light-grey-2 border-t border-light-grey-1 flex-shrink-0">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
          <p className="text-mid-grey text-sm mb-4 md:mb-0">
            &copy; {currentYear} Microfluidic Standards. All rights reserved.
          </p>
          <nav className="flex space-x-4 md:space-x-6">
            <Link href="#privacy" legacyBehavior={false} className="text-mid-grey hover:text-primary hover:underline text-sm">
              Privacy Policy
            </Link>
            <Link href="#terms" legacyBehavior={false} className="text-mid-grey hover:text-primary hover:underline text-sm">
              Terms of Service
            </Link>
            <Link href="#contact" legacyBehavior={false} className="text-mid-grey hover:text-primary hover:underline text-sm">
              Contact Us
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 