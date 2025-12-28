import type { LucideIcon } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';

export type Category = {
  id: string;
  name: string;
  icon: string;
};

export type Provider = {
  id: string;
  name: string;
  avatarUrl: string;
  rating: number;
  reviewsCount: number;
};

export type Review = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
};

export type Service = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  priceUnit: 'hourly' | 'fixed';
  provider: Provider;
  imageUrl: string;
  imageHint: string;
  rating: number;
  reviewsCount: number;
  reviews: Review[];
};

export type Booking = {
  id: string;
  service: Service;
  date: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
};

export type User = {
    id: string; // Firestore document ID
    uid: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    createdAt: Timestamp;
}
