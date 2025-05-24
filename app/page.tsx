"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight,
  Mail,
  MapPin,
  Phone,
  Zap,
  FlaskConical,
  Gem,
  BadgeEuro,
  Minimize2,
  Blocks,
  MousePointerSquareDashed,
  Store,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemFadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <motion.div
      variants={itemFadeIn}
      whileHover={{ y: -4 }}
      className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
    >
      <div className="bg-primary/10 rounded-full p-3 mb-4 inline-flex">
        {icon}
      </div>
      <h3 className="text-lg md:text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
      <div className="mt-4 flex items-center justify-between">
        <Link href="#" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          Learn more
        </Link>
        <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
          <ArrowRight className="h-4 w-4 text-primary" />
        </motion.div>
      </div>
    </motion.div>
  )
}

function MicrofluidicsLandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header Removed - Global header from layout.tsx will be used */}

      {/* Mobile Menu Removed - Global header from layout.tsx will handle mobile navigation */}

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 overflow-hidden">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                className="flex flex-col justify-center space-y-4"
              >
                <div className="space-y-2">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center rounded-3xl bg-muted px-3 py-1 text-sm"
                  >
                    <Zap className="mr-1 h-3 w-3" />
                    Revolutionizing Microfluidics
                  </motion.div>
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none"
                  >
                    Modular Glass Microfluidics at{" "}
                    <span className="text-primary">
                      Polymer Prices
                    </span>
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.4 }}
                    className="max-w-[600px] text-muted-foreground md:text-xl"
                  >
                    Our disruptive platform combines high-performance glass microfluidic chips with a true modular ecosystem, all at a fraction of traditional costs.
                  </motion.p>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.6 }}
                  className="flex flex-col gap-3 sm:flex-row"
                >
                  <Link href="/products" passHref>
                    <Button size="lg" className="rounded-3xl group">
                      Browse Products
                      <motion.span
                        initial={{ x: 0 }}
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </motion.span>
                    </Button>
                  </Link>
                  <Link href="/canvas" passHref>
                    <Button variant="outline" size="lg" className="rounded-3xl">
                      Start Designing
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="flex items-center justify-center"
              >
                <div className="relative h-[350px] w-full md:h-[450px] lg:h-[500px] xl:h-[550px] overflow-hidden rounded-3xl">
                  <Image
                    src="/images/holder_placeholder.png"
                    alt="Microfluidic chip"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Core Differentiators */}
        <section id="differentiators" className="w-full py-12 md:py-24 lg:py-32 bg-muted/20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="container px-4 md:px-6"
          >
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="inline-block rounded-3xl bg-background px-3 py-1 text-sm"
                >
                  Core Differentiators
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl"
                >
                  What Sets Us Apart
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed"
                >
                  Our revolutionary approach to microfluidics is changing the industry
                </motion.p>
              </div>
            </div>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mx-auto grid max-w-5xl items-center gap-6 py-12 md:grid-cols-2 lg:grid-cols-3"
            >
              <FeatureCard
                icon={<Gem strokeWidth={1.5} className="h-6 w-6 text-primary group-hover:text-primary transition-colors" />}
                title="High-Performance Glass, Low Cost"
                description="Retains all glass advantages (chemical/thermal resistance, optical clarity, low autofluorescence) at a fraction of the usual cost."
              />
              <FeatureCard
                icon={<BadgeEuro strokeWidth={1.5} className="h-6 w-6 text-primary group-hover:text-primary transition-colors" />}
                title="Polymer-Level Pricing for Glass"
                description="Glass microfluidic chips priced on par with polymer devices (≈€20–50 each), versus €100+ from incumbents."
              />
              <FeatureCard
                icon={<Minimize2 strokeWidth={1.5} className="h-6 w-6 text-primary group-hover:text-primary transition-colors" />}
                title="Miniaturized for Max Efficiency"
                description="Very small footprint chips clamped in a low-cost, reusable holder that supports high-pressure (≈100 bar), leak-free connections."
              />
              <FeatureCard
                icon={<Blocks strokeWidth={1.5} className="h-6 w-6 text-primary group-hover:text-primary transition-colors" />}
                title="Plug & Play Modular Ecosystem"
                description="A standardized library of interchangeable chips and auxiliary modules, all plug-and-play."
              />
              <FeatureCard
                icon={<MousePointerSquareDashed strokeWidth={1.5} className="h-6 w-6 text-primary group-hover:text-primary transition-colors" />}
                title="Integrated Online Design Platform"
                description="Browser-based drag-and-drop design tool, built-in flow simulation, and one-click ordering—no separate CAD or quoting process."
              />
              <FeatureCard
                icon={<Store strokeWidth={1.5} className="h-6 w-6 text-primary group-hover:text-primary transition-colors" />}
                title="Community-Driven Marketplace"
                description="Open partner program where academics and startups can upload, share, or sell their chip designs, earning royalties."
              />
            </motion.div>
            
          </motion.div>
        </section>

        {/* Products Catalog Preview */}
        <section id="products" className="w-full py-12 md:py-24 lg:py-32">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="container px-4 md:px-6"
          >
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="inline-block rounded-3xl bg-muted px-3 py-1 text-sm"
                >
                  Products
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl"
                >
                  Our Product Catalog
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="mx-auto max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed"
                >
                  Browse our comprehensive range of microfluidic components and accessories
                </motion.p>
              </div>
            </div>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mx-auto grid max-w-7xl gap-6 py-12 md:grid-cols-2 lg:grid-cols-4"
            >
              {[
                { title: "Microchip Holders", image: "/placeholder.svg" },
                { title: "Glass Microfluidic Chips", image: "/placeholder.svg" },
                { title: "Pumps & Flow Control", image: "/placeholder.svg" },
                { title: "Sensors & Detectors", image: "/placeholder.svg" },
                { title: "Tubing & Connectors", image: "/placeholder.svg" },
                { title: "Valves & Mixers", image: "/placeholder.svg" },
                { title: "Culture Chambers", image: "/placeholder.svg" },
                { title: "Specialty Glass Chips", image: "/placeholder.svg" },
              ].map((product, index) => (
                <motion.div
                  key={index}
                  variants={itemFadeIn}
                  whileHover={{ y: -10 }}
                  className="group relative overflow-hidden rounded-3xl border bg-background"
                >
                  <div className="aspect-square overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.title}
                      width={300}
                      height={300}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium">{product.title}</h3>
                    <div className="mt-2 flex items-center justify-between">
                      <Link href="/products" className="text-sm text-primary">
                        View Products
                      </Link>
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            <div className="flex justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/products" passHref>
                  <Button size="lg" className="rounded-3xl group">
                    View Full Catalog
                    <motion.span
                      initial={{ x: 0 }}
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </motion.span>
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Design Canvas Preview */}
        <section id="design" className="w-full py-12 md:py-24 lg:py-32 bg-muted/20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="container px-4 md:px-6"
          >
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-4"
              >
                <div className="inline-block rounded-3xl bg-background px-3 py-1 text-sm">Design Canvas</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Design Your Microfluidic System
                </h2>
                <p className="text-muted-foreground md:text-xl/relaxed">
                  Our interactive drag-and-drop workspace makes it easy to design complex microfluidic systems. Combine components, simulate flows, and order your custom setup with just a few clicks.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <span>Intuitive drag-and-drop interface</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <span>Real-time simulation feedback</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <span>One-click ordering of your design</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <span>Save and share your designs</span>
                  </li>
                </ul>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link href="/canvas" passHref>
                    <Button size="lg" className="rounded-3xl group">
                      Try Design Canvas
                      <motion.span
                        initial={{ x: 0 }}
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </motion.span>
                    </Button>
                  </Link>
                  <Button variant="outline" size="lg" className="rounded-3xl">
                    View Tutorial
                  </Button>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="flex items-center justify-center"
              >
                <div className="relative h-[350px] w-full md:h-[450px] overflow-hidden rounded-3xl border-2 border-muted shadow-xl">
                  <Image
                    src="/placeholder.svg"
                    alt="Design Canvas Interface"
                    fill
                    className="object-cover"
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Library Preview */}
        <section id="library" className="w-full py-12 md:py-24 lg:py-32">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="container px-4 md:px-6"
          >
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="inline-block rounded-3xl bg-muted px-3 py-1 text-sm"
                >
                  Component Library
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl"
                >
                  Comprehensive Component Library
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="mx-auto max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed"
                >
                  Access our extensive inventory of microfluidic components with powerful search and filtering tools
                </motion.p>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mx-auto max-w-7xl mt-12 overflow-hidden rounded-3xl border shadow-lg"
            >
              <div className="bg-muted p-4 flex items-center justify-between border-b">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search components..."
                    className="w-64 rounded-3xl"
                  />
                  <Button variant="outline" size="sm" className="rounded-3xl">
                    Filter
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="rounded-3xl">
                    Sort
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-3xl">
                    View
                  </Button>
                </div>
              </div>
              <div className="p-4 bg-background">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((item) => (
                    <Card key={item} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                          <FlaskConical className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">Mixer Chip MX-{item}00</h3>
                          <p className="text-sm text-muted-foreground">Glass, 2 inputs, 1 output</p>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-between items-center">
                        <span className="font-medium">€{20 + item * 5}</span>
                        <Button variant="outline" size="sm" className="rounded-3xl">
                          Add to Design
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Link href="/library" passHref>
                    <Button variant="link">View all 250+ components</Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* About/Team Section */}
        <section id="about" className="w-full py-12 md:py-24 lg:py-32 bg-muted/20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="container px-4 md:px-6"
          >
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-4"
              >
                <div className="inline-block rounded-3xl bg-background px-3 py-1 text-sm">About Us</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Our Vision</h2>
                <p className="text-muted-foreground md:text-xl/relaxed">
                  We&apos;re revolutionizing microfluidics by making high-performance glass chips accessible to everyone. Our mission is to accelerate scientific discovery and innovation by removing cost barriers and complexity from microfluidic technology.
                </p>
                <p className="text-muted-foreground md:text-xl/relaxed">
                  Our academia-first adoption strategy focuses on rapid validation and publications, building grassroots credibility that will later unlock biotech and diagnostics markets.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button variant="outline" size="lg" className="rounded-3xl">
                    Our Team
                  </Button>
                  <Button variant="outline" size="lg" className="rounded-3xl">
                    Join Us
                  </Button>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="flex items-center justify-center"
              >
                <div className="relative h-[350px] w-full md:h-[450px] overflow-hidden rounded-3xl">
                  <Image
                    src="/PPORTRAIT.jpg"
                    alt="Team member portrait"
                    fill
                    className="object-contain bg-muted"
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="w-full py-12 md:py-24 lg:py-32">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="container grid items-center gap-6 px-4 md:px-6 lg:grid-cols-2"
          >
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <div className="inline-block rounded-3xl bg-muted px-3 py-1 text-sm">Contact</div>
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">Get In Touch</h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Have questions about our products or technology? We&apos;d love to hear from you.
              </p>
              <div className="mt-8 space-y-4">
                <motion.div whileHover={{ x: 5 }} className="flex items-start gap-3">
                  <div className="rounded-3xl bg-muted p-2">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Our Location</h3>
                    <p className="text-sm text-muted-foreground">123 Innovation Street, Tech City, 10001</p>
                  </div>
                </motion.div>
                <motion.div whileHover={{ x: 5 }} className="flex items-start gap-3">
                  <div className="rounded-3xl bg-muted p-2">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Email Us</h3>
                    <p className="text-sm text-muted-foreground">info@microfluidics.com</p>
                  </div>
                </motion.div>
                <motion.div whileHover={{ x: 5 }} className="flex items-start gap-3">
                  <div className="rounded-3xl bg-muted p-2">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Call Us</h3>
                    <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="rounded-3xl border bg-background p-6 shadow-sm"
            >
              <h3 className="text-xl font-bold">Send Us a Message</h3>
              <p className="text-sm text-muted-foreground">
                Fill out the form below and we&apos;ll get back to you shortly.
              </p>
              <form className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="first-name"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      First name
                    </label>
                    <Input id="first-name" placeholder="Enter your first name" className="rounded-3xl" />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="last-name"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Last name
                    </label>
                    <Input id="last-name" placeholder="Enter your last name" className="rounded-3xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Email
                  </label>
                  <Input id="email" type="email" placeholder="Enter your email" className="rounded-3xl" />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="message"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Message
                  </label>
                  <Textarea id="message" placeholder="Enter your message" className="min-h-[120px] rounded-3xl" />
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button type="submit" className="w-full rounded-3xl">
                    Send Message
                  </Button>
                </motion.div>
              </form>
            </motion.div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
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
    </div>
  )
}

export default function LandingPage() {
  return <MicrofluidicsLandingPage />
}
