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
      </button>
    </form>
  );
}

export default TextInput;
