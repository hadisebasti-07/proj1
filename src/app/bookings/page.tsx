'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useFirebase, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { query, collection, where } from 'firebase/firestore';
import type { Booking } from '@/lib/types';


export default function MyBookingsPage() {
    const { user, isUserLoading } = useFirebase();
    const firestore = useFirestore();
    const router = useRouter();

    React.useEffect(() => {
        if (!isUserLoading && !user) {
          router.push('/auth/login');
        }
    }, [user, isUserLoading, router]);

    const bookingsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'bookings'), where('customerId', '==', user.uid));
    }, [firestore, user]);

    const { data: bookings, isLoading } = useCollection<Booking>(bookingsQuery);
    
    if (isUserLoading || !user) {
        return (
          <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </div>
        );
    }
    
    return (
        <div className="container mx-auto py-10 px-4">
             <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">My Bookings</h1>
            </div>
            <Card>
                <CardHeader>
                <CardTitle>Booking History</CardTitle>
                <CardDescription>
                    Manage your scheduled and completed services.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : !bookings || bookings.length === 0 ? (
                        <div className="text-center py-16">
                            <h3 className="text-xl font-semibold mb-2">
                                You haven't booked any services yet.
                            </h3>
                            <Button asChild>
                                <Link href="/">Browse Services</Link>
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Service</TableHead>
                                <TableHead>Provider</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {bookings.map((booking) => (
                                <TableRow key={booking.id}>
                                <TableCell className="font-medium">
                                    {booking.service?.title || 'N/A'}
                                </TableCell>
                                <TableCell>{booking.service?.provider?.name || 'N/A'}</TableCell>
                                <TableCell>
                                    {booking.bookingDate ? format(booking.bookingDate.toDate(), 'PPP p') : 'N/A'}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                    variant={
                                        booking.status === 'completed'
                                        ? 'default'
                                        : booking.status === 'confirmed'
                                        ? 'secondary'
                                        : 'destructive'
                                    }
                                    className="capitalize"
                                    >
                                    {booking.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    ${booking.service?.price?.toFixed(2) || '0.00'}
                                </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
