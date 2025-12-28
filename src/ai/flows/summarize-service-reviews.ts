'use server';

/**
 * @fileOverview Summarizes service reviews to provide a quick understanding of general sentiment and key feedback.
 *
 * - summarizeServiceReviews - A function that summarizes service reviews.
 * - SummarizeServiceReviewsInput - The input type for the summarizeServiceReviews function.
 * - SummarizeServiceReviewsOutput - The return type for the summarizeServiceReviews function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeServiceReviewsInputSchema = z.object({
  reviews: z.array(z.string()).describe('An array of service reviews.'),
});
export type SummarizeServiceReviewsInput = z.infer<typeof SummarizeServiceReviewsInputSchema>;

const SummarizeServiceReviewsOutputSchema = z.object({
  summary: z.string().describe('A summary of the service reviews.'),
});
export type SummarizeServiceReviewsOutput = z.infer<typeof SummarizeServiceReviewsOutputSchema>;

export async function summarizeServiceReviews(input: SummarizeServiceReviewsInput): Promise<SummarizeServiceReviewsOutput> {
  return summarizeServiceReviewsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeServiceReviewsPrompt',
  input: {schema: SummarizeServiceReviewsInputSchema},
  output: {schema: SummarizeServiceReviewsOutputSchema},
  prompt: `Summarize the following service reviews:

  {{#each reviews}}
  - {{{this}}}
  {{/each}}
  `,
});

const summarizeServiceReviewsFlow = ai.defineFlow(
  {
    name: 'summarizeServiceReviewsFlow',
    inputSchema: SummarizeServiceReviewsInputSchema,
    outputSchema: SummarizeServiceReviewsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
