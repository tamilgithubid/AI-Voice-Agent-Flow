import React, { useState } from 'react';

function TextInput({ onSubmit, disabled, placeholder }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSubmit(text.trim());
      setText('');
    }
  };

  return (
    <form className="text-input-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="text-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder || 'Or type your response here...'}
        disabled={disabled}
      />
      <button
        type="submit"
        className="btn btn-text-send"
        disabled={disabled || !text.trim()}
      >
        Send
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </button>
    </form>
  );
}

export default TextInput;
