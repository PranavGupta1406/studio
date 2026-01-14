'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import type { ChangeEvent } from 'react';
import { Mic, MicOff, FileText, Download, Loader2, ShieldCheck, FilePlus, BrainCircuit } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { generateFirDraft } from '@/ai/flows/generate-fir-draft';
import { computeCompletenessScore } from '@/ai/flows/compute-completeness-score';
import { determineSeriousnessLevel } from '@/ai/flows/determine-seriousness-level';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ProcessFlowHeader } from '@/components/process-flow-header';
import { SeriousnessBadge, type Seriousness } from '@/components/seriousness-badge';
import { generatePdf } from '@/lib/pdf-generator';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

type Step = 'record' | 'processing' | 'draft' | 'validated';

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
  const [completenessScore, setCompletenessScore] = useState<number | null>(null);
  const [seriousnessLevel, setSeriousnessLevel] = useState<Seriousness | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('record');
  const [isPending, startTransition] = useTransition();

  const { toast } = useToast();
  
  const handleTranscript = (text: string) => {
      setIncidentContent(prev => (prev ? `${prev} ${text}`.trim() : text));
  }

  const { isListening, startListening, stopListening, hasRecognitionSupport } = useSpeechRecognition({
      onTranscript: handleTranscript,
  });
  
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    document.body.style.overflow = 'hidden';
    return () => {
        document.body.style.overflow = 'auto';
    }
  }, []);
  
  const handleToggleListening = () => {
      if(isListening) {
          stopListening();
      } else {
          startListening();
      }
  }


  const handleGenerate = async () => {
    if (incidentContent.trim().length <= 30) {
      toast({
        variant: "destructive",
        title: "Input Too Short",
        description: "Please provide more details about the incident before generating a draft.",
      });
      return;
    }
    startTransition(() => {
        setCurrentStep('processing');
        setIsGenerating(true);
        setFirDraft('');
        setEditableFirDraft('');
        setCompletenessScore(null);
        setSeriousnessLevel(null);
    });

    try {
      const result = await generateFirDraft({ incidentContent });
      setFirDraft(result.firDraft);
      setEditableFirDraft(result.firDraft);
      setCurrentStep('draft');
    } catch (error) {
      console.error("Error generating FIR draft:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not generate the FIR draft. Please try again.",
      });
      setCurrentStep('record'); // Go back to input step on failure
    } finally {
      setIsGenerating(false);
    }
  };

  const handleValidation = async () => {
    if (!editableFirDraft) return;
    setIsValidating(true);
    try {
        const [scoreResult, seriousnessResult] = await Promise.all([
            computeCompletenessScore({ firDraft: editableFirDraft }),
            determineSeriousnessLevel({ firDraft: editableFirDraft }),
        ]);
        setCompletenessScore(scoreResult.completenessScore);
        setSeriousnessLevel(seriousnessResult.seriousnessLevel as Seriousness);
        setCurrentStep('validated');
        toast({
            title: "Validation Complete",
            description: `FIR Completeness: ${scoreResult.completenessScore}%. Seriousness: ${seriousnessResult.seriousnessLevel}.`,
        });
    } catch (error) {
        console.error("Error validating draft:", error);
        toast({
            variant: "destructive",
            title: "Validation Failed",
            description: "Could not analyze the FIR draft. Please try again.",
        });
    } finally {
        setIsValidating(false);
    }
  };


  const handleDownload = () => {
    generatePdf(editableFirDraft);
  };
  
  const handleStartNew = () => {
    setIncidentContent('');
    setFirDraft('');
    setEditableFirDraft('');
    setCompletenessScore(null);
    setSeriousnessLevel(null);
    setCurrentStep('record');
  }

  const isGenerateDisabled = useMemo(() => {
    return isGenerating || incidentContent.trim().length === 0;
  }, [isGenerating, incidentContent]);
  
  const isDownloadDisabled = useMemo(() => {
    return currentStep !== 'validated' || isValidating;
  }, [currentStep, isValidating]);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <header className="bg-primary text-primary-foreground shadow-md shrink-0 z-10">
        <div className="container mx-auto p-4 flex flex-col items-center justify-center gap-4">
          <div>
            <h1 className="text-2xl font-bold font-headline text-center">VoiceFIR</h1>
            <p className="text-sm text-primary-foreground/80 text-center">Your Voice for Justice</p>
          </div>
          <ProcessFlowHeader currentStep={currentStep} />
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center p-4 md:p-6 overflow-hidden">
        <div className="w-full max-w-3xl mx-auto h-full flex flex-col">
            {currentStep === 'record' && (
              <ScrollArea className="flex-grow w-full">
                <div className="flex flex-col justify-center items-center text-center space-y-4 animate-in fade-in-50 duration-500 p-1 min-h-[calc(100vh-220px)]">
                    <div className='flex flex-col items-center justify-center space-y-4'>
                        <h2 className="text-3xl font-bold font-headline text-primary">Record Your Complaint</h2>
                        <p className="text-muted-foreground">No forms. No legal language. Speak freely.</p>
                        {isClient && hasRecognitionSupport && (
                            <div className="flex justify-center py-2">
                                <Button
                                    size="lg"
                                    className={cn(
                                        'rounded-full h-28 w-28 transition-all duration-300 shadow-lg',
                                        isListening ? 'bg-destructive hover:bg-destructive/90 animate-pulse' : 'bg-accent hover:bg-accent/90'
                                    )}
                                    onClick={handleToggleListening}
                                    aria-label={isListening ? 'Stop Recording' : 'Start Recording'}
                                >
                                {isListening ? <MicOff size={48} /> : <Mic size={48} />}
                                </Button>
                            </div>
                        )}
                        {isClient && (
                            <p className="text-sm text-muted-foreground">
                                {hasRecognitionSupport ? (isListening ? "Listening... Click to stop." : "Tap to Speak") : "Voice not supported. Please type."}
                            </p>
                        )}
                        <div className="w-full space-y-4 pt-2">
                            <label htmlFor="incident-textarea" className="font-semibold text-lg text-primary sr-only">You can speak, type, or do both.</label>
                            <Textarea
                                id="incident-textarea"
                                placeholder="Or type your incident in your own words here..."
                                value={incidentContent}
                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setIncidentContent(e.target.value)}
                                className="min-h-[120px] text-base bg-card border-border focus:ring-accent"
                                rows={5}
                            />
                        </div>
                    </div>
                    <div className="flex justify-center py-4">
                        <Button size="lg" onClick={handleGenerate} disabled={isGenerateDisabled}>
                            <BrainCircuit className="mr-2 h-5 w-5" />
                            Generate FIR Draft
                        </Button>
                    </div>
                </div>
              </ScrollArea>
            )}

            {currentStep === 'processing' && (
                <div className="flex flex-col items-center justify-center text-center space-y-4 p-8 animate-in fade-in-50 duration-500 h-full">
                    <Loader2 className="h-16 w-16 animate-spin text-primary"/>
                    <h2 className="text-2xl font-medium text-foreground">Processing your complaint securely…</h2>
                    <p className="text-muted-foreground">Structuring FIR as per Indian legal format.</p>
                </div>
            )}

            {(currentStep === 'draft' || currentStep === 'validated') && (
                  <ScrollArea className="h-full">
                    <Card className="shadow-lg border-primary/20 animate-in fade-in-50 duration-500 w-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <FileText className="text-primary"/>
                          Review, Validate & Download Your FIR
                        </CardTitle>
                        <CardDescription>This is an AI-generated draft. Please review and edit it carefully, then validate to enable download.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                          <div className="grid md:grid-cols-2 gap-6 items-center">
                              <div className="flex flex-col items-center space-y-2">
                                  <h3 className="font-semibold text-center">FIR Completeness</h3>
                                  {completenessScore !== null ? <CircularProgress value={completenessScore} /> : <div className="w-32 h-32 flex items-center justify-center text-muted-foreground">Not validated</div>}
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
                                  onChange={(e) => {
                                      setEditableFirDraft(e.target.value);
                                      if (currentStep === 'validated') {
                                        setCurrentStep('draft');
                                      }
                                      setCompletenessScore(null);
                                      setSeriousnessLevel(null);
                                  }}
                                  className="min-h-[250px] text-base font-serif leading-relaxed p-4 bg-white border-gray-300 rounded-md"
                              />
                          </div>
                      </CardContent>
                      <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4">
                          <Button variant="outline" onClick={handleStartNew}>
                              <FilePlus className="mr-2 h-5 w-5" />
                              Start New FIR
                          </Button>
                          <div className="flex gap-4">
                             <Button size="lg" variant="secondary" onClick={handleValidation} disabled={isValidating || currentStep === 'validated'}>
                                  {isValidating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShieldCheck className="mr-2 h-5 w-5" />}
                                  Validate FIR
                              </Button>
                              <Button size="lg" onClick={handleDownload} disabled={isDownloadDisabled}>
                                  <Download className="mr-2 h-5 w-5" />
                                  Download PDF
                              </Button>
                          </div>
                      </CardFooter>
                    </Card>
                  </ScrollArea>
            )}
        </div>
      </main>

      <footer className="text-center p-3 text-muted-foreground text-xs border-t shrink-0 z-10">
        <p>&copy; {new Date().getFullYear()} VoiceFIR. All Rights Reserved. AI-generated draft for review.</p>
      </footer>
    </div>
  );
}
