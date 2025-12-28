import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Service } from '@/lib/types';
import { Star, StarHalf } from 'lucide-react';
import { Badge } from './ui/badge';

interface ServiceCardProps {
  service: Service;
}

function Rating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
      ))}
      {halfStar && <StarHalf className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="w-4 h-4 text-muted-foreground/50 fill-muted-foreground/20" />
      ))}
    </div>
  );
}

export function ServiceCard({ service }: ServiceCardProps) {
  const image = PlaceHolderImages.find((img) => img.imageUrl.includes(service.imageUrl));
  const providerAvatar = PlaceHolderImages.find((img) => img.imageUrl.includes(service.provider.avatarUrl));

  return (
    <Card className="flex flex-col overflow-hidden transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-xl">
      <CardHeader className="p-0">
        <Link href={`/services/${service.id}`} className="block">
          <div className="aspect-w-4 aspect-h-3 relative">
            {image && (
              <Image
                src={image.imageUrl}
                alt={service.title}
                width={400}
                height={300}
                className="object-cover"
                data-ai-hint={service.imageHint}
              />
            )}
            <Badge variant="secondary" className="absolute top-2 right-2">
              {service.category}
            </Badge>
          </div>
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10 border">
            {providerAvatar && <AvatarImage src={providerAvatar.imageUrl} alt={service.provider.name} data-ai-hint={providerAvatar.imageHint}/>}
            <AvatarFallback>{service.provider.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{service.provider.name}</p>
            <div className="flex items-center text-xs text-muted-foreground">
                <Rating rating={service.provider.rating} />
                <span className="ml-2">({service.provider.reviewsCount} reviews)</span>
            </div>
          </div>
        </div>
        <Link href={`/services/${service.id}`} className="block">
          <h3 className="font-semibold text-lg truncate hover:text-primary">
            {service.title}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {service.description}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div>
          <p className="text-lg font-bold text-primary">
            ${service.price.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">
            {service.priceUnit === 'hourly' ? 'per hour' : 'fixed price'}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/services/${service.id}`}>Book Now</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
