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
import {
  collection,
  serverTimestamp,
  doc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import type { User } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits.'),
  role: z.enum(['customer', 'provider']),
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
    defaultValues: user || {
      name: '',
      email: '',
      phone: '',
      role: 'customer',
    },
  });
  
  React.useEffect(() => {
    // This effect ensures that if a new user is selected for editing,
    // the form resets to that new user's values.
    // It doesn't run when `user` becomes `null` on close.
    if (user) {
      form.reset(user);
    }
  }, [user, form]);


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
        // Update existing user
        const userDoc = doc(firestore, 'users', user.uid);
        await updateDoc(userDoc, data);
        toast({
          title: 'User Updated',
          description: `Details for ${data.name} have been updated.`,
        });
      } else {
        // Add new user - This part has a known issue where it creates
        // a user doc without a corresponding auth user.
        // For this admin panel, we'll allow it.
        const newUid = doc(collection(firestore, 'id-generator')).id;
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
      onFormSubmit(); // Signal success to the parent
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
                <Input
                  placeholder="john.doe@example.com"
                  {...field}
                  disabled={!!user}
                />
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
