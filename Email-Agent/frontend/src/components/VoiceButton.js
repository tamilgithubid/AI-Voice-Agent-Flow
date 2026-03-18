import React from 'react';

function VoiceButton({ isListening, onStart, onStop, disabled }) {
  const handleClick = () => {
    if (isListening) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <div className={`voice-button-wrapper ${isListening ? 'is-listening' : ''}`}>
      {/* Rotating tech rings — always visible, intensify when listening */}
      <div className="voice-ring voice-ring-1" />
      <div className="voice-ring voice-ring-2" />
      <div className="voice-ring voice-ring-3" />

      {/* Expanding wave pulses when listening */}
      {isListening && (
        <div className="voice-waves">
          <span className="wave wave-1" />
          <span className="wave wave-2" />
          <span className="wave wave-3" />
          <span className="wave wave-4" />
          <span className="wave wave-5" />
        </div>
      )}

      {/* The plasma orb button */}
      <button
        className={`voice-button ${isListening ? 'listening' : ''}`}
        onClick={handleClick}
        disabled={disabled}
        aria-label={isListening ? 'Stop listening' : 'Start listening'}
      >
        {/* Inner plasma glow layers */}
        <div className="orb-plasma" />
        <div className="orb-core" />

        <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor" className="orb-icon">
          {isListening ? (
            <>
              <rect x="3" y="8" width="2.5" height="8" rx="1.25">
                <animate attributeName="height" values="8;16;8" dur="0.7s" repeatCount="indefinite" />
                <animate attributeName="y" values="8;4;8" dur="0.7s" repeatCount="indefinite" />
              </rect>
              <rect x="7" y="5" width="2.5" height="14" rx="1.25">
                <animate attributeName="height" values="14;6;14" dur="0.55s" repeatCount="indefinite" />
                <animate attributeName="y" values="5;9;5" dur="0.55s" repeatCount="indefinite" />
              </rect>
              <rect x="11" y="7" width="2.5" height="10" rx="1.25">
                <animate attributeName="height" values="10;18;10" dur="0.65s" repeatCount="indefinite" />
                <animate attributeName="y" values="7;3;7" dur="0.65s" repeatCount="indefinite" />
              </rect>
              <rect x="15" y="6" width="2.5" height="12" rx="1.25">
                <animate attributeName="height" values="12;4;12" dur="0.5s" repeatCount="indefinite" />
                <animate attributeName="y" values="6;10;6" dur="0.5s" repeatCount="indefinite" />
              </rect>
              <rect x="19" y="9" width="2.5" height="6" rx="1.25">
                <animate attributeName="height" values="6;14;6" dur="0.8s" repeatCount="indefinite" />
                <animate attributeName="y" values="9;5;9" dur="0.8s" repeatCount="indefinite" />
              </rect>
            </>
          ) : (
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          )}
        </svg>
        <span className="orb-label">{isListening ? 'Listening' : 'Speak'}</span>
      </button>
    </div>
  );
}

export default VoiceButton;
