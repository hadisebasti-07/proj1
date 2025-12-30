'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User,
} from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc, serverTimestamp, getDoc, getFirestore } from 'firebase/firestore';

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  formType: 'login' | 'signup';
}

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

type FormData = z.infer<typeof formSchema>;

export function UserAuthForm({
  className,
  formType,
  ...props
}: UserAuthFormProps) {
  const { toast } = useToast();
  const auth = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const handleRedirect = async (user: User) => {
    const firestore = getFirestore(auth.app);
    // It's possible the user document isn't created yet on first signup.
    // We give it a moment, but this could be made more robust with retries or a waiting page.
    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && userDoc.data()?.role !== 'customer') {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
    } catch {
       router.push('/');
    }
  };

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    try {
      let userCredential;
      if (formType === 'login') {
        userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;
        const firestore = getFirestore(auth.app);
        const userDocRef = doc(firestore, 'users', user.uid);

        const newUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.email?.split('@')[0] || 'New User',
          photoURL: user.photoURL || '',
          role: 'customer',
          createdAt: serverTimestamp(),
        };
        // This can remain non-blocking as it happens after successful auth
        setDocumentNonBlocking(userDocRef, newUser, { merge: false });
      }
      
      toast({
        title:
          formType === 'login'
            ? 'Sign in successful!'
            : 'Account created!',
        description: 'You will be redirected shortly.',
      });
      
      await handleRedirect(userCredential.user);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description:
          error.code === 'auth/invalid-credential' 
          ? 'Invalid email or password. Please try again.'
          : error.message || 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              {...register('email')}
            />
            {errors?.email && (
              <p className="px-1 text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              disabled={isLoading}
              {...register('password')}
            />
            {errors?.password && (
              <p className="px-1 text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
          <Button disabled={isLoading} className="mt-2">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {formType === 'login' ? 'Sign In' : 'Sign Up'}
          </Button>
        </div>
      </form>
    </div>
  );
}
