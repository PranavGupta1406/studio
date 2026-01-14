'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from './use-toast';

interface SpeechRecognitionHook {
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  hasRecognitionSupport: boolean;
}

interface UseSpeechRecognitionOptions {
  onTranscript: (transcript: string) => void;
}

let recognition: SpeechRecognition | null = null;
const getRecognition = () => {
    if (typeof window === 'undefined') return null;
    if (recognition) return recognition;

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true; 
        recognition.interimResults = true;
        recognition.lang = 'en-IN';
        return recognition;
    }
    return null;
}

export function useSpeechRecognition({ onTranscript }: UseSpeechRecognitionOptions): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(getRecognition());
  const { toast } = useToast();

  const handleResult = useCallback((event: SpeechRecognitionEvent) => {
    let finalTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      }
    }
    
    if (finalTranscript) {
      onTranscript(finalTranscript);
    }
  }, [onTranscript]);

  const handleError = useCallback((event: SpeechRecognitionErrorEvent) => {
    let errorMessage = 'An unknown speech recognition error occurred.';
    switch (event.error) {
        case 'network':
             // This error is often transient and can be ignored to prevent user disruption.
            return;
        case 'no-speech':
            // This error is ignored because continuous mode can trigger it during pauses.
            return;
        case 'audio-capture':
            errorMessage = 'Could not access the microphone. Please check permissions.';
            break;
        case 'not-allowed':
            errorMessage = 'Microphone access was denied. Please allow access to use this feature.';
            break;
        case 'service-not-allowed':
             errorMessage = 'Speech recognition service is not allowed. You may need to enable it in your browser settings.';
             break;
    }
    
    toast({
        variant: 'destructive',
        title: 'Speech Recognition Error',
        description: errorMessage
    });

    setIsListening(false);
  }, [toast]);

  useEffect(() => {
    const rec = recognitionRef.current;
    if (rec) {
      const handleEnd = () => {
        // The 'end' event can fire for various reasons, including network issues or user stopping.
        // We only change state if it was programmatically stopped.
        // This avoids race conditions where an error might set isListening to false
        // right before this does.
      };

      rec.addEventListener('result', handleResult);
      rec.addEventListener('error', handleError);
      rec.addEventListener('end', handleEnd);

      return () => {
        rec.removeEventListener('result', handleResult);
        rec.removeEventListener('error', handleError);
        rec.removeEventListener('end', handleEnd);
        if (rec.stop) {
          rec.stop();
        }
      };
    }
  }, [handleResult, handleError]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e: any) {
        if (e.name === 'InvalidStateError') {
            // Already running
            setIsListening(true);
        } else {
            console.error("Error starting recognition:", e);
            toast({
                variant: 'destructive',
                title: 'Could not start recording',
                description: e.message || 'Please try again.'
            });
        }
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch(e) {
        console.error("Error stopping recognition:", e);
        // Force state to false even if stop() fails.
        setIsListening(false);
      }
    }
  };

  return {
    isListening,
    startListening,
    stopListening,
    hasRecognitionSupport: !!recognitionRef.current,
  };
}
