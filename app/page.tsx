import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from 'next/image';
import { TestTubeDiagonal, MousePointer2, Gauge, BookOpen, ActivitySquare, FlaskConical, SigmaSquare } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-20 md:py-32">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-condensed font-bold mb-6 max-w-[32rem] mx-auto">
            Precision Microfluidics, Simplified.
          </h1>
          <p className="text-lg md:text-xl font-body mb-8 max-w-2xl mx-auto">
            Explore our innovative modular components or design your custom microfluidic circuits with ease.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button asChild size="lg" className="bg-[#F5F7FA] text-primary hover:bg-[#E1E4E8] dark:bg-primary-foreground dark:text-primary dark:hover:bg-primary-foreground/90">
              <Link href="/canvas">Start Designing</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground focus-visible:ring-offset-primary-foreground">
              <Link href="/products">Browse Components</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-condensed font-bold text-center mb-12 text-primary">
            Why Choose Us?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 - Standardized Glass Components */}
            <Card className="bg-card text-center shadow-lg hover:shadow-xl transition-transform duration-200 ease-in-out hover:-translate-y-1">
              <CardHeader className="flex flex-col items-center">
                <TestTubeDiagonal size={48} className="mb-4 text-primary" />
                <CardTitle className="text-xl font-condensed font-semibold mb-3 text-primary text-center">Standardized Glass Components</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-body text-muted-foreground">
                  Glass-based chips & holders engineered to a universal standard for plug-and-play microfluidics.
                </p>
              </CardContent>
            </Card>
            {/* Feature 2 - Intuitive Designer */}
            <Card className="bg-card text-center shadow-lg hover:shadow-xl transition-transform duration-200 ease-in-out hover:-translate-y-1">
              <CardHeader className="flex flex-col items-center">
                <MousePointer2 size={48} className="mb-4 text-primary" />
                <CardTitle className="text-xl font-condensed font-semibold mb-3 text-primary text-center">Intuitive Web Designer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-body text-muted-foreground">
                  Browser-native design canvas for drag-and-drop prototyping. No login for sandbox use.
                </p>
              </CardContent>
            </Card>
            {/* Feature 3 - Performance & Price */}
            <Card className="bg-card text-center shadow-lg hover:shadow-xl transition-transform duration-200 ease-in-out hover:-translate-y-1">
              <CardHeader className="flex flex-col items-center">
                <Gauge size={48} className="mb-4 text-primary" />
                <CardTitle className="text-xl font-condensed font-semibold mb-3 text-primary text-center">Performance at Polymer Price</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-body text-muted-foreground">
                  Superior thermal, pressure, and optical performance of glass, at competitive price points.
                </p>
              </CardContent>
            </Card>
            {/* Feature 4 - Open Standard */}
            <Card className="bg-card text-center shadow-lg hover:shadow-xl transition-transform duration-200 ease-in-out hover:-translate-y-1">
              <CardHeader className="flex flex-col items-center">
                <BookOpen size={48} className="mb-4 text-primary" />
                <CardTitle className="text-xl font-condensed font-semibold mb-3 text-primary text-center">Open Standard & Ecosystem</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-body text-muted-foreground">
                  Free documentation and APIs, enabling community contributions and platform growth.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Use-Case Tiles Section */}
      <section className="py-16 md:py-24 bg-light-grey-1 dark:bg-background">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-condensed font-bold text-center mb-12 text-primary">
            Tailored for Your Application
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Diagnostics Tile */}
            <Link href="/library?use_case=diagnostics" className="block group">
              <Card className="bg-card text-primary shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out hover:border-primary border-2 border-transparent group-hover:scale-105">
                <CardHeader className="flex flex-col items-center pt-8">
                  <ActivitySquare size={48} className="mb-4 text-primary" />
                  <CardTitle className="text-2xl font-condensed font-semibold text-primary text-center">Diagnostics</CardTitle>
                </CardHeader>
                <CardContent className="text-center pb-8">
                  <p className="font-body text-muted-foreground">
                    Components optimized for diagnostic assays and point-of-care devices.
                  </p>
                  <Button variant="link" className="mt-4 text-primary group-hover:underline">
                    Explore Diagnostic Solutions <span aria-hidden="true" className="ml-1 group-hover:translate-x-1 transition-transform duration-200 ease-in-out">→</span>
                  </Button>
                </CardContent>
              </Card>
            </Link>

            {/* Drug Discovery Tile */}
            <Link href="/library?use_case=drug-discovery" className="block group">
              <Card className="bg-card text-primary shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out hover:border-primary border-2 border-transparent group-hover:scale-105">
                <CardHeader className="flex flex-col items-center pt-8">
                  <FlaskConical size={48} className="mb-4 text-primary" />
                  <CardTitle className="text-2xl font-condensed font-semibold text-primary text-center">Drug Discovery</CardTitle>
                </CardHeader>
                <CardContent className="text-center pb-8">
                  <p className="font-body text-muted-foreground">
                    High-precision tools for screening, synthesis, and analysis in drug development.
                  </p>
                  <Button variant="link" className="mt-4 text-primary group-hover:underline">
                    Discover Research Tools <span aria-hidden="true" className="ml-1 group-hover:translate-x-1 transition-transform duration-200 ease-in-out">→</span>
                  </Button>
                </CardContent>
              </Card>
            </Link>

            {/* Lab Automation Tile */}
            <Link href="/library?use_case=lab-automation" className="block group">
              <Card className="bg-card text-primary shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out hover:border-primary border-2 border-transparent group-hover:scale-105">
                <CardHeader className="flex flex-col items-center pt-8">
                  <SigmaSquare size={48} className="mb-4 text-primary" />
                  <CardTitle className="text-2xl font-condensed font-semibold text-primary text-center">Lab Automation</CardTitle>
                </CardHeader>
                <CardContent className="text-center pb-8">
                  <p className="font-body text-muted-foreground">
                    Modular components to streamline and automate complex laboratory workflows.
                  </p>
                  <Button variant="link" className="mt-4 text-primary group-hover:underline">
                    Automate Your Experiments <span aria-hidden="true" className="ml-1 group-hover:translate-x-1 transition-transform duration-200 ease-in-out">→</span>
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Product Categories Preview Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-condensed font-bold text-center mb-12 text-primary">
            Explore Our Product Lines
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Category 1 - Pumps & Flow Control */}
            <Card className="text-center shadow-md bg-white hover:shadow-xl transition-transform duration-200 ease-in-out hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="text-lg font-condensed font-semibold mb-2 text-primary">Pumps & Flow Control</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-32 rounded-md mb-4 overflow-hidden">
                  <Image
                    src="/images/product-placeholder.webp"
                    alt="Pumps & Flow Control Category"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="bg-gray-200 object-cover"
                    loading="lazy"
                  />
                </div>
                <Button asChild variant="link" className="mt-4 text-primary hover:text-primary/80">
                  <Link href="/products/pumps">View Products</Link>
                </Button>
              </CardContent>
            </Card>
            {/* Category 2 - Mixers & Reactors */}
            <Card className="text-center shadow-md bg-white hover:shadow-xl transition-transform duration-200 ease-in-out hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="text-lg font-condensed font-semibold mb-2 text-primary">Mixers & Reactors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-32 rounded-md mb-4 overflow-hidden">
                  <Image
                    src="/images/product-placeholder.webp"
                    alt="Mixers & Reactors Category"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="bg-gray-200 object-cover"
                    loading="lazy"
                  />
                </div>
                <Button asChild variant="link" className="mt-4 text-primary hover:text-primary/80">
                  <Link href="/products/mixers">View Products</Link>
                </Button>
              </CardContent>
            </Card>
            {/* Category 3 - Microfluidic Chips */}
            <Card className="text-center shadow-md bg-white hover:shadow-xl transition-transform duration-200 ease-in-out hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="text-lg font-condensed font-semibold mb-2 text-primary">Microfluidic Chips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-32 rounded-md mb-4 overflow-hidden">
                  <Image
                    src="/images/product-placeholder.webp"
                    alt="Microfluidic Chips Category"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="bg-gray-200 object-cover"
                    loading="lazy"
                  />
                </div>
                <Button asChild variant="link" className="mt-4 text-primary hover:text-primary/80">
                  <Link href="/products/chips">View Products</Link>
                </Button>
              </CardContent>
            </Card>
            {/* Category 4 - Holders & Accessories */}
            <Card className="text-center shadow-md bg-white hover:shadow-xl transition-transform duration-200 ease-in-out hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="text-lg font-condensed font-semibold mb-2 text-primary">Holders & Accessories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-32 rounded-md mb-4 overflow-hidden">
                  <Image
                    src="/images/product-placeholder.webp"
                    alt="Holders & Accessories Category"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="bg-gray-200 object-cover"
                    loading="lazy"
                  />
                </div>
                <Button asChild variant="link" className="mt-4 text-primary hover:text-primary/80">
                  <Link href="/products/accessories">View Products</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action (Optional secondary) */}
      {/* Consider adding another CTA if appropriate */}
    </div>
  );
}
