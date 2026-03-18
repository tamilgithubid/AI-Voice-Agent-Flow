import { useCallback, useEffect, useRef, useState } from 'react';

// Ranked voice preferences - best natural-sounding voices first
const VOICE_PREFERENCES = [
  'Google UK English Female',
  'Google UK English Male',
  'Google US English',
  'Samantha',           // macOS premium
  'Daniel',             // macOS premium
  'Karen',              // macOS
  'Moira',              // macOS
  'Rishi',              // macOS
  'Microsoft Zira',     // Windows
  'Microsoft David',    // Windows
];

function pickBestVoice(voices) {
  // Try each preferred voice in order
  for (const pref of VOICE_PREFERENCES) {
    const match = voices.find((v) => v.name.includes(pref));
    if (match) return match;
  }
  // Fallback: any English voice that isn't robotic
  const english = voices.find(
    (v) => v.lang.startsWith('en') && !v.name.includes('Compact')
  );
  return english || voices[0] || null;
}

export function useSpeech() {
  const [voiceReady, setVoiceReady] = useState(false);
  const bestVoiceRef = useRef(null);
  const isSpeakingRef = useRef(false);

  // Voices load asynchronously - listen for them
  useEffect(() => {
    if (!window.speechSynthesis) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        bestVoiceRef.current = pickBestVoice(voices);
        setVoiceReady(true);
      }
    };

    // Try immediately (some browsers have voices ready)
    loadVoices();

    // Also listen for async load
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);

      // Use the best available voice
      if (bestVoiceRef.current) {
        utterance.voice = bestVoiceRef.current;
      }

      // Natural speech settings
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';

      utterance.onstart = () => {
        isSpeakingRef.current = true;
      };

      utterance.onend = () => {
        isSpeakingRef.current = false;
        resolve();
      };

      utterance.onerror = () => {
        isSpeakingRef.current = false;
        resolve();
      };

      // Chrome bug workaround: speech can stop mid-sentence on long text
      // Split into chunks if text is long
      if (text.length > 200) {
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        let chain = Promise.resolve();
        sentences.forEach((sentence) => {
          chain = chain.then(() => {
            return new Promise((res) => {
              const chunk = new SpeechSynthesisUtterance(sentence.trim());
              if (bestVoiceRef.current) chunk.voice = bestVoiceRef.current;
              chunk.rate = 0.95;
              chunk.pitch = 1.0;
              chunk.volume = 1.0;
              chunk.lang = 'en-US';
              chunk.onend = res;
              chunk.onerror = res;
              window.speechSynthesis.speak(chunk);
            });
          });
        });
        chain.then(resolve);
      } else {
        window.speechSynthesis.speak(utterance);
      }
    });
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    isSpeakingRef.current = false;
  }, []);

  return { speak, stop, voiceReady, isSpeaking: isSpeakingRef.current };
}
