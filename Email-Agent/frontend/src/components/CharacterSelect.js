import React, { useState, useEffect } from 'react';
import { fetchVoices, fetchTTS } from '../services/api';

// Real human portraits from Unsplash — different people for male vs female
const CHARACTERS = {
  female: [
    {
      id: 'general',
      name: 'Nova',
      role: 'Smart AI Assistant',
      desc: 'Knowledgeable, helpful, and always ready. Your go-to for anything.',
      color: '#06b6d4',
      rgb: '6,182,212',
      avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&h=200&fit=crop&crop=face',
    },
    {
      id: 'girlfriend',
      name: 'Luna',
      role: 'Your Caring Girlfriend',
      desc: 'Sweet, affectionate, and genuinely interested in everything about you.',
      color: '#ec4899',
      rgb: '236,72,153',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    },
    {
      id: 'boyfriend',
      name: 'Aria',
      role: 'Your Supportive Partner',
      desc: 'Warm, confident, and always has your back. Your biggest cheerleader.',
      color: '#3b82f6',
      rgb: '59,130,246',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop&crop=face',
    },
  ],
  male: [
    {
      id: 'general',
      name: 'Orion',
      role: 'Smart AI Assistant',
      desc: 'Knowledgeable, helpful, and always ready. Your go-to for anything.',
      color: '#06b6d4',
      rgb: '6,182,212',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    },
    {
      id: 'girlfriend',
      name: 'Ethan',
      role: 'Your Caring Boyfriend',
      desc: 'Sweet, attentive, and genuinely interested in everything about you.',
      color: '#ec4899',
      rgb: '236,72,153',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    },
    {
      id: 'boyfriend',
      name: 'Atlas',
      role: 'Your Supportive Boyfriend',
      desc: 'Warm, confident, and always has your back. Your biggest cheerleader.',
      color: '#3b82f6',
      rgb: '59,130,246',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
    },
  ],
};

