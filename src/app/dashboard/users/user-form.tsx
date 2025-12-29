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
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useFirestore } from '@/firebase';
import { collection, serverTimestamp, doc, setDoc, updateDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits.'),
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
    // Use defaultValues to initialize the form.
    // This is the correct approach and avoids complex useEffect hooks.
    // The key ensures the form re-initializes when we switch between editing different users.
    defaultValues: user ? {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
    } : {
        name: '',
        email: '',
        phone: '',
        role: 'customer',
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
        // Update existing user - use a standard awaited update
        const userDoc = doc(firestore, 'users', user.uid);
        await updateDoc(userDoc, data);
        toast({
          title: 'User Updated',
          description: `Details for ${data.name} have been updated.`,
        });
      } else {
        // Add new user - NOTE: This doesn't create an Auth user.
        // This is a simplified example for adding from the admin panel.
        const newUid = doc(collection(firestore, 'id-generator')).id; // Generate a new UID
        const userDoc = doc(firestore, 'users', newUid);
        await setDoc(userDoc, {
          ...data,
          uid: newUid, 
          createdAt: serverTimestamp(),
        });
        toast({
          title: 'User Added',
          description: `${data.name} has been added to the system.`,
        });
      }
      // Only call this on success, after the await is complete.
      onFormSubmit();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred.',
      });
    } finally {
      // This will run regardless of success or failure.
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
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
                <Input placeholder="john.doe@example.com" {...field} disabled={!!user} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="(123) 456-7890" {...field} />
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {user ? 'Update User' : 'Add User'}
        </Button>
      </form>
    </Form>
  );
}
