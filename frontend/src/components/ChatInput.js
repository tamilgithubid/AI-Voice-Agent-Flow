import React, { useState, useRef, useEffect } from 'react';

export default function ChatInput({ onSend, isLoading, isListening, voiceSupported, onVoiceToggle, transcript }) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  // Update input when voice transcript changes
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }
  }, [input]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form className="chat-input-form" onSubmit={handleSubmit}>
      <div className="input-wrapper">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? 'Listening...' : 'Type your message... (Shift+Enter for new line)'}
          disabled={isLoading}
          rows={1}
          className="chat-textarea"
        />
        <div className="input-actions">
          {voiceSupported && (
            <button
              type="button"
              className={`voice-btn ${isListening ? 'listening' : ''}`}
              onClick={onVoiceToggle}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? '⏹️' : '🎤'}
            </button>
          )}
          <button
            type="submit"
            className="send-btn"
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <span className="loading-spinner" />
            ) : (
              '➤'
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