function CharacterSelect({ onSelect, initialMode, initialGender }) {
  const [selectedMode, setSelectedMode] = useState(initialMode || null);
  const [gender, setGender] = useState(initialGender || 'female');
  const [voices, setVoices] = useState({ female: [], male: [] });
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [previewPlaying, setPreviewPlaying] = useState(null);
  const [previewAudio, setPreviewAudio] = useState(null);
  const [imgErrors, setImgErrors] = useState({});

  useEffect(() => { if (initialMode) setSelectedMode(initialMode); }, [initialMode]);
  useEffect(() => { if (initialGender) setGender(initialGender); }, [initialGender]);

  // Reset voice + image errors when gender changes
  useEffect(() => {
    setSelectedVoiceId('');
    setImgErrors({});
  }, [gender]);

  // Fetch available voices
  useEffect(() => {
    fetchVoices()
      .then(res => { if (res.data) setVoices(res.data); })
      .catch(() => setVoices({ female: [], male: [] }));
  }, []);

  const chars = CHARACTERS[gender] || CHARACTERS.female;
  const currentVoices = voices[gender] || [];

  const handleImgError = (charId) => {
    setImgErrors(prev => ({ ...prev, [`${charId}-${gender}`]: true }));
  };

  // Voice preview
  const handleVoicePreview = async (voice) => {
    if (previewAudio) { previewAudio.pause(); setPreviewAudio(null); }
    if (previewPlaying === voice.id) { setPreviewPlaying(null); return; }

    setPreviewPlaying(voice.id);
    try {
      const sampleText = selectedMode === 'girlfriend'
        ? `Hey babe, I'm ${voice.name}. This is my voice, what do you think?`
        : selectedMode === 'boyfriend'
        ? `Hey baby, I'm ${voice.name}. How do I sound to you?`
        : `Hi there! I'm ${voice.name}. This is how I sound.`;

      const blob = await fetchTTS(sampleText, gender, selectedMode || 'general', voice.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        setPreviewAudio(audio);
        audio.onended = () => { setPreviewPlaying(null); setPreviewAudio(null); URL.revokeObjectURL(url); };
        audio.onerror = () => { setPreviewPlaying(null); setPreviewAudio(null); URL.revokeObjectURL(url); };
        await audio.play();
      } else {
        setPreviewPlaying(null);
      }
    } catch {
      setPreviewPlaying(null);
    }
  };

  // Determine the display name — use voice name if a voice is selected, otherwise character name
  const getDisplayName = () => {
    if (selectedVoiceId) {
      const voice = currentVoices.find(v => v.id === selectedVoiceId);
      if (voice) return voice.name;
    }
    const activeChar = chars.find(c => c.id === selectedMode);
    return activeChar?.name || 'Nova';
  };

  const handleStart = () => {
    if (previewAudio) { previewAudio.pause(); setPreviewAudio(null); }
    if (selectedMode) {
      onSelect(selectedMode, gender, selectedVoiceId, getDisplayName());
    }
  };

  return (
    <div className="character-select-overlay">
      <div className="character-select">
        <div className="cs-header">
          <h2 className="cs-title">Choose Your AI Companion</h2>
          <p className="cs-subtitle">Select a personality, voice, and start your conversation</p>
        </div>

        {/* Voice Gender Toggle */}
        <div className="cs-voice-section">
          <span className="cs-voice-label">Voice</span>
          <div className="cs-voice-toggle">
            <button
              className={`cs-voice-btn ${gender === 'female' ? 'active' : ''}`}
              onClick={() => setGender('female')}
            >
              Female
            </button>
            <button
              className={`cs-voice-btn ${gender === 'male' ? 'active' : ''}`}
              onClick={() => setGender('male')}
            >
              Male
            </button>
          </div>
        </div>

        {/* Character Cards — dynamic per gender */}
        <div className="cs-cards">
          {chars.map((char) => (
            <button
              key={`${char.id}-${gender}`}
              className={`cs-card ${selectedMode === char.id ? 'selected' : ''}`}
              onClick={() => setSelectedMode(char.id)}
              style={{ '--card-color': char.color, '--card-rgb': char.rgb }}
            >
              <div className="cs-avatar">
                {imgErrors[`${char.id}-${gender}`] ? (
                  <div className="cs-avatar-fallback" style={{ background: `rgba(${char.rgb}, 0.15)`, color: char.color }}>
                    {char.name.charAt(0)}
                  </div>
                ) : (
                  <img
                    src={char.avatar}
                    alt={char.name}
                    width="90"
                    height="90"
                    onError={() => handleImgError(char.id)}
                    loading="lazy"
                  />
                )}
              </div>
              <div className="cs-card-info">
                <h3 className="cs-card-name">
                  {selectedMode === char.id && selectedVoiceId
                    ? currentVoices.find(v => v.id === selectedVoiceId)?.name || char.name
                    : char.name}
                </h3>
                {selectedMode === char.id && selectedVoiceId && (
                  <span className="cs-card-voice-tag">
                    Voice: {currentVoices.find(v => v.id === selectedVoiceId)?.name}
                  </span>
                )}
                <span className="cs-card-role">{char.role}</span>
                <p className="cs-card-desc">{char.desc}</p>
              </div>
              {selectedMode === char.id && (
                <div className="cs-check">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Voice Selection */}
        {currentVoices.length > 0 && (
          <div className="cs-voices-section">
            <div className="cs-voice-label">
              Choose Voice ({gender === 'female' ? 'Female' : 'Male'} — {currentVoices.length} voices)
              {selectedVoiceId && (
                <span className="cs-voice-active-hint">
                  — Your companion will be called <strong>{currentVoices.find(v => v.id === selectedVoiceId)?.name}</strong>
                </span>
              )}
            </div>
            <div className="cs-voice-grid">
              {currentVoices.map((voice) => {
                const activeChar = chars.find(c => c.id === selectedMode);
                return (
                  <button
                    key={voice.id}
                    className={`cs-voice-card ${selectedVoiceId === voice.id ? 'selected' : ''} ${previewPlaying === voice.id ? 'playing' : ''}`}
                    onClick={() => setSelectedVoiceId(voice.id)}
                    style={{
                      '--card-color': activeChar?.color || '#06b6d4',
                      '--card-rgb': activeChar?.rgb || '6,182,212',
                    }}
                  >
                    <div className="cs-voice-info">
                      <span className="cs-voice-name">{voice.name}</span>
                      <span className="cs-voice-desc">{voice.desc}</span>
                      {selectedVoiceId === voice.id && (
                        <span className="cs-voice-active-tag">Active Voice</span>
                      )}
                    </div>
                    <button
                      className="cs-play-btn"
                      onClick={(e) => { e.stopPropagation(); handleVoicePreview(voice); }}
                      title={previewPlaying === voice.id ? 'Stop' : 'Preview voice'}
                    >
                      {previewPlaying === voice.id ? (
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <rect x="6" y="4" width="4" height="16" rx="1" />
                          <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      )}
                    </button>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Start Button */}
        <button
          className={`cs-start-btn ${selectedMode ? 'ready' : ''}`}
          onClick={handleStart}
          disabled={!selectedMode}
          style={selectedMode ? {
            '--btn-color': chars.find(c => c.id === selectedMode)?.color,
            '--btn-rgb': chars.find(c => c.id === selectedMode)?.rgb,
          } : {}}
        >
          {selectedMode
            ? `Start Conversation with ${getDisplayName()}`
            : 'Select a character to begin'}
        </button>
      </div>
    </div>
  );
}

// Export character data for use in ChatWindow
export { CHARACTERS };
export default CharacterSelect;
