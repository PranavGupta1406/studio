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
        recognition.continuous = true; // Keep listening even after silence
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
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    
    // We only care about the final transcript to avoid spamming the state
    if (finalTranscript) {
      onTranscript(finalTranscript);
    }
  }, [onTranscript]);

  const handleError = useCallback((event: SpeechRecognitionErrorEvent) => {
    let errorMessage = 'An unknown speech recognition error occurred.';
    switch (event.error) {
        case 'network':
            errorMessage = 'Network error with speech recognition. Please check your connection.';
            break;
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

  // This handleEnd is now only for cleanup when the component unmounts
  useEffect(() => {
    const rec = recognitionRef.current;
    if (rec) {
      const handleEnd = () => {
        // Only stop listening if it was explicitly stopped by the user
        if (isListening) {
           // It can stop for other reasons (e.g. network error), we can try to restart it
           // but for now we will just stop it to avoid infinite loops
            setIsListening(false);
        }
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
  }, [handleResult, handleError, isListening]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e: any) {
        // This can happen if recognition is already running
        if (e.name === 'InvalidStateError') {
            // It's already running, so we'll just ensure our state is correct
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
