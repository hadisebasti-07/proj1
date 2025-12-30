// This is a server component now
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Star, MessageSquare, Calendar, Shield } from 'lucide-react';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import * as React from 'react';

import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ReviewSummarizer } from './review-summarizer';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { Service, Review, ProviderProfile } from '@/lib/types';
import { initializeFirebase } from '@/firebase/server-only';

// Helper function to fetch data on the server
async function getService(id: string): Promise<Service | null> {
    const { firestore } = initializeFirebase();
    const serviceRef = doc(firestore, 'services', id);
    const serviceSnap = await getDoc(serviceRef);
    if (!serviceSnap.exists()) {
        return null;
    }
    return { id: serviceSnap.id, ...serviceSnap.data() } as Service;
}

// TODO: Replace with a real review fetching implementation
const MOCK_REVIEWS: Review[] = [
    { id: '1', author: 'John Doe', rating: 5, comment: 'Excellent work, very professional!', date: '2023-10-20' },
    { id: '2', author: 'Jane Smith', rating: 4, comment: 'Good service, but a bit late.', date: '2023-10-18' },
];


function Rating({ rating, count }: { rating: number; count?: number }) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
      ))}
      {halfStar && (
        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="w-5 h-5 text-muted-foreground/30 fill-muted-foreground/10" />
      ))}
      {count && <span className="ml-2 text-sm text-muted-foreground">({count} reviews)</span>}
    </div>
  );
}

export default async function ServiceDetailPage({ params }: { params: { id: string } }) {
  const { id } = React.use(params);
  const service = await getService(id);

  if (!service) {
    notFound();
  }
  
  const reviews = MOCK_REVIEWS; // Using mock reviews for now
  const reviewsCount = reviews.length;
  const rating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviewsCount || 0;


  const image = PlaceHolderImages.find((img) => img.imageHint.includes(service.imageHint || ''));

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
        <div className="lg:col-span-2 space-y-8">
          <Card className="overflow-hidden">
            <div className="relative w-full h-[400px]">
              {image && (
                <Image
                  src={image.imageUrl}
                  alt={service.title}
                  fill
                  className="object-cover"
                  data-ai-hint={service.imageHint}
                />
              )}
            </div>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="secondary" className="mb-2">{service.category}</Badge>
                  <CardTitle className="text-3xl font-bold">{service.title}</CardTitle>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">${service.price.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">{service.priceUnit === 'hourly' ? 'per hour' : 'fixed price'}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Rating rating={rating} count={reviewsCount} />
              <Separator className="my-6" />
              <h3 className="text-xl font-semibold mb-2">About this service</h3>
              <p className="text-foreground/80 leading-relaxed">{service.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewSummarizer reviews={reviews.map(r => r.comment)} />
              <Separator className="my-6" />
              <div className="space-y-6">
                {reviews.map(review => (
                    <div key={review.id} className="flex gap-4">
                        <Avatar className="h-10 w-10 border">
                            <AvatarFallback>{review.author.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-semibold">{review.author}</p>
                                <p className="text-xs text-muted-foreground">{format(new Date(review.date), 'PPP')}</p>
                            </div>
                            <Rating rating={review.rating} />
                            <p className="mt-2 text-sm text-foreground/80">{review.comment}</p>
                        </div>
                    </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-8 lg:sticky top-24 self-start">
            <Card>
                <CardHeader className="text-center pb-4">
                    <CardTitle className="text-xl">Book This Service</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                     <Button size="lg" className="w-full" asChild>
                        <Link href={`/book/${service.id}`}>Book Now for ${service.price.toFixed(2)}</Link>
                     </Button>
                     <Button size="lg" variant="outline" className="w-full"><MessageSquare className="mr-2 h-4 w-4" /> Message Provider</Button>
                </CardContent>
            </Card>

          <Card>
            <CardHeader>
              <CardTitle>About the Provider</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border">
                  {service.provider.avatarUrl && <AvatarImage src={service.provider.avatarUrl} alt={service.provider.name} />}
                  <AvatarFallback>{service.provider.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-bold">{service.provider.name}</p>
                  <Rating rating={rating} count={reviewsCount} />
                </div>
              </div>
              <Separator className="my-4" />
               <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>Flexible availability</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span>Payment protection</span>
                    </li>
                </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
