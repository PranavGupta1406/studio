'use client';

import { Mic, Loader2, FileText, CheckCircle, ChevronRight, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type StepId = 'record' | 'processing' | 'draft' | 'validated';

interface ProcessFlowHeaderProps {
  currentStep: StepId;
}

const flowSteps: { id: StepId; name: string; icon: React.ElementType }[] = [
  { id: 'record', name: 'Record Complaint', icon: Mic },
  { id: 'processing', name: 'Processing', icon: Settings2 },
  { id: 'draft', name: 'FIR Draft', icon: FileText },
  { id: 'validated', name: 'Validate & Download', icon: CheckCircle },
];

export function ProcessFlowHeader({ currentStep }: ProcessFlowHeaderProps) {
  const currentStepIndex = flowSteps.findIndex(step => step.id === currentStep);

  return (
    <nav aria-label="Process Flow" className="w-full max-w-4xl">
      <ol role="list" className="flex items-center justify-center">
        {flowSteps.map((step, stepIdx) => (
          <li key={step.name} className={cn('relative flex items-center', { 'flex-1': stepIdx < flowSteps.length -1 })}>
            <div className="flex items-center gap-3 p-2 transition-all duration-500">
              <div
                className={cn(
                  "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                  stepIdx < currentStepIndex ? 'bg-green-600' : (stepIdx === currentStepIndex ? 'bg-accent' : 'bg-secondary')
                )}
              >
                {stepIdx < currentStepIndex ? 
                    <CheckCircle className="h-6 w-6 text-white" /> :
                    <step.icon
                        className={cn(
                            "h-6 w-6 transition-colors duration-300",
                            stepIdx === currentStepIndex ? 'text-accent-foreground' : 'text-secondary-foreground',
                            step.id === 'processing' && stepIdx === currentStepIndex && 'animate-spin'
                        )}
                        aria-hidden="true"
                    />
                }
              </div>
              <div className="hidden md:flex flex-col">
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

            {stepIdx < flowSteps.length - 1 && (
              <div className="flex-1 h-0.5 bg-secondary relative">
                <div 
                    className={cn(
                        "absolute top-0 left-0 h-full bg-green-600 transition-all duration-500 ease-in-out",
                        stepIdx < currentStepIndex ? 'w-full' : 'w-0'
                    )}
                />
              </div>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
