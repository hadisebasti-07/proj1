'use client';

import * as React from 'react';
import { PlusCircle } from 'lucide-react';

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

export default function UsersPage() {
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
  };
  
  const handleOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setSelectedUser(null);
    }
  }

  return (
    <div className="container mx-auto py-10 px-4">
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
          <UserForm 
            user={selectedUser} 
            onFormSubmit={handleFormClose} 
            open={isFormOpen}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
