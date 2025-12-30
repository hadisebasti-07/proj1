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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
import { bookings } from '@/lib/data';
import { format } from 'date-fns';
import Link from 'next/link';
import { PlusCircle, Loader2, Calendar, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { UserTable } from './users/user-table';
import { UserForm } from './users/user-form';
import type { User as UserType, Service } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu';
import { useFirebase, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { query, collection, where } from 'firebase/firestore';

function MyListings() {
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
                  Manage your service listings and connect with customers.
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
                            You have no active listings.
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            Start offering your services on MarketConnect today.
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
                                                    <DropdownMenuItem>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        <span>Edit</span>
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


export default function DashboardPage() {
  const { user, isUserLoading, isUserAdmin } = useFirebase();
  const router = useRouter();

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<UserType | null>(
    null
  );

  const isLoading = isUserLoading;
  const isAdmin = !isLoading && isUserAdmin;

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isUserLoading, router]);

  const handleEdit = (user: UserType) => {
    // Use setTimeout to defer state updates, allowing Radix to manage focus correctly first.
    setTimeout(() => {
      setSelectedUser(user);
      setIsFormOpen(true);
    }, 0);
  };

  const handleAddNew = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    // This is called from the form on successful submission.
    // It signals that we should close the dialog.
    setIsFormOpen(false);
  };

  // This is the single source of truth for managing the dialog's open state.
  const handleOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    // If the dialog is closing (for any reason), reset the selected user.
    if (!open) {
      setSelectedUser(null);
    }
  };


  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // This can happen briefly while redirecting.
    return null;
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">My Dashboard</h1>

      <Tabs defaultValue="bookings" className="w-full">
        <TabsList
          className={`grid w-full ${
            isAdmin ? 'grid-cols-5' : 'grid-cols-3'
          } mb-6`}
        >
          <TabsTrigger value="bookings">My Bookings</TabsTrigger>
          <TabsTrigger value="listings">My Listings</TabsTrigger>
          {isAdmin && <TabsTrigger value="users">Users</TabsTrigger>}
          {isAdmin && <TabsTrigger value="providers">Providers</TabsTrigger>}
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>
        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming & Past Bookings</CardTitle>
              <CardDescription>
                Manage your scheduled and completed services.
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                        {booking.service.title}
                      </TableCell>
                      <TableCell>{booking.service.provider.name}</TableCell>
                      <TableCell>
                        {format(new Date(booking.date), 'PPP p')}
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
                        ${booking.service.price.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="listings">
          <MyListings />
        </TabsContent>

        {isAdmin ? (
          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    View, add, edit, and remove users.
                  </CardDescription>
                </div>
                <Button onClick={handleAddNew}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New User
                </Button>
              </CardHeader>
              <CardContent>
                <UserTable onEdit={handleEdit} />
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}
        
        {isAdmin ? (
          <TabsContent value="providers">
            <Card>
              <CardHeader>
                 <CardTitle>Provider Management</CardTitle>
                  <CardDescription>
                    Add, edit, and manage service providers.
                  </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-16 space-y-4">
                 <p className="text-muted-foreground">
                  Provider management functionality to be implemented here.
                </p>
                <Button asChild>
                  <Link href="/dashboard/providers">
                    Go to Provider Management
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Update your profile and set your availability.
              </CardDescription>
            </CardHeader>
            <CardContent className="py-16 text-center">
               <p className="text-muted-foreground mb-4">
                Set your weekly hours to let customers know when you're available.
              </p>
               <Button asChild>
                <Link href="/dashboard/provider/availability">
                  <Calendar className="mr-2 h-4 w-4" /> Manage Availability
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Dialog open={isFormOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser
                ? "Update the user's details below."
                : 'Enter the details for the new user.'}
            </DialogDescription>
          </DialogHeader>
          {/* Conditionally render the form to ensure it unmounts cleanly */}
          {isFormOpen && (
            <UserForm user={selectedUser} onFormSubmit={handleFormSuccess} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
