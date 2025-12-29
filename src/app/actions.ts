'use server';

import { generateServiceListingDescription } from '@/ai/flows/generate-service-listing-description';
import { summarizeServiceReviews } from '@/ai/flows/summarize-service-reviews';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, App, type AppOptions } from 'firebase-admin/app';
import { credential } from 'firebase-admin';

// This is a simplified, non-secure way to initialize Firebase Admin.
// In a real production app, you would use service account credentials
// securely managed via environment variables or a secret manager.
function initializeAdminApp(): App {
  const adminApps = getApps().filter(app => app.name.startsWith('firebase-admin-app'));
  if (adminApps.length > 0) {
    return adminApps[0];
  }
  
  const appOptions: AppOptions = {
    // Use default credentials
    credential: credential.applicationDefault(),
  };

  // Use a unique name to avoid conflicts
  return initializeApp(appOptions, `firebase-admin-app-${Date.now()}`);
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
