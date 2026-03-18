const logger = require('../utils/logger');

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Ultra-realistic voices — ElevenLabs pre-made voices (available on free tier)
// Verified against actual account voices
const VOICE_MAP = {
  female: [
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', desc: 'Mature & Confident', style: 'professional' },
    { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura', desc: 'Quirky & Enthusiastic', style: 'casual' },
    { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice', desc: 'Clear & Engaging', style: 'professional' },
    { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', desc: 'Professional & Warm', style: 'professional' },
    { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', desc: 'Playful & Bright', style: 'romantic' },
    { id: 'hpp4J3VqNfWAUOO0d1Us', name: 'Bella', desc: 'Warm & Intimate', style: 'romantic' },
    { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', desc: 'Velvety & Smooth', style: 'romantic' },
  ],
  male: [
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', desc: 'Dominant & Firm', style: 'professional' },
    { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger', desc: 'Laid-Back & Casual', style: 'casual' },
    { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', desc: 'Deep & Confident', style: 'romantic' },
    { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', desc: 'Warm Storyteller', style: 'romantic' },
    { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum', desc: 'Husky & Playful', style: 'casual' },
    { id: 'cjVigY5qzO86Huf0OWal', name: 'Eric', desc: 'Smooth & Trustworthy', style: 'professional' },
    { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', desc: 'Deep & Comforting', style: 'romantic' },
    { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', desc: 'Steady & Authoritative', style: 'professional' },
    { id: 'iP95p4xoKVk53GoZ742B', name: 'Chris', desc: 'Charming & Down-to-Earth', style: 'casual' },
    { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', desc: 'Energetic & Bold', style: 'casual' },
  ],
};

// Mode-to-style mapping for auto-selection
const MODE_STYLE_MAP = {
  general: 'professional',
  girlfriend: 'romantic',
  boyfriend: 'romantic',
};

// Voice settings per mode
const VOICE_SETTINGS = {
  general: {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.3,
    use_speaker_boost: true,
  },
  girlfriend: {
    stability: 0.35,
    similarity_boost: 0.8,
    style: 0.65,
    use_speaker_boost: true,
  },
  boyfriend: {
    stability: 0.4,
    similarity_boost: 0.8,
    style: 0.55,
    use_speaker_boost: true,
  },
};

// Get voice by ID, or auto-select best voice for mode
function getVoice(gender, mode, voiceId) {
  const voices = VOICE_MAP[gender] || VOICE_MAP.female;

  // If specific voiceId requested, find it
  if (voiceId) {
    const match = voices.find(v => v.id === voiceId);
    if (match) return match;
  }

  // Auto-select based on mode style
  const preferredStyle = MODE_STYLE_MAP[mode] || 'professional';
  const styleMatch = voices.find(v => v.style === preferredStyle);
  return styleMatch || voices[0];
}

async function synthesizeSpeech({ text, gender = 'female', mode = 'general', voiceId = null }) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey === 'your_elevenlabs_api_key_here') {
    throw new Error('ELEVENLABS_API_KEY is not configured');
  }

  const voice = getVoice(gender, mode, voiceId);
  const settings = VOICE_SETTINGS[mode] || VOICE_SETTINGS.general;

  logger.info(`TTS: ${voice.name} (${gender}/${mode}) — "${text.substring(0, 40)}..."`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${voice.id}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: settings,
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API returned ${response.status}: ${errorText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    return { audio: Buffer.from(audioBuffer), voiceName: voice.name };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { synthesizeSpeech, VOICE_MAP };
