import React from 'react';

function StatusBar({ status, isListening, actionType, passiveMode }) {
  const getStatusText = () => {
    if (isListening && passiveMode) return 'Say "Hey Agent" to wake me up...';
    if (isListening) return 'Listening...';
    switch (status) {
      case 'processing': return 'AI is thinking...';
      case 'sending':
        return actionType === 'whatsapp' ? 'Sending WhatsApp...' : 'Sending email...';
      default: return 'Ready';
    }
  };

  const statusClass = isListening && passiveMode ? 'passive' : isListening ? 'listening' : status;

  return (
    <div className={`status-bar ${statusClass}`}>
      {(isListening || status === 'processing' || status === 'sending') && (
        <span className="status-dot" />
      )}
      <span>{getStatusText()}</span>
    </div>
  );
}

export default StatusBar;
