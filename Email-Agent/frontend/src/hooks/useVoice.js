import { useState, useRef, useCallback, useEffect } from 'react';

const WAKE_WORDS = ['hey agent', 'hay agent', 'hey asian', 'a agent', 'hey again'];
const PASSIVE_RESTART_DELAY = 2000; // 2s between passive wake-word restarts
const ACTIVE_RESTART_DELAY = 600;   // 0.6s between active restarts
const MAX_ACTIVE_RESTARTS = 2;      // Only retry 2 times in active mode (then stop)

export function useVoice(onResult) {
  const [isListening, setIsListening] = useState(false);
  const [permissionState, setPermissionState] = useState('prompt');
  const [passiveMode, setPassiveMode] = useState(false);
  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);
  const autoRestartRef = useRef(false);
  const passiveModeRef = useRef(false);
  const restartTimerRef = useRef(null);
  const activeRestartCountRef = useRef(0);

  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => { passiveModeRef.current = passiveMode; }, [passiveMode]);

  // Request mic permission on mount
  useEffect(() => {
    async function requestMicPermission() {
      try {
        if (navigator.permissions) {
          const status = await navigator.permissions.query({ name: 'microphone' });
          setPermissionState(status.state);
          status.onchange = () => setPermissionState(status.state);
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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

  // Create speech recognition instance
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition API not supported.');
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
      console.log(`Speech (${(confidence * 100).toFixed(0)}%): "${transcript}"`);

      // In passive mode, only respond to wake words
      if (passiveModeRef.current) {
        const lower = transcript.toLowerCase().trim();
        const isWake = WAKE_WORDS.some((w) => lower.includes(w));
        if (isWake) {
          console.log('Wake word detected!');
          onResultRef.current('__WAKE__');
          return;
        }
        // Not a wake word — keep listening passively
        return;
      }

      // Active mode — pass transcript to handler
      autoRestartRef.current = false;
      activeRestartCountRef.current = 0;
      setIsListening(false);
      onResultRef.current(transcript);
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        // Silence — auto-restart handles it
        return;
      }
      console.error('Speech error:', event.error);
      if (!passiveModeRef.current) {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Passive mode: always restart (wake-word listening)
      if (passiveModeRef.current) {
        restartTimerRef.current = setTimeout(() => {
          try {
            recognition.start();
            setIsListening(true);
          } catch (e) { /* ignore */ }
        }, PASSIVE_RESTART_DELAY);
        return;
      }

      // Active mode: restart up to MAX_ACTIVE_RESTARTS times on silence
      if (autoRestartRef.current && activeRestartCountRef.current < MAX_ACTIVE_RESTARTS) {
        activeRestartCountRef.current++;
        restartTimerRef.current = setTimeout(() => {
          try {
            recognition.start();
            setIsListening(true);
          } catch (e) { /* ignore */ }
        }, ACTIVE_RESTART_DELAY);
      } else {
        autoRestartRef.current = false;
        activeRestartCountRef.current = 0;
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      clearTimeout(restartTimerRef.current);
      recognition.abort();
    };
  }, []);

  // Start active listening (for conversation flow)
  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (permissionState === 'denied') {
      alert('Microphone access is blocked. Please allow it in browser settings and reload.');
      return;
    }

    // Switch to active mode
    setPassiveMode(false);
    passiveModeRef.current = false;
    autoRestartRef.current = true;
    activeRestartCountRef.current = 0;
    clearTimeout(restartTimerRef.current);

    if (!isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        if (err.name === 'InvalidStateError') {
          recognitionRef.current.stop();
          setTimeout(() => {
            try {
              recognitionRef.current.start();
              setIsListening(true);
            } catch (e) {
              console.error('Failed to restart:', e);
            }
          }, 150);
        } else {
          console.error('Failed to start:', err);
        }
      }
    }
  }, [isListening, permissionState]);

  // Stop all listening
  const stopListening = useCallback(() => {
    autoRestartRef.current = false;
    clearTimeout(restartTimerRef.current);
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  // Start passive wake-word listening (always on, low priority)
  const startPassiveListening = useCallback(() => {
    if (!recognitionRef.current || permissionState === 'denied') return;

    setPassiveMode(true);
    passiveModeRef.current = true;
    autoRestartRef.current = false;
    clearTimeout(restartTimerRef.current);

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      if (err.name === 'InvalidStateError') {
        recognitionRef.current.stop();
        setTimeout(() => {
          try {
            recognitionRef.current.start();
            setIsListening(true);
          } catch (e) { /* ignore */ }
        }, 200);
      }
    }
  }, [permissionState]);

  const isSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return {
    isListening,
    startListening,
    stopListening,
    startPassiveListening,
    passiveMode,
    isSupported,
    permissionState,
  };
}
