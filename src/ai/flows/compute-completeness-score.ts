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
  async input => {
    const {
      firDraft,
    } = input;

    let score = 0;

    if (firDraft.length < 40) {
      score = 0;
    } else {
      if (firDraft.toLowerCase().includes('time') || firDraft.toLowerCase().includes('date')) {
        score += 20;
      }
      if (firDraft.toLowerCase().includes('location')) {
        score += 20;
      }
      if (
        firDraft.toLowerCase().includes('theft') ||
        firDraft.toLowerCase().includes('robbery') ||
        firDraft.toLowerCase().includes('assault')
      ) {
        score += 20;
      }
      if (
        firDraft.toLowerCase().includes('accused') ||
        firDraft.toLowerCase().includes('unknown persons')
      ) {
        score += 20;
      }
      if (
        firDraft.toLowerCase().includes('request') ||
        firDraft.toLowerCase().includes('statement') ||
        firDraft.toLowerCase().includes('victim')
      ) {
        score += 20;
      }
    }

    return {completenessScore: score};
  }
);
