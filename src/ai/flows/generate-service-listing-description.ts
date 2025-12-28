'use server';

/**
 * @fileOverview A service listing description generator AI agent.
 *
 * - generateServiceListingDescription - A function that generates a service listing description.
 * - GenerateServiceListingDescriptionInput - The input type for the generateServiceListingDescription function.
 * - GenerateServiceListingDescriptionOutput - The return type for the generateServiceListingDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateServiceListingDescriptionInputSchema = z.object({
  prompt: z.string().describe('A short prompt describing the service.'),
});
export type GenerateServiceListingDescriptionInput = z.infer<
  typeof GenerateServiceListingDescriptionInputSchema
>;

const GenerateServiceListingDescriptionOutputSchema = z.object({
  description: z
    .string()
    .describe('A detailed description of the service listing.'),
});
export type GenerateServiceListingDescriptionOutput = z.infer<
  typeof GenerateServiceListingDescriptionOutputSchema
>;

export async function generateServiceListingDescription(
  input: GenerateServiceListingDescriptionInput
): Promise<GenerateServiceListingDescriptionOutput> {
  return generateServiceListingDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateServiceListingDescriptionPrompt',
  input: {schema: GenerateServiceListingDescriptionInputSchema},
  output: {schema: GenerateServiceListingDescriptionOutputSchema},
  prompt: `You are an expert copywriter specializing in creating service listings.

  Based on the following prompt, write a detailed and appealing service listing description.

  Prompt: {{{prompt}}}`,
});

const generateServiceListingDescriptionFlow = ai.defineFlow(
  {
    name: 'generateServiceListingDescriptionFlow',
    inputSchema: GenerateServiceListingDescriptionInputSchema,
    outputSchema: GenerateServiceListingDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
