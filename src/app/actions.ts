'use server';

import { generateServiceListingDescription } from '@/ai/flows/generate-service-listing-description';
import { summarizeServiceReviews } from '@/ai/flows/summarize-service-reviews';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, App } from 'firebase-admin/app';

// This is a simplified, non-secure way to initialize Firebase Admin.
// In a real production app, you would use service account credentials
// securely managed via environment variables or a secret manager.
function initializeAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  // This will automatically use the GOOGLE_APPLICATION_CREDENTIALS
  // environment variable if it's set.
  return initializeApp();
}

export async function setAdminClaim(params: {
  email: string;
}): Promise<{ success: boolean; error: string | null }> {
  try {
    const adminApp = initializeAdminApp();
    const auth = getAuth(adminApp);
    const user = await auth.getUserByEmail(params.email);
    
    // Set the custom claim
    await auth.setCustomUserClaims(user.uid, { admin: true });

    return { success: true, error: null };
  } catch (e: any) {
    console.error('Error setting admin claim:', e);
    return {
      success: false,
      error: e.message || 'An unknown error occurred.',
    };
  }
}


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
