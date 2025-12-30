'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DialogClose } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  serverTimestamp,
  doc,
  addDoc,
  updateDoc,
} from 'firebase/firestore';
import type { ProviderProfile, User } from '@/lib/types';
import { categories } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

const formSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  categories: z.array(z.string()).nonempty('Please select at least one category.'),
  location: z.string().min(2, 'Location is required.'),
  photoUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  rating: z.coerce.number().min(0).max(5).default(0),
  status: z.enum(['active', 'pending', 'suspended', 'verified']),
  userId: z.string().min(1, 'Please select a user.'),
});

type FormData = z.infer<typeof formSchema>;

interface ProviderFormProps {
  provider: ProviderProfile | null;
  onFormSubmit: () => void;
}

export function ProviderForm({ provider, onFormSubmit }: ProviderFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: authUser } = useFirebase();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const usersCollection = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersCollection);

  const defaultValues = {
    displayName: provider?.displayName || '',
    description: provider?.description || '',
    categories: provider?.categories || [],
    location: provider?.location || '',
    photoUrl: provider?.photoUrl || '',
    rating: provider?.rating || 0,
    status: provider?.status || 'pending',
    userId: provider?.userId || '',
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  async function onSubmit(data: FormData) {
    if (!authUser) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to perform this action.',
      });
      return;
    }
    setIsSubmitting(true);

    try {
      if (provider) {
        const providerDoc = doc(firestore, 'providers', provider.id);
        await updateDoc(providerDoc, data);
        toast({
          title: 'Provider Updated',
          description: `Details for ${data.displayName} have been updated.`,
        });
      } else {
        const providersCollectionRef = collection(firestore, 'providers');
        await addDoc(providersCollectionRef, {
          ...data,
          createdAt: serverTimestamp(),
        });
        toast({
          title: 'Provider Added',
          description: `${data.displayName} has been added to the system.`,
        });
      }
       setTimeout(() => {
        onFormSubmit();
      }, 0);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          (error as Error).message || 'An unexpected error occurred.',
      });
    } finally {
      // Defer setting isSubmitting to false to allow dialog to close.
      setTimeout(() => setIsSubmitting(false), 500);
    }
  }

  const handleCategoryToggle = (categoryName: string) => {
    const currentCategories = form.getValues('categories');
    const newCategories = currentCategories.includes(categoryName)
      ? currentCategories.filter((c) => c !== categoryName)
      : [...currentCategories, categoryName];
    form.setValue('categories', newCategories, { shouldValidate: true });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Provider's Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the provider..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="categories"
          render={() => (
            <FormItem>
              <FormLabel>Categories</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-10">
                  {categories
                    .filter((c) => c.id !== 'all')
                    .map((cat) => (
                      <Badge
                        key={cat.id}
                        variant={
                          form.getValues('categories').includes(cat.name)
                            ? 'default'
                            : 'secondary'
                        }
                        className="cursor-pointer"
                        onClick={() => handleCategoryToggle(cat.name)}
                      >
                        {cat.name}
                      </Badge>
                    ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g., San Francisco, CA" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="photoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Photo URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/photo.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rating</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" min="0" max="5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>User</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!provider}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Select a user"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {!isLoadingUsers && users?.map(user => (
                    <SelectItem key={user.uid} value={user.uid}>
                      {user.displayName} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-4 pt-4">
            <DialogClose asChild>
                <Button type="button" variant="outline">
                    Cancel
                </Button>
            </DialogClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {provider ? 'Update Provider' : 'Add Provider'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
