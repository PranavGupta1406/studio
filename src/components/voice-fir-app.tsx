'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { StepIndicator } from '@/components/step-indicator';
import { SeriousnessBadge, type Seriousness } from '@/components/seriousness-badge';
import { generatePdf } from '@/lib/pdf-generator';

export function VoiceFirApp() {
  const [incidentContent, setIncidentContent] = useState('');
  const [firDraft, setFirDraft] = useState('');
  const [completenessScore, setCompletenessScore] = useState(0);
  const [seriousnessLevel, setSeriousnessLevel] = useState<Seriousness | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<'speak' | 'review' | 'download'>('speak');

  const { toast } = useToast();
  const { transcript, isListening, startListening, stopListening, hasRecognitionSupport } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setIncidentContent(prev => (prev ? `${prev} ${transcript}` : transcript));
    }
  }, [transcript]);

  useEffect(() => {
    const analyzeDraft = async () => {
      if (firDraft) {
        try {
          const [scoreResult, seriousnessResult] = await Promise.all([
            computeCompletenessScore({ firDraft }),
            determineSeriousnessLevel({ firDraft }),
          ]);
          setCompletenessScore(scoreResult.completenessScore);
          setSeriousnessLevel(seriousnessResult.seriousnessLevel as Seriousness);
          setCurrentStep('review');
        } catch (error) {
          console.error("Error analyzing draft:", error);
          toast({
            variant: "destructive",
            title: "Analysis Failed",
            description: "Could not compute score and seriousness. Please try again.",
          });
        }
      }
    };
    analyzeDraft();
  }, [firDraft, toast]);

  const handleGenerate = async () => {
    if (incidentContent.trim().length === 0) {
      toast({
        variant: "destructive",
        title: "Input Required",
        description: "Please speak or type the incident before generating an FIR.",
      });
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateFirDraft({ incidentContent });
      setFirDraft(result.firDraft);
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
    generatePdf(firDraft, completenessScore, seriousnessLevel);
    setCurrentStep('download');
  };

  const isDownloadDisabled = useMemo(() => {
    return !firDraft || completenessScore < 40;
  }, [firDraft, completenessScore]);

  const progressColor = useMemo(() => {
    if (completenessScore < 40) return 'bg-destructive';
    if (completenessScore < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  }, [completenessScore]);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-primary text-primary-foreground p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold font-headline">VoiceFIR</h1>
          <p className="text-sm text-primary-foreground/80">Your Voice for Justice</p>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <StepIndicator currentStep={currentStep} />
          
          <Card className="mt-8 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="text-primary" />
                Describe the Incident
              </CardTitle>
              <CardDescription>
                Use your voice or type below. Describe what happened in your own words.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <Button
                  size="lg"
                  className={`rounded-full h-20 w-20 ${isListening ? 'bg-destructive' : 'bg-accent hover:bg-accent/90'}`}
                  onClick={isListening ? stopListening : startListening}
                  disabled={!hasRecognitionSupport}
                  aria-label={isListening ? 'Stop recording' : 'Start recording'}
                >
                  {isListening ? <MicOff size={32} /> : <Mic size={32} />}
                </Button>
                {!hasRecognitionSupport && (
                  <p className="text-sm text-destructive">Voice input not supported in this browser. Please type instead.</p>
                )}
              </div>

              <Textarea
                placeholder="Speak or type what happened. No legal language needed."
                value={incidentContent}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setIncidentContent(e.target.value)}
                className="min-h-[150px] text-base"
                rows={6}
              />
              <div className="flex justify-end">
                <Button onClick={handleGenerate} disabled={isGenerating || incidentContent.trim().length === 0}>
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Generate FIR Draft
                </Button>
              </div>
            </CardContent>
          </Card>

          {firDraft && (
            <Card className="mt-8 shadow-lg">
              <CardHeader>
                <CardTitle>Generated FIR Draft</CardTitle>
                <CardDescription>This is an AI-generated draft. Please review it carefully.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="font-semibold">Completeness Score: {completenessScore}/100</h3>
                    <Progress value={completenessScore} indicatorClassName={progressColor} />
                    <p className="text-sm text-muted-foreground">A score above 40 is recommended for filing.</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Seriousness Level</h3>
                    <SeriousnessBadge level={seriousnessLevel} />
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-md border">
                  <pre className="whitespace-pre-wrap break-words font-sans text-sm">{firDraft}</pre>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleDownload} disabled={isDownloadDisabled}>
                    <Download className="mr-2 h-4 w-4" />
                    Download FIR PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <footer className="text-center p-4 text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} VoiceFIR. All Rights Reserved. Disclaimer: This is an AI-generated draft for review purposes only.</p>
      </footer>
    </div>
  );
}
