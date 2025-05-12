/**
 * Represents the footer of the website.
 * It typically contains copyright information and supplementary links.
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-gray-50 border-t border-gray-200 flex-shrink-0">
      <div className="container mx-auto px-6 py-4 text-center text-gray-600 text-sm">
        <p>&copy; {currentYear} Microfluidics Co. All rights reserved.</p>
        {/* Future: Links to Terms of Service, Privacy Policy, etc. */}
      </div>
    </footer>
  );
};

export default Footer; 