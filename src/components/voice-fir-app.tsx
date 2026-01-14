'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { Mic, MicOff, FileText, Download, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { generateFirDraft } from '@/ai/flows/generate-fir-draft';
import { computeCompletenessScore } from '@/ai/flows/compute-completeness-score';
import { determineSeriousnessLevel } from '@/ai/flows/determine-seriousness-level';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StepIndicator } from '@/components/step-indicator';
import { SeriousnessBadge, type Seriousness } from '@/components/seriousness-badge';
import { generatePdf } from '@/lib/pdf-generator';
import { cn } from '@/lib/utils';

const CircularProgress = ({ value }: { value: number }) => {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const progressColor = value < 40 ? 'text-destructive' : value < 70 ? 'text-yellow-500' : 'text-green-500';

  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      <svg className="absolute w-full h-full -rotate-90">
        <circle className="text-secondary" strokeWidth="8" stroke="currentColor" fill="transparent" r={radius} cx="64" cy="64" />
        <circle
          className={cn("transition-all duration-500 ease-in-out", progressColor)}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="64"
          cy="64"
        />
      </svg>
      <span className="text-2xl font-bold text-foreground">{value}</span>
    </div>
  );
};


export function VoiceFirApp() {
  const [incidentContent, setIncidentContent] = useState('');
  const [firDraft, setFirDraft] = useState('');
  const [editableFirDraft, setEditableFirDraft] = useState('');
  const [completenessScore, setCompletenessScore] = useState(0);
  const [seriousnessLevel, setSeriousnessLevel] = useState<Seriousness | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<'speak' | 'review' | 'download'>('speak');

  const { toast } = useToast();
  const { transcript, isListening, startListening, stopListening, hasRecognitionSupport } = useSpeechRecognition();
  
  const firDraftRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (transcript) {
      setIncidentContent(prev => (prev ? `${prev} ${transcript}`.trim() : transcript));
    }
  }, [transcript]);
  
  useEffect(() => {
    const analyzeDraft = async () => {
        if (firDraft && firDraft.length > 40) {
            try {
                const [scoreResult, seriousnessResult] = await Promise.all([
                    computeCompletenessScore({ firDraft }),
                    determineSeriousnessLevel({ firDraft }),
                ]);
                setCompletenessScore(scoreResult.completenessScore);
                setSeriousnessLevel(seriousnessResult.seriousnessLevel as Seriousness);
                if (currentStep === 'speak') {
                    setCurrentStep('review');
                    setTimeout(() => firDraftRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                }
            } catch (error) {
                console.error("Error analyzing draft:", error);
                toast({
                    variant: "destructive",
                    title: "Analysis Failed",
                    description: "Could not compute score and seriousness. Please try again.",
                });
            }
        } else if (firDraft) {
            setCompletenessScore(0);
        }
    };
    analyzeDraft();
}, [firDraft, toast, currentStep]);

useEffect(() => {
    const analyzeEditedDraft = async () => {
        if (editableFirDraft && editableFirDraft.length > 40) {
            try {
                const [scoreResult, seriousnessResult] = await Promise.all([
                    computeCompletenessScore({ firDraft: editableFirDraft }),
                    determineSeriousnessLevel({ firDraft: editableFirDraft }),
                ]);
                setCompletenessScore(scoreResult.completenessScore);
                setSeriousnessLevel(seriousnessResult.seriousnessLevel as Seriousness);
            } catch (error) {
                // Silently fail on edit, don't bother user with toasts
                console.error("Error analyzing edited draft:", error);
            }
        } else if (editableFirDraft) {
            setCompletenessScore(0);
            setSeriousnessLevel(null);
        }
    };

    const timeoutId = setTimeout(analyzeEditedDraft, 500); // Debounce analysis
    return () => clearTimeout(timeoutId);
}, [editableFirDraft]);

  const handleGenerate = async () => {
    if (incidentContent.trim().length <= 30) {
      toast({
        variant: "destructive",
        title: "Input Too Short",
        description: "Please provide more details about the incident before generating a draft.",
      });
      return;
    }
    setIsGenerating(true);
    setFirDraft('');
    setEditableFirDraft('');
    setCompletenessScore(0);
    setSeriousnessLevel(null);
    try {
      const result = await generateFirDraft({ incidentContent });
      setFirDraft(result.firDraft);
      setEditableFirDraft(result.firDraft);
    } catch (error) {
      console.error("Error generating FIR draft:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not generate the FIR draft. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    generatePdf(editableFirDraft);
    setCurrentStep('download');
  };

  const isGenerateDisabled = useMemo(() => {
    return isGenerating || incidentContent.trim().length <= 30;
  }, [isGenerating, incidentContent]);
  
  const isDownloadDisabled = useMemo(() => {
    return !editableFirDraft || completenessScore < 40;
  }, [editableFirDraft, completenessScore]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-20">
        <div className="container mx-auto p-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-headline">VoiceFIR</h1>
            <p className="text-sm text-primary-foreground/80">Your Voice for Justice</p>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <StepIndicator currentStep={currentStep} />
          </div>
          
          <div id="speak-section" className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold font-headline text-primary">Record Your Complaint</h2>
            <p className="text-muted-foreground">No forms. No legal language. Speak freely.</p>
            {isClient && hasRecognitionSupport && (
                <div className="flex justify-center py-6">
                    <Button
                    size="lg"
                    className={cn(
                        'rounded-full h-28 w-28 transition-all duration-300 shadow-lg',
                        isListening ? 'bg-destructive hover:bg-destructive/90 animate-pulse' : 'bg-accent hover:bg-accent/90'
                    )}
                    onClick={isListening ? stopListening : startListening}
                    aria-label={isListening ? 'Stop Recording' : 'Start Recording'}
                    >
                    {isListening ? <MicOff size={48} /> : <Mic size={48} />}
                    </Button>
                </div>
            )}
             {isClient && (
                <p className="text-sm text-muted-foreground">
                    {hasRecognitionSupport
                        ? (isListening ? "Listening..." : "Tap to Speak")
                        : "Voice not supported. Please type."}
                </p>
             )}
          </div>
          
          <div className="space-y-4">
              <label htmlFor="incident-textarea" className="font-semibold text-lg text-primary">You can speak, type, or do both.</label>
              <Textarea
                id="incident-textarea"
                placeholder="Type your incident in your own words. No legal language needed."
                value={incidentContent}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setIncidentContent(e.target.value)}
                className="min-h-[180px] text-base bg-card border-border focus:ring-accent"
                rows={7}
              />
              <div className="flex justify-center pt-4">
                <Button size="lg" onClick={handleGenerate} disabled={isGenerateDisabled}>
                  {isGenerating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  Generate FIR Draft
                </Button>
              </div>
          </div>

          {(isGenerating || editableFirDraft) && (
            <div ref={firDraftRef} className="mt-16 pt-8 border-t-2 border-dashed">
                {isGenerating && !editableFirDraft && (
                    <div className="flex flex-col items-center justify-center text-center space-y-4 p-8">
                        <Loader2 className="h-12 w-12 animate-spin text-primary"/>
                        <p className="text-lg font-medium text-muted-foreground">Generating your FIR draft...</p>
                    </div>
                )}
                {editableFirDraft && (
                  <Card className="shadow-lg border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <FileText className="text-primary"/>
                        Review Your FIR Draft
                      </CardTitle>
                      <CardDescription>This is an AI-generated draft. Please review and edit it carefully before downloading.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div className="flex flex-col items-center space-y-2">
                           <h3 className="font-semibold text-center">FIR Completeness</h3>
                           <CircularProgress value={completenessScore} />
                        </div>
                        <div className="flex flex-col items-center space-y-2">
                          <h3 className="font-semibold">Seriousness Level</h3>
                          <SeriousnessBadge level={seriousnessLevel} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="fir-draft-editor" className="font-semibold">Edit Draft</label>
                        <Textarea
                           id="fir-draft-editor"
                           value={editableFirDraft}
                           onChange={(e) => setEditableFirDraft(e.target.value)}
                           className="min-h-[300px] text-base font-serif leading-relaxed p-4 bg-white border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div className="text-center space-y-4">
                        <p className="text-sm text-muted-foreground italic">Draft for review before official submission.</p>
                        <Button size="lg" onClick={handleDownload} disabled={isDownloadDisabled}>
                          <Download className="mr-2 h-5 w-5" />
                          Download FIR as PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
            </div>
          )}
        </div>
      </main>

      <footer className="text-center p-6 text-muted-foreground text-sm border-t">
        <p>&copy; {new Date().getFullYear()} VoiceFIR. All Rights Reserved.</p>
        <p>This is a computer-generated draft for review before official submission.</p>
      </footer>
    </div>
  );
}
