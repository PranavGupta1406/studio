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
  prompt: `You are a helpful AI assistant that generates a structured FIR (First Information Report) draft based on the incident description provided by the user. The FIR draft must include the following sections:\n\n- Date & Time\n- Location\n- Incident Description\n- Accused (or Unknown Persons)\n- Victim Statement\n- Closing request for action\n\nUse the following incident description to generate the FIR draft:\n\nIncident Description: {{{incidentContent}}}`,
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
