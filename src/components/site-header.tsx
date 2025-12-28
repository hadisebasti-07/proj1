
'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { Logo } from './icons';
import { UserNav } from './user-nav';
import { useUser } from '@/firebase';
import { Skeleton } from './ui/skeleton';

export function SiteHeader() {
  const { user, isUserLoading } = useUser();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <Logo className="h-6 w-6 text-primary" />
            <span className="font-bold">MarketConnect</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/"
            className="transition-colors hover:text-foreground/80 text-foreground"
          >
            Services
          </Link>
          <Link
            href="/dashboard/provider/create"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Become a Provider
          </Link>
          <Link
            href="/dashboard"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Dashboard
          </Link>
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {isUserLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : user ? (
            <UserNav />
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
