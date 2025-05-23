"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useQuoteStore } from '@/store/quoteStore';
import { toast } from 'sonner';

const quoteFormSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  projectDescription: z.string().min(10, 'Please provide a detailed project description (minimum 10 characters)'),
  timeline: z.string().min(1, 'Timeline is required'),
  budget: z.string().optional(),
  additionalRequirements: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteFormSchema>;

interface CustomRequirement {
  id: string;
  description: string;
}

export default function QuotePage() {
  const {
    items: quoteItems,
    removeFromQuote,
    updateItemQuantity,
    updateItemNotes,
    clearQuote,
    getItemCount,
  } = useQuoteStore();

  const form = useForm<z.infer<typeof quoteFormSchema>>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      projectDescription: "",
      timeline: "",
      budget: "",
      additionalRequirements: "",
    },
  });

  function onSubmit(values: z.infer<typeof quoteFormSchema>) {
    const fullQuoteRequest = {
      contactDetails: values,
      requestedItems: quoteItems,
    };
    // In a real implementation, this would send `fullQuoteRequest` to an API endpoint
    console.log("Full Quote Request:", fullQuoteRequest);
    toast.success("Quote request submitted successfully", {
      description: "We'll be in touch shortly with details for your project and selected items.",
    });
    form.reset();
    // clearQuote(); // Optionally clear quote items after submission
  }

  const handleQuantityChange = (itemId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity >= 1) {
      updateItemQuantity(itemId, newQuantity);
    } else if (newQuantity === 0) {
      // Optionally confirm before removing or just remove
      // For simplicity, remove if quantity becomes 0
      removeFromQuote(itemId);
    }
    // If newQuantity < 0, it's handled by updateItemQuantity which might remove or clamp
  };

  const handleDirectQuantityInput = (itemId: string, value: string) => {
    const newQuantity = parseInt(value, 10);
    if (isNaN(newQuantity)) {
      // If input is not a number (e.g., empty or invalid chars), do nothing or revert
      // For now, let's allow it to be empty, and handle validation on blur or submit if needed
      // Or, find the item and re-set to its current quantity if invalid input
      return; 
    }
    if (newQuantity >= 1) {
      updateItemQuantity(itemId, newQuantity);
    } else {
      // If user types 0 or less, consider removing or setting to 1
      // updateItemQuantity in the store handles quantity < 1 by removing the item.
      updateItemQuantity(itemId, newQuantity); 
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-condensed font-bold text-primary mb-8">
          Request a Quote
        </h1>

        {/* Section for Items in Quote */}
        {quoteItems.length > 0 && (
          <Card className="mb-8 bg-card shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-condensed font-semibold text-primary">Items for Quote ({getItemCount()})</CardTitle>
                <Button variant="outline" size="sm" onClick={clearQuote} className="text-destructive hover:text-destructive-foreground hover:bg-destructive/90">
                  Clear All Items
                </Button>
              </div>
              <CardDescription>Review and modify items you want to include in your quote request.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {quoteItems.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg">
                  {(
                    item.imageUrl || true // Always render the image block, fallback if missing
                  ) && (
                    <div className="relative w-20 h-20 aspect-square rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={item.imageUrl || '/images/productplaceholder.png'}
                        alt={item.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-contain"
                      />
                    </div>
                  )}
                  <div className="flex-grow">
                    <h3 className="font-semibold text-md">{item.name}</h3>
                    {item.attributes && (
                        <div className="text-xs text-muted-foreground">
                        {Object.entries(item.attributes).map(([key, value]) => (
                            <span key={key} className="mr-2">{`${key}: ${value}`}</span>
                        ))}
                        </div>
                    )}
                    <Textarea 
                        placeholder="Notes for this item (e.g., specific requirements, customization)"
                        value={item.notes || ''}
                        onChange={(e) => updateItemNotes(item.id, e.target.value)}
                        className="mt-2 text-sm h-16"
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 mt-2 sm:mt-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                      disabled={item.quantity <= 0} // Technically store removes at 0
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity.toString()} // Controlled component needs string
                      onChange={(e) => handleDirectQuantityInput(item.id, e.target.value)}
                      className="w-16 text-center h-9"
                      min="0" // Allow 0 for removal intention via input, store handles logic
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFromQuote(item.id)}
                    className="text-destructive hover:text-destructive-foreground hover:bg-destructive/90 flex-shrink-0"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        
        {quoteItems.length === 0 && (
            <Card className="mb-8 bg-card shadow-sm border-dashed border-2">
                <CardContent className="p-6 text-center">
                    <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-condensed font-semibold text-primary mb-2">Your Quote List is Empty</h3>
                    <p className="text-muted-foreground mb-4">Add products from our catalog or library to get a specific quote.</p>
                    <div className="space-x-2">
                        <Button asChild><Link href="/products">Browse Products</Link></Button>
                        <Button variant="outline" asChild><Link href="/library">View Component Library</Link></Button>
                    </div>                    
                </CardContent>
            </Card>
        )}

        <Separator className="my-8" />

        {/* Existing Form for Project Information */}
        <Card className="bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-condensed font-semibold text-primary">Your Contact & Project Information</CardTitle>
            <CardDescription>Please provide your details and tell us about your overall project needs.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* ... Name and Organization fields ... */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Dr. Jane Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name</FormLabel>
                        <FormControl>
                          <Input placeholder="University or Company" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* ... Email and Phone fields ... */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* ... ProjectDescription field ... */}
                <FormField
                  control={form.control}
                  name="projectDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please describe your microfluidic application, key requirements, and any specific components you are interested in (if not added above)."
                          rows={5}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Include details about flow rates, pressures, fluid types, and other relevant specifications.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ... Timeline field ... */}
                <FormField
                  control={form.control}
                  name="timeline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Timeline</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 3-6 months" {...field} />
                      </FormControl>
                      <FormDescription>
                        Estimate the duration of your project.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ... Budget field ... */}
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Budget</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., $10,000 - $50,000" {...field} />
                      </FormControl>
                      <FormDescription>
                        Estimate the total cost of your project.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ... AdditionalRequirements field ... */}
                <FormField
                  control={form.control}
                  name="additionalRequirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Requirements</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please describe any additional requirements or special considerations for your project."
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Include any specific requirements or considerations for your project.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full md:w-auto" 
                  disabled={form.formState.isSubmitting || (quoteItems.length === 0 && !form.getValues("projectDescription"))}
                  title={quoteItems.length === 0 && !form.getValues("projectDescription") ? "Please add items to your quote or describe your project." : "Submit your quote request"}
                >
                  {form.formState.isSubmitting ? "Submitting..." : "Submit Quote Request"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="border-t px-6 py-4 bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Need help or have questions before submitting? Contact us at <a href="mailto:quotes@microfluidics-standard.com" className="text-primary hover:underline">quotes@microfluidics-standard.com</a>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}