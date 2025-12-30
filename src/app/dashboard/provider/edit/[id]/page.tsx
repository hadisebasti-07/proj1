import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ServiceForm } from '../../service-form';
import { initializeFirebase } from '@/firebase/server-only';
import type { Service } from '@/lib/types';

async function getService(id: string): Promise<Service | null> {
    const { firestore } = initializeFirebase();
    const serviceRef = doc(firestore, 'services', id);
    const serviceSnap = await getDoc(serviceRef);

    if (!serviceSnap.exists()) {
        return null;
    }
    
    // Convert Firestore Timestamp to JSON-serializable format (string)
    const data = serviceSnap.data();
    return {
        id: serviceSnap.id,
        ...data,
        createdAt: data.createdAt.toDate().toISOString(),
        updatedAt: data.updatedAt.toDate().toISOString(),
    } as unknown as Service;
}


export default async function EditListingPage({ params }: { params: { id: string }}) {
  const service = await getService(params.id);

  if (!service) {
      notFound();
  }

  return (
    <div className="container mx-auto max-w-3xl py-10">
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
          <CardTitle>Edit Service Listing</CardTitle>
          <CardDescription>
            Update the details of your service offering below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceForm service={service} />
        </CardContent>
      </Card>
    </div>
  );
}

    