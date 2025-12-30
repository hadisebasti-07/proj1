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
import { PlusCircle, Loader2, Calendar, MoreHorizontal, Edit, Trash2, Users, Briefcase, DollarSign } from 'lucide-react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu';
import { useFirebase, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { query, collection, where } from 'firebase/firestore';
import type { Service, Booking, User as UserType, ProviderProfile } from '@/lib/types';


//================================================================================
// Provider Dashboard Components
//================================================================================

function ProviderListings() {
    const { user } = useFirebase();
    const firestore = useFirestore();

    const servicesQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'services'), where('provider.id', '==', user.uid));
    }, [firestore, user]);

    const { data: services, isLoading } = useCollection<Service>(servicesQuery);

    return (
         <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Service Listings</CardTitle>
                <CardDescription>
                  Manage your service listings and view their status.
                </CardDescription>
              </div>
              <Button asChild>
                <Link href="/dashboard/provider/create">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Listing
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                     <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : !services || services.length === 0 ? (
                    <div className="text-center py-16">
                        <h3 className="text-xl font-semibold mb-2">
                            You have no listings.
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            Create a service listing to start offering your services.
                        </p>
                    </div>
                ) : (
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {services.map((service) => (
                                    <TableRow key={service.id}>
                                        <TableCell className="font-medium">{service.title}</TableCell>
                                        <TableCell>${service.price.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge variant={service.isActive ? 'default' : 'secondary'}>
                                                {service.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{format(service.createdAt.toDate(), 'PPP')}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/provider/edit/${service.id}`}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            <span>Edit</span>
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <span>Delete</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
          </Card>
    )
}

function ProviderBookings() {
    const { user } = useFirebase();
    const firestore = useFirestore();

    const bookingsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'bookings'), where('providerId', '==', user.uid));
    }, [firestore, user]);

    const { data: bookings, isLoading } = useCollection<Booking>(bookingsQuery);

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Bookings</CardTitle>
                <CardDescription>View upcoming and past bookings from customers.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : !bookings || bookings.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <p>Bookings from customers will appear here.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Service</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {bookings.map((booking) => (
                            <TableRow key={booking.id}>
                            <TableCell className="font-medium">
                                {booking.service?.title || 'N/A'}
                            </TableCell>
                             <TableCell>{'Unknown Customer'}</TableCell>
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
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}


function ProviderDashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <ProviderListings />
        <ProviderBookings />
      </div>
      <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>Availability</CardTitle>
                <CardDescription>Set your weekly working hours.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full">
                    <Link href="/dashboard/provider/availability">
                        <Calendar className="mr-2 h-4 w-4" /> Manage Availability
                    </Link>
                </Button>
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>My Wallet</CardTitle>
                <CardDescription>View your balance and request payouts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-center p-4 border rounded-lg bg-secondary">
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <p className="text-3xl font-bold">$0.00</p>
                </div>
                <Button className="w-full" disabled>
                    <DollarSign className="mr-2 h-4 w-4" /> Request Payout
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}

//================================================================================
// Admin Dashboard Components
//================================================================================

function AdminSummary() {
  const firestore = useFirestore();
  const { data: users } = useCollection<UserType>(useMemoFirebase(() => collection(firestore, 'users'), [firestore]));
  const { data: providers } = useCollection<ProviderProfile>(useMemoFirebase(() => collection(firestore, 'providers'), [firestore]));
  const { data: services } = useCollection<Service>(useMemoFirebase(() => collection(firestore, 'services'), [firestore]));
  const { data: bookings } = useCollection<Booking>(useMemoFirebase(() => collection(firestore, 'bookings'), [firestore]));
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{users?.length ?? <Loader2 className="h-6 w-6 animate-spin" />}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Providers</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{providers?.length ?? <Loader2 className="h-6 w-6 animate-spin" />}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Services</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{services?.length ?? <Loader2 className="h-6 w-6 animate-spin" />}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{bookings?.length ?? <Loader2 className="h-6 w-6 animate-spin" />}</div>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminDashboard() {
  return (
    <div className="space-y-8">
      <AdminSummary />

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  View and manage all user accounts in the system.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-center py-8">
                <Button asChild>
                <Link href="/dashboard/users">
                    Manage Users
                </Link>
                </Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Provider Management</CardTitle>
                <CardDescription>
                Add, edit, and manage service providers.
                </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
            <Button asChild>
                <Link href="/dashboard/providers">
                    Manage Providers
                </Link>
            </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}


//================================================================================
// Main Dashboard Page
//================================================================================

export default function DashboardPage() {
  const { user, userProfile, isUserLoading, isUserAdmin } = useFirebase();
  const router = useRouter();

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isUserLoading, router]);

  const getRole = () => {
    if (isUserAdmin) return 'admin';
    if (userProfile?.role === 'provider') return 'provider';
    return 'customer';
  }

  const role = getRole();

  // If user is a customer, redirect them from the dashboard
  React.useEffect(() => {
    if (!isUserLoading && role === 'customer') {
      router.push('/');
    }
  }, [role, isUserLoading, router]);
  
  if (isUserLoading || !user || role === 'customer') {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  const renderDashboardContent = () => {
    switch(role) {
      case 'admin':
        return <AdminDashboard />;
      case 'provider':
        return <ProviderDashboard />;
      default:
        // This case should not be reached due to the redirect
        return null;
    }
  }
  
  const getDashboardTitle = () => {
    switch(role) {
      case 'admin':
        return 'Admin Dashboard';
      case 'provider':
        return 'Provider Dashboard';
      default:
        return 'Dashboard';
    }
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{getDashboardTitle()}</h1>
      </div>
      {renderDashboardContent()}
    </div>
  );
}
