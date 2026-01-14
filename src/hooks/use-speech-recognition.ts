'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

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
        recognition.interimResults = true; // Changed to true for live feedback
        recognition.lang = 'en-IN';
        return recognition;
    }
    return null;
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(getRecognition());

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
    console.error('Speech recognition error:', event.error);
    setIsListening(false);
  }, []);


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
