"use client"

import Link from "next/link";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FlaskConical } from "lucide-react";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

export default function Footer() {
  return (
    <footer className="w-full border-t">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
        className="container grid gap-8 px-4 py-10 md:px-6 lg:grid-cols-4"
      >
        <div className="space-y-4">
          <Link href="/" className="flex items-center space-x-3">
            <motion.div
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="h-10 w-10 rounded-3xl bg-primary flex items-center justify-center"
            >
              <FlaskConical className="h-5 w-5 text-primary-foreground" />
            </motion.div>
            <span className="font-bold text-xl">Microfluidics</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Revolutionizing microfluidics with affordable glass chips and a modular ecosystem that accelerates scientific discovery.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-3">
          <div>
            <h3 className="text-lg font-medium">Products</h3>
            <nav className="mt-4 flex flex-col space-y-2 text-sm">
              <Link href="/products" className="text-muted-foreground hover:text-foreground">
                Microchip Holders
              </Link>
              <Link href="/products" className="text-muted-foreground hover:text-foreground">
                Glass Chips
              </Link>
              <Link href="/products" className="text-muted-foreground hover:text-foreground">
                Pumps & Flow Control
              </Link>
              <Link href="/products" className="text-muted-foreground hover:text-foreground">
                Accessories
              </Link>
            </nav>
          </div>
          <div>
            <h3 className="text-lg font-medium">Resources</h3>
            <nav className="mt-4 flex flex-col space-y-2 text-sm">
              <Link href="/canvas" className="text-muted-foreground hover:text-foreground">
                Design Canvas
              </Link>
              <Link href="/library" className="text-muted-foreground hover:text-foreground">
                Component Library
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                Documentation
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                Tutorials
              </Link>
            </nav>
          </div>
          <div>
            <h3 className="text-lg font-medium">Company</h3>
            <nav className="mt-4 flex flex-col space-y-2 text-sm">
              <Link href="#about" className="text-muted-foreground hover:text-foreground">
                About Us
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                Blog
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                Careers
              </Link>
              <Link href="#contact" className="text-muted-foreground hover:text-foreground">
                Contact
              </Link>
            </nav>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Stay Updated</h3>
          <p className="text-sm text-muted-foreground">
            Subscribe to our newsletter for the latest product updates and industry news.
          </p>
          <form className="flex space-x-2">
            <Input type="email" placeholder="Enter your email" className="rounded-3xl" />
            <Button type="submit" className="rounded-3xl">
              Subscribe
            </Button>
          </form>
        </div>
      </motion.div>
      <div className="border-t">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 md:h-16 md:flex-row md:py-0">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Microfluidics. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-xs text-muted-foreground hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="#" className="text-xs text-muted-foreground hover:text-foreground">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
} 