import type { LucideIcon } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';

export type Category = {
  id: string;
  name: string;
  icon: string;
};

export type ProviderProfile = {
  id: string; // Firestore document ID
  displayName: string;
  description: string;
  categories: string[];
  location: string;
  photoUrl?: string;
  rating: number;
  status: 'active' | 'pending';
  userId: string;
  createdAt: Timestamp;
};

export type ProviderStub = {
  id: string;
  name: string;
  avatarUrl: string;
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
  provider: ProviderStub;
  imageUrl?: string;
  imageHint?: string;
  rating?: number;
  reviewsCount?: number;
  reviews: Review[];
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
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
    // role is not used for authorization, just for UI display
    role: 'customer' | 'provider' | 'admin';
    createdAt: Timestamp;
};

export type TimeSlot = {
  start: string;
  end: string;
};

export type DaySchedule = {
  enabled: boolean;
  slots: TimeSlot[];
};

export type ProviderAvailability = {
  weeklySchedule: {
    sunday: DaySchedule;
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
  };
  dateOverrides?: {
    date: string; // YYYY-MM-DD
    slots: TimeSlot[];
  }[];
}
