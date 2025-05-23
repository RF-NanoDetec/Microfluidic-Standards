import LibraryClientContent from './components/LibraryClientContent';
import { PALETTE_ITEMS } from '@/lib/microfluidic-designer/types';

interface LibraryPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-condensed font-bold text-primary mb-8">
          Component Library
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Browse our comprehensive collection of microfluidic components for your design projects.
        </p>
        
        <LibraryClientContent
          items={PALETTE_ITEMS}
          searchParams={searchParams}
        />
      </div>
    </div>
  );
}