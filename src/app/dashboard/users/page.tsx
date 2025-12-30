'use client';

import * as React from 'react';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UserForm } from './user-form';
import { UserTable } from './user-table';
import type { User } from '@/lib/types';
import { useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const { user, isUserLoading, isUserAdmin } = useFirebase();
  const router = useRouter();
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isUserLoading && !isUserAdmin) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, isUserAdmin, router]);


  const handleEdit = (user: User) => {
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
    setIsFormOpen(false);
  };
  
  const handleOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setSelectedUser(null);
    }
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </div>

      <UserTable onEdit={handleEdit} />

      <Dialog open={isFormOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {selectedUser
                ? "Update the user's details below."
                : 'Enter the details for the new user.'}
            </DialogDescription>
          </DialogHeader>
          {isFormOpen && (
            <UserForm 
              user={selectedUser} 
              onFormSubmit={handleFormSuccess} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
