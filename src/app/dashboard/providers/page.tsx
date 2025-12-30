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
import { ProviderForm } from './provider-form';
import { ProviderTable } from './provider-table';
import type { ProviderProfile } from '@/lib/types';
import { useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';

export default function ProvidersPage() {
  const { user, isUserLoading, isUserAdmin } = useFirebase();
  const router = useRouter();
  const [selectedProvider, setSelectedProvider] = React.useState<ProviderProfile | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isUserLoading && !isUserAdmin) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, isUserAdmin, router]);

  const handleEdit = (provider: ProviderProfile) => {
    setTimeout(() => {
        setSelectedProvider(provider);
        setIsFormOpen(true);
    }, 0);
  };

  const handleAddNew = () => {
    setSelectedProvider(null);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
  };
  
  const handleOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setSelectedProvider(null);
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
        <h1 className="text-3xl font-bold">Provider Management</h1>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Provider
        </Button>
      </div>

      <ProviderTable onEdit={handleEdit} />

      <Dialog open={isFormOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedProvider ? 'Edit Provider' : 'Add New Provider'}</DialogTitle>
            <DialogDescription>
              {selectedProvider
                ? "Update the provider's details below."
                : 'Enter the details for the new provider.'}
            </DialogDescription>
          </DialogHeader>
          {isFormOpen && (
            <ProviderForm 
              provider={selectedProvider} 
              onFormSubmit={handleFormSuccess} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
