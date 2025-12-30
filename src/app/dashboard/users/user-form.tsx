'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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
import { useFirebase, useFirestore } from '@/firebase';
import {
  collection,
  serverTimestamp,
  doc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import type { User } from '@/lib/types';
import { updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const formSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  role: z.enum(['customer', 'provider', 'admin']),
});

type FormData = z.infer<typeof formSchema>;


interface UserFormProps {
  user: User | null;
  onFormSubmit: () => void;
}

export function UserForm({ user, onFormSubmit }: UserFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: authUser } = useFirebase();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      email: user?.email || '',
      role: user?.role || 'customer',
    },
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
      if (user) {
        const userDoc = doc(firestore, 'users', user.uid);
        // Using non-blocking update
        updateDocumentNonBlocking(userDoc, data);
        toast({
          title: 'User Updated',
          description: `Details for ${data.displayName} have been updated.`,
        });
      } else {
        // NOTE: This path is for creating a user record in Firestore, not a Firebase Auth user.
        // This is useful if you have a separate user creation process.
        const newUid = doc(collection(firestore, 'id-generator')).id;
        const userDoc = doc(firestore, 'users', newUid);
        
        const newUserPayload = {
          ...data,
          uid: newUid,
          createdAt: serverTimestamp(),
          photoURL: '', // Add default empty photoURL
        };

        // Using non-blocking set with merge:false
        setDocumentNonBlocking(userDoc, newUserPayload, { merge: false });
        toast({
          title: 'User Added',
          description: `${data.displayName} has been added to the system.`,
        });
      }
      onFormSubmit();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          (error as Error).message || 'An unexpected error occurred.',
      });
    } finally {
       setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="john.doe@example.com"
                    {...field}
                    disabled={!!user} // Don't allow editing email
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="provider">Provider</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end space-x-4 pt-4">
            <DialogClose asChild>
                <Button type="button" variant="outline">
                    Cancel
                </Button>
            </DialogClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {user ? 'Update User' : 'Add User'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
