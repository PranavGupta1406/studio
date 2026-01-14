'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from './use-toast';

interface SpeechRecognitionHook {
  transcript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  hasRecognitionSupport: boolean;
}

// Singleton recognition instance
let recognition: SpeechRecognition | null = null;
const getRecognition = () => {
    if (typeof window === 'undefined') return null;
    if (recognition) return recognition;

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';
        return recognition;
    }
    return null;
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [transcript, setTranscript] = useState('');
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
      setTranscript(finalTranscript);
    }
  }, []);

  const handleEnd = useCallback(() => {
    setIsListening(false);
    setTranscript(''); // Clear intermediate transcript
  }, []);

  const handleError = useCallback((event: SpeechRecognitionErrorEvent) => {
    let errorMessage = 'An unknown speech recognition error occurred.';
    switch (event.error) {
        case 'network':
            errorMessage = 'Network error with speech recognition. Please check your connection.';
            break;
        case 'no-speech':
            errorMessage = 'No speech was detected. Please try again.';
            break;
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
      rec.addEventListener('result', handleResult);
      rec.addEventListener('end', handleEnd);
      rec.addEventListener('error', handleError);

      return () => {
        rec.removeEventListener('result', handleResult);
        rec.removeEventListener('end', handleEnd);
        rec.removeEventListener('error', handleError);
        if (rec.stop) {
          rec.stop();
        }
      };
    }
  }, [handleResult, handleEnd, handleError]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Error starting recognition:", e);
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
      }
    }
  };

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    hasRecognitionSupport: !!recognitionRef.current,
  };
}
