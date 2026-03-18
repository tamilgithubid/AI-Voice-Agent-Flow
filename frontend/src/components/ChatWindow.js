import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import useChat from '../hooks/useChat';
import useVoice from '../hooks/useVoice';

export default function ChatWindow() {
  const { messages, isLoading, error, sendStreaming, clearChat } = useChat();
  const {
    isListening, transcript, voiceSupported,
    startListening, stopListening, speak,
  } = useVoice();
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((finalText) => {
        sendStreaming(finalText);
      });
    }
  };

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <div className="header-info">
          <h1>Agent Flow AI</h1>
          <span className="subtitle">Intelligent Resume Assistant</span>
        </div>
        <div className="header-actions">
          <button className="clear-btn" onClick={clearChat} title="New conversation">
            New Chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="welcome-screen">
            <div className="welcome-icon">🤖</div>
            <h2>Welcome to Agent Flow</h2>
            <p>I'm your AI resume assistant. I can help you:</p>
            <div className="suggestion-chips">
              <button onClick={() => sendStreaming('Show me my resume')}>
                View my resume
              </button>
              <button onClick={() => sendStreaming('Analyze my resume and give me a score')}>
                Analyze my resume
              </button>
              <button onClick={() => sendStreaming('How can I improve my resume summary?')}>
                Improve my summary
              </button>
              <button onClick={() => sendStreaming('What skills should I add for a senior engineer role?')}>
                Skill suggestions
              </button>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} onSpeak={speak} />
        ))}

        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="chat-message assistant">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={sendStreaming}
        isLoading={isLoading}
        isListening={isListening}
        voiceSupported={voiceSupported}
        onVoiceToggle={handleVoiceToggle}
        transcript={transcript}
      />
    </div>
  );
}
