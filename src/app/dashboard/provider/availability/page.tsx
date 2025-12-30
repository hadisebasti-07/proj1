import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AvailabilityForm } from './availability-form';

export default function AvailabilityPage() {
  return (
    <div className="container mx-auto max-w-4xl py-10">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Your Availability</CardTitle>
          <CardDescription>
            Set your weekly schedule. Customers will only be able to book you during these times.
            All times are in your local timezone and will be converted automatically for customers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvailabilityForm />
        </CardContent>
      </Card>
    </div>
  );
}
