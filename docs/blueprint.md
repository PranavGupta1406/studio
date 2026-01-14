# **App Name**: VoiceFIR: Your Voice for Justice

## Core Features:

- Voice-to-Text Input: Captures user speech via the Web Speech API (en-IN) and populates the incident description textarea. Displays 'Voice input not supported' message on incompatible browsers.
- Text-based Incident Input: Allows users to type the incident description directly into a textarea.
- FIR Draft Generation: Generates a structured FIR draft based on the incident content, including date, time, location, incident description, accused (or Unknown Persons), Victim Statement, and closing request for action.
- Completeness Score Calculation: Calculates a completeness score based on the presence of key elements (time/date, location, crime, accused, request/statement) within the FIR draft. Score is 0 if firDraft length is less than 40 characters.
- Seriousness Level Determination: Determines the seriousness level (HIGH, MEDIUM, LOW) based on keywords found within the FIR draft. (e.g., threatened = HIGH, theft = MEDIUM, lost item = LOW)
- PDF Download: Enables a 'Download FIR PDF' button when a FIR draft exists and the completeness score is >= 40. The PDF includes FIR ID, Date & Time, FIR Content, and a disclaimer: 'AI-generated draft for review'.

## Style Guidelines:

- Primary color: Dark Blue (#2c3e50) for a professional, government-tech feel.
- Background color: Light Gray (#f0f2f5) for a clean interface.
- Accent color: Teal (#3498db) to highlight key interactive elements and provide visual interest.
- Body and headline font: 'Inter' (sans-serif) for a modern, objective look suitable for both headlines and body text.
- Use clear, simple icons representing steps (Speak, Review, Download) and actions (microphone, download).
- Implement a step indicator at the top (Speak -> Review -> Download). Centralize the microphone button and text area. Display the FIR preview, completeness score, and seriousness level in a card format.
- Avoid unnecessary animations to ensure a stable and fast demo. Use subtle transitions for state changes.