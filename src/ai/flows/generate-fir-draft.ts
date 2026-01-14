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
  prompt: `
You are a system for generating a First Information Report (FIR) for Indian police.
Your output MUST be ONLY in ENGLISH.
Your tone MUST be FORMAL and LEGAL.
You MUST follow the provided template EXACTLY.
Do NOT change headings, numbering, or structure.
If a detail is missing from the user's input, you MUST write "Not disclosed at the time of reporting" in the relevant field.
Do NOT invent facts, names, or details.

User's Incident Description:
"{{{incidentContent}}}"

---
USE THIS EXACT FIR TEMPLATE
---

FIRST INFORMATION REPORT (FIR)
(Under Section 154 Cr.P.C.)

FIR No.: [Auto-generated or Placeholder]
Date: [Current Date]
Time: [Current Time]

To,  
The Station House Officer,  
[Name of Police Station],  
[City, State].

Subject: Registration of First Information Report regarding an incident of [Nature of Offence].

Respected Sir/Madam,

I, the undersigned, wish to report an incident of [Nature of Offence] that occurred on [Date of Incident], details of which are as follows:

1. Complainant Details:  
Name: [Complainant’s Full Name]  
Address: [Complainant’s Address]  
Contact Information: [Mobile Number / Email]

2. Accused Details:  
Identity: [Known / Unknown]  
Description: [Physical description, clothing, vehicle, if any]

3. Date and Time of Incident:  
Date: [Date]  
Time: [Time]

4. Location of Incident:  
[Exact or approximate location]

5. Nature of Offence:  
[Applicable IPC section if known, else describe offence]

6. Detailed Incident Description:  
[A clear, chronological, factual narration derived from the user’s input. No dramatic language. No assumptions.]

7. Evidence / Stolen / Relevant Items (if any):  
[List items or write “Not disclosed at the time of reporting”.]

8. Witnesses (if any):  
[Names or “No known witnesses at the time of reporting”.]

I kindly request you to take necessary legal action and register this First Information Report. I am willing to cooperate fully with the investigation.

Thanking you,

Yours sincerely,  
[Complainant’s Name]  
[Signature / Digital]

Disclaimer: This is an AI-generated FIR draft for review purposes only and is not a legally registered document.
`,
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
