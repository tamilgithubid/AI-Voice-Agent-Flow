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
    <div className="voice-button-wrapper">
      {/* Sound wave rings when listening */}
      {isListening && (
        <div className="voice-waves">
          <span className="wave wave-1" />
          <span className="wave wave-2" />
          <span className="wave wave-3" />
        </div>
      )}
      <button
        className={`voice-button ${isListening ? 'listening' : ''}`}
        onClick={handleClick}
        disabled={disabled}
        aria-label={isListening ? 'Stop listening' : 'Start listening'}
      >
        <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
          {isListening ? (
            /* Sound wave bars when listening */
            <>
              <rect x="4" y="8" width="2.5" height="8" rx="1.25">
                <animate attributeName="height" values="8;16;8" dur="0.8s" repeatCount="indefinite" />
                <animate attributeName="y" values="8;4;8" dur="0.8s" repeatCount="indefinite" />
              </rect>
              <rect x="8.5" y="5" width="2.5" height="14" rx="1.25">
                <animate attributeName="height" values="14;6;14" dur="0.6s" repeatCount="indefinite" />
                <animate attributeName="y" values="5;9;5" dur="0.6s" repeatCount="indefinite" />
              </rect>
              <rect x="13" y="7" width="2.5" height="10" rx="1.25">
                <animate attributeName="height" values="10;18;10" dur="0.7s" repeatCount="indefinite" />
                <animate attributeName="y" values="7;3;7" dur="0.7s" repeatCount="indefinite" />
              </rect>
              <rect x="17.5" y="9" width="2.5" height="6" rx="1.25">
                <animate attributeName="height" values="6;14;6" dur="0.9s" repeatCount="indefinite" />
                <animate attributeName="y" values="9;5;9" dur="0.9s" repeatCount="indefinite" />
              </rect>
            </>
          ) : (
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          )}
        </svg>
        <span>{isListening ? 'Listening' : 'Speak'}</span>
      </button>
    </div>
  );
}

export default VoiceButton;
