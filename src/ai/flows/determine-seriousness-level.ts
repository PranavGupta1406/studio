'use server';

/**
 * @fileOverview Determines the seriousness level of an incident based on keywords in the FIR draft.
 *
 * - determineSeriousnessLevel - A function that determines the seriousness level of the incident.
 * - DetermineSeriousnessLevelInput - The input type for the determineSeriousnessLevel function.
 * - DetermineSeriousnessLevelOutput - The return type for the determineSeriousnessLevel function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetermineSeriousnessLevelInputSchema = z.object({
  firDraft: z
    .string()
    .describe('The FIR draft to determine the seriousness level from.'),
});
export type DetermineSeriousnessLevelInput = z.infer<
  typeof DetermineSeriousnessLevelInputSchema
>;

const DetermineSeriousnessLevelOutputSchema = z.object({
  seriousnessLevel: z
    .enum(['HIGH', 'MEDIUM', 'LOW'])
    .describe('The seriousness level of the incident.'),
});
export type DetermineSeriousnessLevelOutput = z.infer<
  typeof DetermineSeriousnessLevelOutputSchema
>;

export async function determineSeriousnessLevel(
  input: DetermineSeriousnessLevelInput
): Promise<DetermineSeriousnessLevelOutput> {
  return determineSeriousnessLevelFlow(input);
}

const prompt = ai.definePrompt({
  name: 'determineSeriousnessLevelPrompt',
  input: {schema: DetermineSeriousnessLevelInputSchema},
  output: {schema: DetermineSeriousnessLevelOutputSchema},
  prompt: `Based on the following FIR draft, determine the seriousness level of the incident. The seriousness level can be HIGH, MEDIUM, or LOW. Consider keywords such as 'threatened', 'assault', 'weapon', 'robbery', 'injured', 'violence' for HIGH, 'theft', 'stolen', 'snatched', 'break-in' for MEDIUM, and 'lost item', 'missing', 'damage only' for LOW.

FIR Draft: {{{firDraft}}}`,
});

const determineSeriousnessLevelFlow = ai.defineFlow(
  {
    name: 'determineSeriousnessLevelFlow',
    inputSchema: DetermineSeriousnessLevelInputSchema,
    outputSchema: DetermineSeriousnessLevelOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
