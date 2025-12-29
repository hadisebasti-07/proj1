'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { setAdminClaim } from '@/app/actions'; // We will create this action

export default function AdminPage() {
  const { toast } = useToast();
  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleMakeAdmin = async () => {
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a user email.',
      });
      return;
    }
    setIsLoading(true);
    const { success, error } = await setAdminClaim({ email });
    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error Setting Admin Claim',
        description: error,
      });
    } else if (success) {
      toast({
        title: 'Success!',
        description: `${email} has been made an admin. They must log out and log back in for the changes to take effect.`,
      });
      setEmail('');
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Administrator Controls</CardTitle>
          <CardDescription>
            Use this page to grant admin privileges to users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="email">User Email</Label>
                <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                />
            </div>
            <Button onClick={handleMakeAdmin} disabled={isLoading}>
                {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Make Admin
            </Button>
            <p className="text-xs text-muted-foreground pt-4">
                <strong>Important:</strong> For the new admin privileges to take effect, the user must log out and log back in.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
