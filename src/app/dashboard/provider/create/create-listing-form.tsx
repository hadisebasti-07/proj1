'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { CalendarIcon, Loader2, Wand2, Paperclip } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';

const timeSlots = [
  { id: 'morning', label: 'Morning (9:00 AM - 12:00 PM)' },
  { id: 'afternoon', label: 'Afternoon (1:00 PM - 5:00 PM)' },
  { id: 'evening', label: 'Evening (6:00 PM - 9:00 PM)' },
];

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  category: z.string().min(1, 'Please select a category.'),
  prompt: z
    .string()
    .min(10, 'Prompt must be at least 10 characters to generate a description.'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters.'),
  price: z.coerce.number().min(0, 'Price must be a positive number.'),
  priceUnit: z.enum(['hourly', 'fixed']),
  image: z.any().optional(),
  availableDate: z.date({
    required_error: 'A date of availability is required.',
  }),
  timeSlots: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'You have to select at least one time slot.',
  }),
});

type FormData = z.infer<typeof formSchema>;

export function CreateListingForm() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      category: '',
      prompt: '',
      description: '',
      price: 0,
      priceUnit: 'fixed',
      timeSlots: ['morning'],
    },
  });

  const handleGenerateDescription = async () => {
    const prompt = form.getValues('prompt');
    if (prompt.length < 10) {
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
    setIsSubmitting(true);
    console.log(data);
    // This is where you would handle form submission
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: 'Listing Created (Demo)',
        description: 'Your new service listing has been created.',
      });
      form.reset();
      setImagePreview(null);
    }, 2000);
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
            control={form.control}
            name="availableDate"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Available Date</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                        )}
                        >
                        {field.value ? (
                            format(field.value, "PPP")
                        ) : (
                            <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0); // Set to start of today
                          return date < today;
                        }}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                <FormMessage />
                </FormItem>
            )}
            />
            
            <FormField
            control={form.control}
            name="timeSlots"
            render={() => (
                <FormItem>
                <div className="mb-4">
                    <FormLabel className="text-base">Available Time Slots</FormLabel>
                    <FormDescription>
                    Select the times you are available on the chosen date.
                    </FormDescription>
                </div>
                {timeSlots.map((item) => (
                    <FormField
                    key={item.id}
                    control={form.control}
                    name="timeSlots"
                    render={({ field }) => {
                        return (
                        <FormItem
                            key={item.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                        >
                            <FormControl>
                            <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                return checked
                                    ? field.onChange([...field.value, item.id])
                                    : field.onChange(
                                        field.value?.filter(
                                        (value) => value !== item.id
                                        )
                                    );
                                }}
                            />
                            </FormControl>
                            <FormLabel className="font-normal">
                            {item.label}
                            </FormLabel>
                        </FormItem>
                        );
                    }}
                    />
                ))}
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

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
           Create Listing
        </Button>
      </form>
    </Form>
  );
}
