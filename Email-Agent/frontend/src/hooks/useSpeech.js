import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchTTS } from '../services/api';

// ======================== BROWSER TTS FALLBACK ========================

const FEMALE_VOICES = ['Google UK English Female', 'Samantha', 'Karen', 'Moira', 'Microsoft Zira'];
const MALE_VOICES = ['Google UK English Male', 'Daniel', 'Rishi', 'Microsoft David'];

function pickBestVoice(voices, gender = 'female') {
  const prefs = gender === 'male' ? MALE_VOICES : FEMALE_VOICES;
  for (const pref of prefs) {
    const match = voices.find((v) => v.name.includes(pref));
    if (match) return match;
  }
  return voices.find((v) => v.lang.startsWith('en') && !v.name.includes('Compact')) || voices[0] || null;
}

// ======================== MAIN HOOK ========================

export function useSpeech(voiceGender = 'female', chatMode = 'general', selectedVoiceId = '') {
  const [voiceReady, setVoiceReady] = useState(false);
  const [elevenLabsAvailable, setElevenLabsAvailable] = useState(true);

  // Use refs for values that change frequently but need latest in callbacks
  const configRef = useRef({ gender: voiceGender, mode: chatMode, voiceId: selectedVoiceId });
  const bestBrowserVoiceRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const audioRef = useRef(null);
  const allVoicesRef = useRef([]);

  // Keep config ref always in sync
  useEffect(() => {
    configRef.current = { gender: voiceGender, mode: chatMode, voiceId: selectedVoiceId };

    // Also update browser voice when gender changes
    if (allVoicesRef.current.length > 0) {
      bestBrowserVoiceRef.current = pickBestVoice(allVoicesRef.current, voiceGender);
    }
  }, [voiceGender, chatMode, selectedVoiceId]);

  // Load browser voices (for fallback)
  useEffect(() => {
    if (!window.speechSynthesis) return;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        allVoicesRef.current = voices;
        bestBrowserVoiceRef.current = pickBestVoice(voices, configRef.current.gender);
        setVoiceReady(true);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // Browser TTS fallback — always reads latest from refs
  const speakWithBrowser = useCallback((text) => {
    if (!window.speechSynthesis) return Promise.resolve();
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();

    return new Promise((resolve) => {
      const { gender } = configRef.current;
      const isMale = gender === 'male';

      // Re-pick voice from latest gender
      if (allVoicesRef.current.length > 0) {
        bestBrowserVoiceRef.current = pickBestVoice(allVoicesRef.current, gender);
      }

      const makeUtterance = (t) => {
        const u = new SpeechSynthesisUtterance(t);
        if (bestBrowserVoiceRef.current) u.voice = bestBrowserVoiceRef.current;
        u.rate = isMale ? 0.9 : 0.95;
        u.pitch = isMale ? 0.9 : 1.1;
        u.volume = 1.0;
        u.lang = 'en-US';
        return u;
      };

      if (text.length > 200) {
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        let chain = Promise.resolve();
        sentences.forEach((sentence) => {
          chain = chain.then(() => new Promise((res) => {
            const chunk = makeUtterance(sentence.trim());
            chunk.onend = res;
            chunk.onerror = res;
            window.speechSynthesis.speak(chunk);
          }));
        });
        chain.then(() => { isSpeakingRef.current = false; resolve(); });
        return;
      }

      const utterance = makeUtterance(text);
      utterance.onstart = () => { isSpeakingRef.current = true; };
      utterance.onend = () => { isSpeakingRef.current = false; resolve(); };
      utterance.onerror = () => { isSpeakingRef.current = false; resolve(); };
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // ElevenLabs TTS — reads latest config from ref (no stale closure)
  const speakWithElevenLabs = useCallback(async (text) => {
    const { gender, mode, voiceId } = configRef.current;

    const audioBlob = await fetchTTS(text, gender, mode, voiceId);

    if (!audioBlob) {
      setElevenLabsAvailable(false);
      return false; // signal fallback
    }

    return new Promise((resolve) => {
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => { isSpeakingRef.current = true; };
      audio.onended = () => {
        isSpeakingRef.current = false;
        URL.revokeObjectURL(url);
        audioRef.current = null;
        resolve();
      };
      audio.onerror = () => {
        isSpeakingRef.current = false;
        URL.revokeObjectURL(url);
        audioRef.current = null;
        resolve();
      };

      audio.play().catch(() => {
        isSpeakingRef.current = false;
        URL.revokeObjectURL(url);
        resolve();
      });
    });
  }, []);

  // Main speak — tries ElevenLabs first, falls back to browser
  const speak = useCallback(async (text) => {
    if (!text) return;

    if (elevenLabsAvailable) {
      try {
        const result = await speakWithElevenLabs(text);
        if (result !== false) return;
      } catch (err) {
        console.warn('ElevenLabs TTS failed, using browser fallback:', err.message);
      }
    }

    return speakWithBrowser(text);
  }, [elevenLabsAvailable, speakWithElevenLabs, speakWithBrowser]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    window.speechSynthesis.cancel();
    isSpeakingRef.current = false;
  }, []);

  return { speak, stop, voiceReady, isSpeaking: isSpeakingRef.current };
}
