import React, { useState, useEffect } from 'react';
import { smartCompose } from '../services/api';

function EmailConfirmation({ emailData, onConfirm, onOpenLocal, disabled, type = 'email' }) {
  const isWhatsApp = type === 'whatsapp';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ to: '', subject: '', body: '' });
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceInfo, setEnhanceInfo] = useState(null);

  useEffect(() => {
    setDraft({
      to: emailData.to || '',
      subject: emailData.subject || '',
      body: emailData.body || '',
    });
    setEnhanceInfo(null);
  }, [emailData]);

  const handleChange = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSend = () => onConfirm(true, draft);
  const handleCancel = () => onConfirm(false, draft);
  const handleOpenLocal = () => onOpenLocal && onOpenLocal(draft);

  // AI Smart Compose
  const handleSmartCompose = async () => {
    setEnhancing(true);
    setEnhanceInfo(null);
    try {
      const result = await smartCompose({
        body: draft.body,
        subject: draft.subject,
        type: isWhatsApp ? 'whatsapp' : 'email',
      });
      if (result.data) {
        setDraft((prev) => ({
          ...prev,
          body: result.data.enhanced || prev.body,
          subject: result.data.subject || prev.subject,
        }));
        setEnhanceInfo(result.data.changes || 'Message enhanced!');
      }
    } catch (err) {
      setEnhanceInfo('Could not enhance — try again.');
    } finally {
      setEnhancing(false);
    }
  };

  return (
    <div className={`email-confirmation ${isWhatsApp ? 'whatsapp' : ''}`}>
      <h3>{isWhatsApp ? 'WhatsApp Message Draft' : 'Email Draft'}</h3>

      <div className="email-field">
        <label>{isWhatsApp ? 'Phone:' : 'To:'}</label>
        {editing ? (
          <input
            type={isWhatsApp ? 'tel' : 'email'}
            value={draft.to}
            onChange={(e) => handleChange('to', e.target.value)}
            placeholder={isWhatsApp ? '+91XXXXXXXXXX' : 'email@example.com'}
            autoFocus
          />
        ) : (
          <span>{draft.to}</span>
        )}
      </div>

      {!isWhatsApp && (
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
      )}

      <div className="email-field">
        <label>{isWhatsApp ? 'Message:' : 'Body:'}</label>
        {editing ? (
          <textarea
            value={draft.body}
            onChange={(e) => handleChange('body', e.target.value)}
            rows={isWhatsApp ? 4 : 6}
          />
        ) : (
          <p className="email-body">{draft.body}</p>
        )}
      </div>

      {enhanceInfo && (
        <div className="enhance-info">
          AI: {enhanceInfo}
        </div>
      )}

      <div className="email-actions">
        <button
          className="btn btn-edit"
          onClick={() => setEditing(!editing)}
          disabled={disabled}
        >
          {editing ? 'Done Editing' : 'Edit'}
        </button>
        <button
          className="btn btn-smart-compose"
          onClick={handleSmartCompose}
          disabled={disabled || enhancing}
          title="AI will enhance your message"
        >
          {enhancing ? 'Enhancing...' : 'AI Enhance'}
        </button>
        <button
          className={`btn ${isWhatsApp ? 'btn-whatsapp-open' : 'btn-local'}`}
          onClick={handleOpenLocal}
          disabled={disabled}
        >
          {isWhatsApp ? 'Open WhatsApp' : 'Open in Mail'}
        </button>
        <button className="btn btn-cancel" onClick={handleCancel} disabled={disabled}>
          Cancel
        </button>
        <button
          className={`btn ${isWhatsApp ? 'btn-whatsapp-send' : 'btn-send'}`}
          onClick={handleSend}
          disabled={disabled}
        >
          {disabled ? 'Sending...' : isWhatsApp ? 'Send WhatsApp' : 'Send Email'}
        </button>
      </div>
    </div>
  );
}

export default EmailConfirmation;
