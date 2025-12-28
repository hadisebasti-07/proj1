import type { Service, Category, Review, Booking } from './types';

const reviews: Review[] = [
  { id: '1', author: 'John Doe', rating: 5, comment: 'Excellent work, very professional!', date: '2023-10-20' },
  { id: '2', author: 'Jane Smith', rating: 4, comment: 'Good service, but a bit late.', date: '2023-10-18' },
  { id: '3', author: 'Bob Johnson', rating: 5, comment: 'Fixed my issue in no time. Highly recommend.', date: '2023-09-05' },
  { id: '4', author: 'Alice Williams', rating: 4.5, comment: 'Very knowledgeable and friendly.', date: '2023-08-12' },
];

export const categories: Category[] = [
  { id: 'all', name: 'All', icon: 'Briefcase' },
  { id: 'home-services', name: 'Home', icon: 'Wrench' },
  { id: 'creative', name: 'Creative', icon: 'Palette' },
  { id: 'tech', name: 'Tech', icon: 'Code' },
  { id: 'education', name: 'Education', icon: 'GraduationCap' },
  { id: 'culinary', name: 'Culinary', icon: 'CookingPot' },
];


export const services: Service[] = [
  {
    id: '1',
    title: 'Emergency Plumbing Services',
    description: '24/7 emergency plumbing for leaks, clogs, and more. Fast, reliable, and affordable solutions to all your plumbing needs.',
    category: 'Home',
    price: 75.00,
    priceUnit: 'hourly',
    provider: { id: 'p1', name: 'Mike Pipes', avatarUrl: '2001/40/40', rating: 4.8, reviewsCount: 124 },
    imageUrl: '1001/400/300',
    imageHint: 'plumbing work',
    rating: 4.8,
    reviewsCount: 124,
    reviews,
  },
  {
    id: '2',
    title: 'Full-Stack Web Development',
    description: 'Building modern, responsive, and high-performance web applications from scratch. Expertise in React, Node.js, and cloud deployment.',
    category: 'Tech',
    price: 120.00,
    priceUnit: 'hourly',
    provider: { id: 'p2', name: 'Ada Lovelace', avatarUrl: '2002/40/40', rating: 4.9, reviewsCount: 88 },
    imageUrl: '1003/400/300',
    imageHint: 'coding programming',
    rating: 4.9,
    reviewsCount: 88,
    reviews,
  },
  {
    id: '3',
    title: 'Private Chef Experience',
    description: 'Gourmet dining at home. A private chef will create a custom menu, shop for ingredients, cook, and clean up.',
    category: 'Culinary',
    price: 450.00,
    priceUnit: 'fixed',
    provider: { id: 'p3', name: 'Gordon Ramsay Jr.', avatarUrl: '2003/40/40', rating: 4.7, reviewsCount: 62 },
    imageUrl: '1005/400/300',
    imageHint: 'chef cooking',
    rating: 4.7,
    reviewsCount: 62,
    reviews,
  },
  {
    id: '4',
    title: 'High School Math Tutoring',
    description: 'Personalized math tutoring for high school students. Algebra, Geometry, Calculus. Improve grades and test scores.',
    category: 'Education',
    price: 50.00,
    priceUnit: 'hourly',
    provider: { id: 'p2', name: 'Ada Lovelace', avatarUrl: '2002/40/40', rating: 4.9, reviewsCount: 88 },
    imageUrl: '1004/400/300',
    imageHint: 'tutoring education',
    rating: 4.9,
    reviewsCount: 88,
    reviews,
  },
  {
    id: '5',
    title: 'Event Photography',
    description: 'Professional photography for weddings, corporate events, and parties. Capturing memories that last a lifetime.',
    category: 'Creative',
    price: 1500.00,
    priceUnit: 'fixed',
    provider: { id: 'p1', name: 'Mike Pipes', avatarUrl: '2001/40/40', rating: 4.8, reviewsCount: 124 },
    imageUrl: '1006/400/300',
    imageHint: 'photographer camera',
    rating: 4.8,
    reviewsCount: 124,
    reviews,
  },
  {
    id: '6',
    title: 'Garden & Landscape Design',
    description: 'Create your dream garden. Services include design, planting, and maintenance for a beautiful outdoor space.',
    category: 'Home',
    price: 90.00,
    priceUnit: 'hourly',
    provider: { id: 'p3', name: 'Gordon Ramsay Jr.', avatarUrl: '2003/40/40', rating: 4.7, reviewsCount: 62 },
    imageUrl: '1002/400/300',
    imageHint: 'gardening plants',
    rating: 4.7,
    reviewsCount: 62,
    reviews,
  },
];


export const bookings: Booking[] = [
    {
      id: 'b1',
      service: services[0],
      date: '2024-08-15T10:00:00Z',
      status: 'confirmed',
    },
    {
      id: 'b2',
      service: services[2],
      date: '2024-08-20T18:30:00Z',
      status: 'completed',
    },
    {
        id: 'b3',
        service: services[1],
        date: '2024-09-01T09:00:00Z',
        status: 'pending',
    }
];
