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
  initiateEmailSignIn,
  initiateEmailSignUp,
} from '@/firebase/non-blocking-login';
import { useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  formType: 'login' | 'signup';
}

export function UserAuthForm({
  className,
  formType,
  ...props
}: UserAuthFormProps) {
  const { toast } = useToast();
  const auth = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const formSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email.' }),
    password: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters.' }),
  });

  type FormData = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    try {
      if (formType === 'login') {
        initiateEmailSignIn(auth, data.email, data.password);
      } else {
        initiateEmailSignUp(auth, data.email, data.password);
      }
      // Non-blocking, so we redirect immediately.
      // The useUser hook will pick up the auth state change.
      router.push('/dashboard');
      toast({
        title:
          formType === 'login'
            ? 'Signing in...'
            : 'Creating account...',
        description: 'You will be redirected shortly.',
      });
    } catch (error: any) {
      setIsLoading(false);
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description:
          error.message || 'An unexpected error occurred. Please try again.',
      });
    }
    // Don't set isLoading to false here, as the page will redirect.
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
