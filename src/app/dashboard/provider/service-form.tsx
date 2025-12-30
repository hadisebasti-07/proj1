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
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, Paperclip } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateDescription } from '@/app/actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { categories } from '@/lib/data';
import { useFirebase, useFirestore } from '@/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { Service } from '@/lib/types';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  category: z.string().min(1, 'Please select a category.'),
  prompt: z
    .string()
    .min(10, 'Prompt must be at least 10 characters to generate a description.')
    .optional(),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters.'),
  price: z.coerce.number().min(0, 'Price must be a positive number.'),
  priceUnit: z.enum(['hourly', 'fixed']),
  image: z.any().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ServiceFormProps {
    service?: Service;
}

export function ServiceForm({ service }: ServiceFormProps) {
  const { toast } = useToast();
  const { user, userProfile } = useFirebase();
  const firestore = useFirestore();
  const router = useRouter();
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string | null>(service?.imageUrl || null);
  
  const isEditMode = !!service;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: service?.title || '',
      category: service?.category || '',
      prompt: '',
      description: service?.description || '',
      price: service?.price || 0,
      priceUnit: service?.priceUnit || 'fixed',
    },
  });

  const handleGenerateDescription = async () => {
    const prompt = form.getValues('prompt');
    if (!prompt || prompt.length < 10) {
      form.setError('prompt', {
        message: 'Prompt is too short. Please provide more detail.',
      });
      return;
    }

    setIsGenerating(true);
    const { description, error } = await generateDescription(prompt);
    setIsGenerating(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
    } else if (description) {
      form.setValue('description', description, { shouldValidate: true });
      toast({
        title: 'Success!',
        description: 'AI-powered description has been generated.',
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImagePreview(URL.createObjectURL(file));
      form.setValue('image', file);
    }
  };

  async function onSubmit(data: FormData) {
    if (!user || !userProfile) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in as a provider to create a listing.',
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
        const { image, prompt, ...serviceData } = data;
        
        if (isEditMode) {
            const serviceDocRef = doc(firestore, 'services', service.id);
            await updateDoc(serviceDocRef, {
                ...serviceData,
                updatedAt: serverTimestamp(),
            });
            toast({
                title: 'Listing Updated!',
                description: 'Your service listing has been successfully updated.',
            });
        } else {
            const servicesCollection = collection(firestore, 'services');
            await addDoc(servicesCollection, {
                ...serviceData,
                provider: {
                    id: user.uid,
                    name: userProfile.displayName || user.displayName || 'Unnamed Provider',
                    avatarUrl: userProfile.photoUrl || user.photoURL || '',
                },
                isActive: true,
                rating: 0,
                reviewsCount: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
             toast({
                title: 'Listing Created!',
                description: 'Your new service listing is now live.',
            });
        }

      router.push('/dashboard');
      router.refresh();

    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast({
        variant: 'destructive',
        title: `Error ${isEditMode ? 'Updating' : 'Creating'} Listing`,
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Professional Logo Design" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories
                    .filter((c) => c.id !== 'all')
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>AI Description Prompt</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your service in a few words. For example: 'I create minimalist logos for modern tech startups.'"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Use this prompt to generate a detailed service description using
                AI.
              </FormDescription>
              <FormMessage />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateDescription}
                disabled={isGenerating}
                className="mt-2"
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Generate with AI
              </Button>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="A detailed description of your service."
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormItem>
            <FormLabel>Service Image</FormLabel>
            <FormControl>
                <div className="flex items-center gap-4">
                    {imagePreview && (
                        <img src={imagePreview} alt="Image preview" className="w-24 h-24 object-cover rounded-md border" />
                    )}
                    <Button type="button" asChild variant="outline">
                        <label htmlFor="image-upload" className="cursor-pointer">
                            <Paperclip className="mr-2 h-4 w-4"/>
                            {imagePreview ? 'Change Image' : 'Upload Image'}
                        </label>
                    </Button>
                    <Input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </div>
            </FormControl>
            <FormDescription>Upload a high-quality image that represents your service.</FormDescription>
        </FormItem>

        <div className="grid grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price ($)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="100.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priceUnit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price Unit</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select price unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Price</SelectItem>
                    <SelectItem value="hourly">Per Hour</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
           {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
           {isEditMode ? 'Save Changes' : 'Create Listing'}
        </Button>
      </form>
    </Form>
  );
}

    