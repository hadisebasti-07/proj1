'use server';

import { generateServiceListingDescription } from '@/ai/flows/generate-service-listing-description';
import { summarizeServiceReviews } from '@/ai/flows/summarize-service-reviews';

export async function getReviewSummary(
  reviews: string[]
): Promise<{ summary: string | null; error: string | null }> {
  try {
    const result = await summarizeServiceReviews({ reviews });
    return { summary: result.summary, error: null };
  } catch (e) {
    console.error(e);
    return {
      summary: null,
      error: 'Failed to summarize reviews. Please try again later.',
    };
  }
}

export async function generateDescription(
  prompt: string
): Promise<{ description: string | null; error: string | null }> {
  try {
    if (prompt.length < 10) {
      return { description: null, error: 'Prompt is too short. Please provide more detail.' };
    }
    const result = await generateServiceListingDescription({ prompt });
    return { description: result.description, error: null };
  } catch (e) {
    console.error(e);
    return {
      description: null,
      error: 'Failed to generate description. Please try again later.',
    };
  }
}
