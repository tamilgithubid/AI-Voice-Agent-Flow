import { useState, useRef, useCallback, useEffect } from 'react';

export function useVoice(onResult) {
  const [isListening, setIsListening] = useState(false);
  const [permissionState, setPermissionState] = useState('prompt'); // 'granted' | 'denied' | 'prompt'
  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);

  // Keep callback ref current without re-creating recognition
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  // Request mic permission on mount so the user sees the prompt early
  useEffect(() => {
    async function requestMicPermission() {
      try {
        // Check if permission API is available
        if (navigator.permissions) {
          const status = await navigator.permissions.query({ name: 'microphone' });
          setPermissionState(status.state);
          status.onchange = () => setPermissionState(status.state);
        }

        // Proactively request mic access so browser shows the permission dialog
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Stop tracks immediately - we just needed the permission
        stream.getTracks().forEach((t) => t.stop());
        setPermissionState('granted');
      } catch (err) {
        if (err.name === 'NotAllowedError') {
          setPermissionState('denied');
        }
        console.warn('Mic permission:', err.message);
      }
    }

    requestMicPermission();
  }, []);

  // Create speech recognition instance once
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition API not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;
      console.log(`Speech recognized (confidence: ${(confidence * 100).toFixed(0)}%): "${transcript}"`);
      setIsListening(false);
      onResultRef.current(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      // Only call onResult with empty for real errors, not silence
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        onResultRef.current('');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, []); // Only create once

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (permissionState === 'denied') {
      alert('Microphone access is blocked. Please allow microphone access in your browser settings and reload.');
      return;
    }

    if (!isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        // Already started - stop and restart
        if (err.name === 'InvalidStateError') {
          recognitionRef.current.stop();
          setTimeout(() => {
            recognitionRef.current.start();
            setIsListening(true);
          }, 100);
        } else {
          console.error('Failed to start speech recognition:', err);
        }
      }
    }
  }, [isListening, permissionState]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const isSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return { isListening, startListening, stopListening, isSupported, permissionState };
}
