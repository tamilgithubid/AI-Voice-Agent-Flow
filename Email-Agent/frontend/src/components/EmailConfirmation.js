import React, { useState, useEffect } from 'react';

function EmailConfirmation({ emailData, onConfirm, onOpenLocal, disabled }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ to: '', subject: '', body: '' });

  // Sync draft with incoming emailData
  useEffect(() => {
    setDraft({
      to: emailData.to || '',
      subject: emailData.subject || '',
      body: emailData.body || '',
    });
  }, [emailData]);

  const handleChange = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSend = () => {
    onConfirm(true, draft);
  };

  const handleCancel = () => {
    onConfirm(false, draft);
  };

  const handleOpenLocal = () => {
    if (onOpenLocal) {
      onOpenLocal(draft);
    }
  };

  return (
    <div className="email-confirmation">
      <h3>Email Draft</h3>

      <div className="email-field">
        <label>To:</label>
        {editing ? (
          <input
            type="email"
            value={draft.to}
            onChange={(e) => handleChange('to', e.target.value)}
            autoFocus
          />
        ) : (
          <span>{draft.to}</span>
        )}
      </div>

      <div className="email-field">
        <label>Subject:</label>
        {editing ? (
          <input
            type="text"
            value={draft.subject}
            onChange={(e) => handleChange('subject', e.target.value)}
          />
        ) : (
          <span>{draft.subject}</span>
        )}
      </div>

      <div className="email-field">
        <label>Body:</label>
        {editing ? (
          <textarea
            value={draft.body}
            onChange={(e) => handleChange('body', e.target.value)}
            rows={6}
          />
        ) : (
          <p className="email-body">{draft.body}</p>
        )}
      </div>

      <div className="email-actions">
        <button
          className="btn btn-edit"
          onClick={() => setEditing(!editing)}
          disabled={disabled}
        >
          {editing ? 'Done Editing' : 'Edit'}
        </button>
        <button
          className="btn btn-local"
          onClick={handleOpenLocal}
          disabled={disabled}
          title="Open in your default email app"
        >
          Open in Mail
        </button>
        <button
          className="btn btn-cancel"
          onClick={handleCancel}
          disabled={disabled}
        >
          Cancel
        </button>
        <button
          className="btn btn-send"
          onClick={handleSend}
          disabled={disabled}
        >
          {disabled ? 'Sending...' : 'Send Email'}
        </button>
      </div>
    </div>
  );
}

export default EmailConfirmation;
