import { config } from 'dotenv';
config();

import '@/ai/flows/determine-seriousness-level.ts';
import '@/ai/flows/compute-completeness-score.ts';
import '@/ai/flows/generate-fir-draft.ts';