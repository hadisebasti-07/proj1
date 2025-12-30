
'use client';

import * as React from 'react';
import { notFound, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useFirebase, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import type { Service } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { format } from 'date-fns';

function ServiceBookingPage({ params }: { params: { serviceId: string } }) {
  const { user, isUserLoading } = useFirebase();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const serviceRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'services', params.serviceId) : null),
    [firestore, params.serviceId]
  );
  const { data: service, isLoading: isServiceLoading } = useDoc<Service>(serviceRef);

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isUserLoading, router]);

  const handleBooking = async () => {
    if (!user || !service || !date) {
      toast({
        variant: 'destructive',
        title: 'Booking Failed',
        description: 'Please make sure you are logged in, a service is loaded, and a date is selected.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingsCollection = collection(firestore, 'bookings');
      await addDoc(bookingsCollection, {
        customerId: user.uid,
        providerId: service.provider.id,
        serviceId: service.id,
        bookingDate: date,
        status: 'pending',
        paymentStatus: 'unpaid',
        createdAt: serverTimestamp(),
        // Denormalized data for easier querying and display
        service: {
          title: service.title,
          price: service.price,
          provider: {
            name: service.provider.name,
          },
        },
      });

      toast({
        title: 'Booking Successful!',
        description: `Your booking for ${service.title} has been requested.`,
      });
      router.push('/bookings');
    } catch (error) {
      console.error("Booking error: ", error);
      toast({
        variant: 'destructive',
        title: 'Booking Failed',
        description: 'There was an error while creating your booking. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isServiceLoading || isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!service) {
    return notFound();
  }

  const image = PlaceHolderImages.find((img) => img.imageHint.includes(service.imageHint || ''));

  return (
    <div className="container mx-auto max-w-4xl py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Confirm your Booking</CardTitle>
          <CardDescription>Review the details and select a date to book your service.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="overflow-hidden">
                <div className="relative w-full h-[200px]">
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
              <CardContent className="p-4">
                <Badge variant="secondary" className="mb-2">{service.category}</Badge>
                <h3 className="text-xl font-bold">{service.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="h-8 w-8 border">
                    {service.provider.avatarUrl && <AvatarImage src={service.provider.avatarUrl} alt={service.provider.name} />}
                    <AvatarFallback>{service.provider.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{service.provider.name}</span>
                </div>
              </CardContent>
            </Card>
             <div className="text-2xl font-bold text-right">
                Total: <span className="text-primary">${service.price.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold mb-4">Select a Date</h3>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              disabled={(d) => d < new Date(new Date().setDate(new Date().getDate() - 1))}
            />
             {date && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                You selected {format(date, 'PPP')}.
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
            <Button size="lg" className="w-full" onClick={handleBooking} disabled={isSubmitting || !date}>
                {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Submitting...</>
                ) : (
                    'Confirm Booking'
                )}
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default ServiceBookingPage;
