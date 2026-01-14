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

const determineSeriousnessLevelFlow = ai.defineFlow(
  {
    name: 'determineSeriousnessLevelFlow',
    inputSchema: DetermineSeriousnessLevelInputSchema,
    outputSchema: DetermineSeriousnessLevelOutputSchema,
  },
  async ({ firDraft }) => {
    const lowerCaseDraft = firDraft.toLowerCase();
    
    const highKeywords = ['robbery', 'assault', 'weapon', 'violence', 'injured', 'attacked', 'kidnapped'];
    const mediumKeywords = ['theft', 'threat', 'harassment', 'stolen', 'snatched', 'break-in'];
    const lowKeywords = ['lost item', 'complaint', 'missing', 'lost my'];

    if (highKeywords.some(keyword => lowerCaseDraft.includes(keyword))) {
      return { seriousnessLevel: 'HIGH' };
    }
    if (mediumKeywords.some(keyword => lowerCaseDraft.includes(keyword))) {
      return { seriousnessLevel: 'MEDIUM' };
    }
    if (lowKeywords.some(keyword => lowerCaseDraft.includes(keyword))) {
      return { seriousnessLevel: 'LOW' };
    }
    
    return { seriousnessLevel: 'LOW' };
  }
);
