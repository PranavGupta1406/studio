'use server';

/**
 * @fileOverview FIR draft generation flow.
 *
 * - generateFirDraft - A function that generates a FIR draft based on incident content.
 * - GenerateFirDraftInput - The input type for the generateFirDraft function.
 * - GenerateFirDraftOutput - The return type for the generateFirDraft function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFirDraftInputSchema = z.object({
  incidentContent: z
    .string()
    .describe('The description of the incident provided by the user.'),
});
export type GenerateFirDraftInput = z.infer<typeof GenerateFirDraftInputSchema>;

const GenerateFirDraftOutputSchema = z.object({
  firDraft: z.string().describe('The generated FIR draft.'),
});
export type GenerateFirDraftOutput = z.infer<typeof GenerateFirDraftOutputSchema>;

export async function generateFirDraft(input: GenerateFirDraftInput): Promise<GenerateFirDraftOutput> {
  return generateFirDraftFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFirDraftPrompt',
  input: {schema: GenerateFirDraftInputSchema},
  output: {schema: GenerateFirDraftOutputSchema},
  prompt: `Convert the following incident description into a realistic Indian police FIR.
Write it in plain, natural language as if recorded by a police officer.
Avoid legal jargon, avoid excessive formality, and do not sound like an AI.
Keep it factual, human, and slightly imperfect.
Do not add unnecessary sections or IPC references unless clearly implied.

Incident Description: {{{incidentContent}}}`,
});

const generateFirDraftFlow = ai.defineFlow(
  {
    name: 'generateFirDraftFlow',
    inputSchema: GenerateFirDraftInputSchema,
    outputSchema: GenerateFirDraftOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
