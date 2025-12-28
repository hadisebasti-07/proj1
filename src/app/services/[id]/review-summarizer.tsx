'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Sparkles, Terminal } from 'lucide-react';
import { getReviewSummary } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

interface ReviewSummarizerProps {
  reviews: string[];
}

export function ReviewSummarizer({ reviews }: ReviewSummarizerProps) {
  const { toast } = useToast();
  const [summary, setSummary] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSummarize = async () => {
    setIsLoading(true);
    setSummary(null);
    const { summary: newSummary, error } = await getReviewSummary(reviews);
    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error,
      });
    } else {
      setSummary(newSummary);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border bg-slate-50 dark:bg-slate-900/50 p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <h4 className="font-semibold">AI Powered Summary</h4>
            <p className="text-sm text-muted-foreground">
            Get a quick overview of what customers are saying.
            </p>
        </div>
        <Button onClick={handleSummarize} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Summarize Reviews
        </Button>
      </div>

      {summary && (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertTitle>Review Summary</AlertTitle>
          <AlertDescription>{summary}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
