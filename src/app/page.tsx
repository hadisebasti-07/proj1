'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  Briefcase,
  Search,
  Settings,
  Palette,
  Camera,
  Heart,
  Code,
  GraduationCap,
  Wrench,
  CookingPot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ServiceCard } from '@/components/service-card';
import { categories, services } from '@/lib/data';
import type { Service } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const ICONS: { [key: string]: React.ElementType } = {
  Wrench,
  CookingPot,
  Code,
  GraduationCap,
  Briefcase,
  Settings,
  Palette,
  Camera,
  Default: Briefcase,
};

export default function HomePage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    'All'
  );
  const [filteredServices, setFilteredServices] = React.useState<Service[]>(services);

  React.useEffect(() => {
    let newFilteredServices = services.filter((service) =>
      service.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedCategory && selectedCategory !== 'All') {
      newFilteredServices = newFilteredServices.filter(
        (service) => service.category === selectedCategory
      );
    }

    setFilteredServices(newFilteredServices);
  }, [searchTerm, selectedCategory]);
  
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-services');

  return (
    <div className="flex flex-col gap-8 md:gap-12">
      <section className="relative w-full h-[400px] md:h-[500px] flex items-center justify-center text-center text-white">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            data-ai-hint={heroImage.imageHint}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-primary/60" />
        <div className="relative z-10 flex flex-col items-center gap-4 px-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
            Find Your Perfect Service
          </h1>
          <p className="max-w-xl text-lg md:text-xl text-primary-foreground/90">
            From home repairs to creative design, connect with trusted
            professionals for any job.
          </p>
          <div className="mt-4 flex w-full max-w-lg items-center space-x-2 rounded-full bg-white p-2 shadow-lg">
            <Search className="h-6 w-6 text-muted-foreground ml-2" />
            <Input
              type="text"
              placeholder="What service are you looking for?"
              className="border-none bg-transparent text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button
              type="submit"
              size="lg"
              className="rounded-full bg-accent hover:bg-accent/90"
            >
              Search
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center">
            Browse Popular Categories
          </h2>
          <div className="flex flex-wrap justify-center gap-2 md:gap-4">
            {categories.map((category) => {
              const Icon = ICONS[category.icon] || ICONS.Default;
              return (
                <Button
                  key={category.id}
                  variant={
                    selectedCategory === category.name ? 'default' : 'secondary'
                  }
                  onClick={() => setSelectedCategory(category.name)}
                  className="rounded-full transition-all duration-300"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-bold">
            Services For You
          </h2>
          <Button variant="link" className="text-primary">
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        {filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
           <div className="text-center py-16 text-muted-foreground">
             <p className="text-lg">No services found matching your criteria.</p>
             <p>Try adjusting your search or filters.</p>
           </div>
        )}
      </section>
    </div>
  );
}
