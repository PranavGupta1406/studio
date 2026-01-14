'use client';

import { Mic, FileText, Download, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 'speak' | 'review' | 'download';

interface StepIndicatorProps {
  currentStep: Step;
}

const steps: { id: Step; name: string; icon: React.ElementType }[] = [
  { id: 'speak', name: 'Record Complaint', icon: Mic },
  { id: 'review', name: 'Generate Draft', icon: BrainCircuit },
  { id: 'download', name: 'Validate & Download', icon: Download },
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li key={step.name} className={cn('relative', { 'flex-1': stepIdx !== steps.length - 1 })}>
            <div className="flex items-center transition-all duration-500">
              <div
                className={cn(
                  "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                  stepIdx <= currentStepIndex ? 'bg-accent' : 'bg-secondary'
                )}
              >
                <step.icon
                  className={cn(
                    "h-6 w-6 transition-colors duration-300",
                    stepIdx <= currentStepIndex ? 'text-accent-foreground' : 'text-secondary-foreground'
                  )}
                  aria-hidden="true"
                />
              </div>
              <div className="ml-4 hidden md:flex flex-col">
                <span
                  className={cn(
                    "text-sm font-semibold transition-colors duration-300",
                    stepIdx <= currentStepIndex ? 'text-primary-foreground' : 'text-primary-foreground/60'
                  )}
                >
                  {step.name}
                </span>
              </div>
            </div>

            {stepIdx < steps.length - 1 && (
              <>
                {/* Desktop Line */}
                <div className="absolute left-5 top-1/2 -z-10 hidden h-0.5 w-[calc(100%-2.5rem)] translate-y-1/2 md:block" aria-hidden="true">
                    <div className={cn("h-full bg-secondary transition-all duration-500", stepIdx < currentStepIndex ? 'w-full bg-accent' : 'w-0')} />
                </div>
                 {/* Mobile Line */}
                 <div className="absolute left-5 top-10 -z-10 h-[calc(100%-2.5rem)] w-0.5 md:hidden" aria-hidden="true">
                    <div className={cn("h-full w-full bg-secondary transition-all duration-500", stepIdx < currentStepIndex ? 'h-full bg-accent' : 'h-0')} />
                </div>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
