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
import { ArrowRight, PlusCircle, Users } from 'lucide-react';
import { UserTable } from './users/user-table';
import { UserForm } from './users/user-form';
import type { User } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';


export default function DashboardPage() {
    const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
    const [isFormOpen, setIsFormOpen] = React.useState(false);

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setSelectedUser(null);
        setIsFormOpen(true);
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setSelectedUser(null);
    };

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">My Dashboard</h1>

      <Tabs defaultValue="bookings" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="bookings">My Bookings</TabsTrigger>
          <TabsTrigger value="provider">Provider Hub</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
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
        <TabsContent value="provider">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Provider Hub</CardTitle>
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
            <CardContent className="text-center py-16">
              <h3 className="text-xl font-semibold mb-2">You have no active listings.</h3>
              <p className="text-muted-foreground mb-4">Start offering your services on MarketConnect today.</p>
            </CardContent>
          </Card>
        </TabsContent>
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
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Update your profile and notification preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-16">
              <p className="text-muted-foreground">Account settings UI to be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {selectedUser
                ? "Update the user's details below."
                : 'Enter the details for the new user.'}
            </DialogDescription>
          </DialogHeader>
          <UserForm user={selectedUser} onFormSubmit={handleFormClose} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
