'use server';

/**
 * @fileOverview Calculates a completeness score for a generated FIR draft.
 *
 * - computeCompletenessScore - A function that calculates the completeness score.
 * - ComputeCompletenessScoreInput - The input type for the computeCompletenessScore function.
 * - ComputeCompletenessScoreOutput - The return type for the computeCompletenessScore function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ComputeCompletenessScoreInputSchema = z.object({
  firDraft: z.string().describe('The generated FIR draft text.'),
});
export type ComputeCompletenessScoreInput = z.infer<
  typeof ComputeCompletenessScoreInputSchema
>;

const ComputeCompletenessScoreOutputSchema = z.object({
  completenessScore: z
    .number()
    .describe(
      'The completeness score, between 0 and 100, based on key elements present in the FIR draft.'
    ),
});
export type ComputeCompletenessScoreOutput = z.infer<
  typeof ComputeCompletenessScoreOutputSchema
>;

export async function computeCompletenessScore(
  input: ComputeCompletenessScoreInput
): Promise<ComputeCompletenessScoreOutput> {
  return computeCompletenessScoreFlow(input);
}

const computeCompletenessScoreFlow = ai.defineFlow(
  {
    name: 'computeCompletenessScoreFlow',
    inputSchema: ComputeCompletenessScoreInputSchema,
    outputSchema: ComputeCompletenessScoreOutputSchema,
  },
  async ({ firDraft }) => {
    if (firDraft.length < 40) {
      return { completenessScore: 0 };
    }

    let score = 0;
    const lowerCaseDraft = firDraft.toLowerCase();

    // +20 if time is mentioned
    if (/\b(time|date|am|pm|\d{1,2}:\d{2}|\d{1,2}\s?(am|pm)|yesterday|today|morning|afternoon|evening|night)\b/.test(lowerCaseDraft)) {
      score += 20;
    }
    
    // +20 if location is mentioned
    if (/\b(location|place|at|near|in front of|behind|address|road|street|market)\b/.test(lowerCaseDraft)) {
      score += 20;
    }
    
    // +20 if incident type is identifiable (theft, robbery, assault, etc.)
    if (/\b(theft|stole|robbery|robbed|assault|attacked|hit|punched|harassment|harassed|threat|threatened|snatched|lost|missing)\b/.test(lowerCaseDraft)) {
      score += 20;
    }

    // +20 if accused description exists
    if (/\b(accused|person|man|woman|boy|girl|they|he|she|unknown person)\b/.test(lowerCaseDraft)) {
      score += 20;
    }

    // +20 if property loss or harm is mentioned
    if (/\b(property|item|cash|money|phone|wallet|jewelry|bag|bike|car|loss|harm|injured|hurt|bleeding|pain)\b/.test(lowerCaseDraft)) {
      score += 20;
    }

    return { completenessScore: Math.min(100, score) };
  }
);
