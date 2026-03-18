import React from 'react';

function StatusBar({ status, isListening, actionType, passiveMode, chatMode = 'general', charName = 'Nova' }) {
  const getStatusText = () => {
    if (isListening && passiveMode) return 'Say "Hey Agent" to wake me up...';
    if (isListening) return 'Listening...';
    switch (status) {
      case 'processing': return `${charName} is thinking`;
      case 'sending':
        return actionType === 'whatsapp' ? 'Sending WhatsApp...' : 'Sending email...';
      default: return `${charName} is ready`;
    }
  };

  const statusClass = isListening && passiveMode ? 'passive' : isListening ? 'listening' : status;

  return (
    <div className={`status-bar ${statusClass} status-mode-${chatMode}`}>
      {(isListening || status === 'processing' || status === 'sending') && (
        <span className="status-dot" />
      )}
      <span>{getStatusText()}</span>
      {status === 'processing' && (
        <span className="thinking-dots">
          <span />
          <span />
          <span />
        </span>
      )}
    </div>
  );
}

export default StatusBar;
