import React from 'react';

function StatusBar({ status, isListening }) {
  const getStatusText = () => {
    if (isListening) return 'Listening...';
    switch (status) {
      case 'processing': return 'AI is thinking...';
      case 'sending': return 'Sending email...';
      default: return 'Ready';
    }
  };

  const statusClass = isListening ? 'listening' : status;

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
