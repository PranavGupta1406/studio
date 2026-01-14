'use client';

import { Mic, FileText, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 'speak' | 'review' | 'download';

interface StepIndicatorProps {
  currentStep: Step;
}

const steps: { id: Step; name: string; icon: React.ElementType }[] = [
  { id: 'speak', name: 'Speak or Type', icon: Mic },
  { id: 'review', name: 'Review & Analyze', icon: FileText },
  { id: 'download', name: 'Download', icon: Download },
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li key={step.name} className={cn('relative', { 'flex-1': stepIdx !== steps.length - 1 })}>
            <div className="flex items-center">
              <div
                className={cn(
                  "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
                  stepIdx <= currentStepIndex ? 'bg-accent' : 'bg-secondary'
                )}
              >
                <step.icon
                  className={cn(
                    "h-6 w-6",
                    stepIdx <= currentStepIndex ? 'text-accent-foreground' : 'text-secondary-foreground'
                  )}
                  aria-hidden="true"
                />
              </div>
              <div className="ml-4 hidden md:flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">Step {stepIdx + 1}</span>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    stepIdx <= currentStepIndex ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.name}
                </span>
              </div>
            </div>

            {stepIdx !== steps.length - 1 && (
              <div className="absolute inset-0 top-4 ml-10 w-full" aria-hidden="true">
                  <div className={cn("h-0.5 w-full", stepIdx < currentStepIndex ? 'bg-accent' : 'bg-border')} />
              </div>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
