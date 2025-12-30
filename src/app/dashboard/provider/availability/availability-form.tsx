'use client';

import * as React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
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
import { Button } from '@/components/ui/button';
import { Loader2, Clock, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ProviderAvailability } from '@/lib/types';
import { cn } from '@/lib/utils';

const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  const formattedHour = hour.toString().padStart(2, '0');
  return `${formattedHour}:${minute}`;
});

const timeSlotSchema = z.object({
  start: z.string(),
  end: z.string(),
});

const daySchema = z.object({
  enabled: z.boolean(),
  slots: z.array(timeSlotSchema),
});

const formSchema = z.object({
  weeklySchedule: z.object({
    sunday: daySchema,
    monday: daySchema,
    tuesday: daySchema,
    wednesday: daySchema,
    thursday: daySchema,
    friday: daySchema,
    saturday: daySchema,
  }),
});

type FormData = z.infer<typeof formSchema>;

const defaultValues: FormData = {
  weeklySchedule: {
    sunday: { enabled: false, slots: [] },
    monday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
    tuesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
    wednesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
    thursday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
    friday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
    saturday: { enabled: false, slots: [] },
  },
};

const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;


export function AvailabilityForm() {
  const { toast } = useToast();
  const { user } = useFirebase();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const availabilityRef = useMemoFirebase(
    () => user ? doc(firestore, 'providers', user.uid, 'availability', 'schedule') : null,
    [firestore, user]
  );
  
  const { data: availabilityData, isLoading } = useDoc<ProviderAvailability>(availabilityRef);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  React.useEffect(() => {
    if (availabilityData) {
      form.reset({ weeklySchedule: availabilityData.weeklySchedule as any });
    }
  }, [availabilityData, form]);


  async function onSubmit(data: FormData) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await setDoc(availabilityRef!, data, { merge: true });
      toast({
        title: 'Availability Updated',
        description: 'Your schedule has been saved successfully.',
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error Saving Availability',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6">
            {daysOfWeek.map((day) => (
                <DayAvailabilityControl key={day} day={day} control={form.control} watch={form.watch} />
            ))}
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </form>
    </Form>
  );
}

function DayAvailabilityControl({ day, control, watch }: { day: typeof daysOfWeek[number], control: any, watch: any }) {
    const { fields, append, remove } = useFieldArray({
      control,
      name: `weeklySchedule.${day}.slots`,
    });

    const isEnabled = watch(`weeklySchedule.${day}.enabled`);

    return (
         <FormField
          control={control}
          name={`weeklySchedule.${day}.enabled`}
          render={({ field }) => (
            <FormItem className="p-4 border rounded-lg space-y-4">
                <div className="flex flex-row items-center justify-between">
                    <FormLabel className="capitalize text-lg font-medium">{day}</FormLabel>
                    <FormControl>
                        <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        />
                    </FormControl>
                </div>
                 {isEnabled && (
                     <div className={cn("space-y-4 transition-opacity", !field.value && "opacity-50")}>
                        {fields.map((item, index) => (
                            <div key={item.id} className="flex items-end gap-4">
                                <FormField
                                    control={control}
                                    name={`weeklySchedule.${day}.slots.${index}.start`}
                                    render={({ field: slotField }) => (
                                        <FormItem className="flex-1">
                                        <FormLabel>Start Time</FormLabel>
                                            <TimeSelect field={slotField} />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={control}
                                    name={`weeklySchedule.${day}.slots.${index}.end`}
                                    render={({ field: slotField }) => (
                                        <FormItem className="flex-1">
                                        <FormLabel>End Time</FormLabel>
                                            <TimeSelect field={slotField} />
                                        </FormItem>
                                    )}
                                />
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ start: '09:00', end: '17:00' })}>
                            <PlusCircle className="mr-2 h-4 w-4"/>
                            Add Interval
                        </Button>
                    </div>
                )}
            </FormItem>
          )}
        />
    )
}

function TimeSelect({ field }: { field: any }) {
  return (
    <Select onValueChange={field.onChange} defaultValue={field.value}>
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder="Select a time" />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {timeOptions.map((time) => (
          <SelectItem key={time} value={time}>
            {time}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
