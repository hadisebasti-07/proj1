'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { ProviderProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProviderTableProps {
  onEdit: (provider: ProviderProfile) => void;
}

export function ProviderTable({ onEdit }: ProviderTableProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const providersCollection = useMemoFirebase(() => collection(firestore, 'providers'), [firestore]);
  const { data: providers, isLoading } = useCollection<ProviderProfile>(providersCollection);

  const [searchTerm, setSearchTerm] = React.useState('');
  const [providerToDelete, setProviderToDelete] = React.useState<ProviderProfile | null>(null);

  const handleDeleteConfirmation = (provider: ProviderProfile) => {
    setProviderToDelete(provider);
  };

  const handleDelete = () => {
    if (providerToDelete) {
      const providerDoc = doc(firestore, 'providers', providerToDelete.id);
      deleteDocumentNonBlocking(providerDoc);
      toast({
        title: 'Provider Deleted',
        description: `${providerToDelete.displayName} has been removed from the system.`,
      });
      setProviderToDelete(null);
    }
  };

  const filteredProviders = React.useMemo(() => {
    if (!providers) return [];
    return providers.filter(
      (provider) =>
        provider.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [providers, searchTerm]);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by name or category..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading providers...
                </TableCell>
              </TableRow>
            ) : filteredProviders.length > 0 ? (
              filteredProviders.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border">
                            {provider.photoUrl && <AvatarImage src={provider.photoUrl} alt={provider.displayName}/>}
                            <AvatarFallback>{provider.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {provider.displayName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                        {provider.categories.map(cat => <Badge key={cat} variant="secondary">{cat}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell>{provider.location}</TableCell>
                  <TableCell>
                    <Badge variant={provider.status === 'active' ? 'default' : 'destructive'}>
                      {provider.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{provider.rating}</TableCell>
                  <TableCell>
                    {provider.createdAt
                      ? format(new Date(provider.createdAt.toDate()), 'PPP')
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(provider)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteConfirmation(provider)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No providers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!providerToDelete} onOpenChange={(open) => !open && setProviderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {' '}
              <strong>{providerToDelete?.displayName}</strong> and remove their data from our
              servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
