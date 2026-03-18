import React, { useEffect, useRef } from 'react';
import { CHARACTERS } from './CharacterSelect';

function ChatWindow({ messages, chatMode = 'general', voiceGender = 'female' }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get current character based on mode + gender
  const chars = CHARACTERS[voiceGender] || CHARACTERS.female;
  const activeChar = chars.find(c => c.id === chatMode) || chars[0];

  if (messages.length === 0) {
    return (
      <div className="chat-window empty">
        <div className="empty-state">
          <img
            src={activeChar.avatar}
            alt={activeChar.name}
            className="empty-state-avatar"
            width="64"
            height="64"
          />
          <p>{activeChar.name} is ready to chat</p>
          <p className="example">Click the microphone to start</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {messages.map((msg, i) => (
        <div key={i} className={`message ${msg.role}`}>
          <div className={`message-avatar ${msg.role === 'assistant' ? `avatar-${chatMode}` : ''}`}>
            {msg.role === 'user' ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            ) : (
              <img
                src={activeChar.avatar}
                alt={activeChar.name}
                width="32"
                height="32"
                className="chat-avatar-img"
              />
            )}
          </div>
          <div className="message-content">
            <div className="message-name">
              {msg.role === 'user' ? 'You' : activeChar.name}
            </div>
            <p>{msg.text}</p>
            <span className="message-time">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

export default ChatWindow;
