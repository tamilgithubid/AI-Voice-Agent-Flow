import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function ChatMessage({ message, onSpeak }) {
  const isUser = message.role === 'user';

  return (
    <div className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-avatar">
        {isUser ? '👤' : '🤖'}
      </div>
      <div className="message-content">
        <div className="message-header">
          <span className="message-role">{isUser ? 'You' : 'Agent Flow'}</span>
          <span className="message-time">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div className="message-body">
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <ReactMarkdown>{message.content}</ReactMarkdown>
          )}
          {message.streaming && <span className="typing-cursor">▊</span>}
        </div>
        {!isUser && message.content && !message.streaming && (
          <button className="speak-btn" onClick={() => onSpeak(message.content)} title="Read aloud">
            🔊
          </button>
        )}
      </div>
    </div>
  );
}
