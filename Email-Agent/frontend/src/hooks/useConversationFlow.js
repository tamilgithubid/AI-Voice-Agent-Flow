import { useState, useCallback } from 'react';
import { getQuip } from '../utils/personality';
import { findContact, saveContact } from '../utils/contacts';
import { findTemplate, getTemplateNames } from '../utils/templates';

const STEPS = {
  IDLE: 'IDLE',
  GREETING: 'GREETING',
  AWAITING_TYPE: 'AWAITING_TYPE',
  WA_RECIPIENT: 'WA_RECIPIENT',
  WA_MESSAGE: 'WA_MESSAGE',
  WA_CONFIRM: 'WA_CONFIRM',
  EM_RECIPIENT: 'EM_RECIPIENT',
  EM_SUBJECT: 'EM_SUBJECT',
  EM_BODY: 'EM_BODY',
  EM_CONFIRM: 'EM_CONFIRM',
  SENDING: 'SENDING',
  DONE: 'DONE',
  EDIT_CHOICE: 'EDIT_CHOICE',
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// Validate email format
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Clean speech-to-text email artifacts
function cleanEmailFromSpeech(transcript) {
  return transcript.trim()
    .toLowerCase()
    .replace(/\s*at\s*the\s*rate\s*(of)?\s*/gi, '@')
    .replace(/\s+at\s+/gi, '@')
    .replace(/\s+dot\s+/gi, '.')
    .replace(/\s+dash\s+/gi, '-')
    .replace(/\s+underscore\s+/gi, '_')
    .replace(/\s+hyphen\s+/gi, '-')
    .replace(/\s/g, '');
}

// Clean phone from speech
function cleanPhoneFromSpeech(transcript) {
  // Map spoken words to digits
  const wordMap = {
    zero: '0', one: '1', two: '2', three: '3', four: '4',
    five: '5', six: '6', seven: '7', eight: '8', nine: '9',
    oh: '0', o: '0', to: '2', too: '2', for: '4',
  };

  let cleaned = transcript.toLowerCase();
  Object.entries(wordMap).forEach(([word, digit]) => {
    cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, 'g'), digit);
  });

  // Keep only digits and +
  let phone = cleaned.replace(/[^0-9+]/g, '');

  if (!phone.startsWith('+') && phone.length === 10) {
    phone = '+91' + phone;
  } else if (!phone.startsWith('+') && phone.length > 10) {
    phone = '+' + phone;
  }

  return phone;
}

export function useConversationFlow() {
  const [step, setStep] = useState(STEPS.IDLE);
  const [channelType, setChannelType] = useState(null);
  const [collected, setCollected] = useState({ to: '', subject: '', body: '' });
  const [retryCount, setRetryCount] = useState({});

  // Update collected data (for edits from UI)
  const updateCollected = useCallback((newData) => {
    setCollected((prev) => ({ ...prev, ...newData }));
  }, []);

  // Track retries per step
  const incrementRetry = useCallback((stepName) => {
    setRetryCount((prev) => ({ ...prev, [stepName]: (prev[stepName] || 0) + 1 }));
    return (retryCount[stepName] || 0) + 1;
  }, [retryCount]);

  const resetRetries = useCallback(() => {
    setRetryCount({});
  }, []);

  const getPromptForStep = useCallback((currentStep) => {
    switch (currentStep) {
      case STEPS.GREETING:
        return `${getGreeting()}! Welcome to Tamil Voice Assistant. How can I help you today?`;
      case STEPS.AWAITING_TYPE:
        return 'Would you like to send a message via WhatsApp or Email?';
      case STEPS.WA_RECIPIENT:
        return 'Please tell me the recipient phone number with country code.';
      case STEPS.WA_MESSAGE:
        return 'Please tell me the message you want to send.';
      case STEPS.WA_CONFIRM:
        return 'Would you like to proceed and send this WhatsApp message? Say Yes or No.';
      case STEPS.EM_RECIPIENT:
        return 'Please tell me the recipient email address. For example, say john at gmail dot com.';
      case STEPS.EM_SUBJECT:
        return 'Please tell me the subject of the email.';
      case STEPS.EM_BODY:
        return 'Please tell me the body of the email.';
      case STEPS.EM_CONFIRM:
        return 'Would you like to proceed and send this email? Say Yes or No.';
      case STEPS.EDIT_CHOICE:
        return 'What would you like to edit? Say recipient, subject, message, or say cancel to discard.';
      case STEPS.DONE:
        return 'Is there anything else I can help you with? Say yes to start over, or no to finish.';
      default:
        return '';
    }
  }, []);

  const startFlow = useCallback(() => {
    setStep(STEPS.GREETING);
    setChannelType(null);
    setCollected({ to: '', subject: '', body: '' });
    resetRetries();
    return getPromptForStep(STEPS.GREETING);
  }, [getPromptForStep, resetRetries]);

  const processInput = useCallback((transcript) => {
    const input = transcript.trim().toLowerCase();

    // ---- Global interrupts ----
    if (['stop everything', 'cancel everything', 'start over', 'reset', 'restart'].some(cmd => input.includes(cmd))) {
      const prompt = startFlow();
      return {
        confirmation: 'No problem, starting fresh!',
        prompt,
        pipelineStep: null,
        action: 'reset',
      };
    }

    // ---- Voice shortcut: "read back" / "read it back" ----
    if ((input.includes('read back') || input.includes('read it back') || input.includes('read my message')) &&
        ['WA_CONFIRM', 'EM_CONFIRM', 'EDIT_CHOICE'].includes(step)) {
      const parts = [];
      if (collected.to) parts.push(`To: ${collected.to}`);
      if (collected.subject) parts.push(`Subject: ${collected.subject}`);
      if (collected.body) parts.push(`Message: ${collected.body}`);
      const readBack = parts.length ? parts.join('. ') : 'Nothing composed yet.';
      return {
        confirmation: `Here's what I have. ${readBack}`,
        prompt: 'Shall I send it, or would you like to edit?',
        pipelineStep: null,
        action: 'readback',
      };
    }

    // ---- Voice shortcut: "list templates" ----
    if (input.includes('list template') || input.includes('show template') || input.includes('what template')) {
      const names = getTemplateNames();
      return {
        confirmation: `Available templates: ${names.join(', ')}.`,
        prompt: 'Say "use" followed by a template name, like "use running late".',
        pipelineStep: null,
      };
    }

    // ---- Voice shortcut: "use template <name>" ----
    if ((input.includes('template') || input.includes('use ')) && step !== STEPS.IDLE) {
      const templateQuery = input.replace(/use\s+/i, '').replace(/template\s*/i, '').trim();
      const template = findTemplate(templateQuery);
      if (template) {
        const isWA = channelType === 'whatsapp';
        if (isWA) {
          setCollected((prev) => ({ ...prev, body: template.whatsapp }));
          if (step === STEPS.WA_MESSAGE || step === STEPS.WA_CONFIRM || step === STEPS.EDIT_CHOICE) {
            setStep(STEPS.WA_CONFIRM);
            return {
              confirmation: `Applied "${template.name}" template!`,
              prompt: 'Ready to send? Say Yes or No.',
              pipelineStep: 'router',
            };
          }
        } else {
          setCollected((prev) => ({
            ...prev,
            subject: template.email.subject,
            body: template.email.body,
          }));
          if ([STEPS.EM_SUBJECT, STEPS.EM_BODY, STEPS.EM_CONFIRM, STEPS.EDIT_CHOICE].includes(step)) {
            setStep(STEPS.EM_CONFIRM);
            return {
              confirmation: `Applied "${template.name}" template!`,
              prompt: 'Ready to send? Say Yes or No.',
              pipelineStep: 'router',
            };
          }
        }
      }
    }

    // ---- Voice shortcut: "save contact <name>" ----
    if (input.includes('save contact') || input.includes('add contact')) {
      const nameMatch = input.replace(/save contact|add contact/i, '').trim();
      if (nameMatch && collected.to) {
        const isWA = channelType === 'whatsapp';
        const saved = saveContact({
          name: nameMatch,
          phone: isWA ? collected.to : '',
          email: !isWA ? collected.to : '',
        });
        return {
          confirmation: `Saved ${saved.name} to your contacts!`,
          prompt: null,
          pipelineStep: null,
        };
      }
      return {
        confirmation: 'No recipient to save yet. Please provide a recipient first.',
        prompt: null,
        pipelineStep: null,
      };
    }

    // ---- Contact lookup at recipient steps ----
    if ((step === STEPS.WA_RECIPIENT || step === STEPS.EM_RECIPIENT) && !input.match(/[\d@]/)) {
      // If input looks like a name (no digits/@ symbols), try contact lookup
      const contact = findContact(input);
      if (contact) {
        if (step === STEPS.WA_RECIPIENT && contact.phone) {
          setCollected((prev) => ({ ...prev, to: contact.phone }));
          setStep(STEPS.WA_MESSAGE);
          return {
            confirmation: `Found ${contact.name} in your contacts! Sending to ${contact.phone}.`,
            prompt: getPromptForStep(STEPS.WA_MESSAGE),
            pipelineStep: 'composer',
          };
        } else if (step === STEPS.EM_RECIPIENT && contact.email) {
          setCollected((prev) => ({ ...prev, to: contact.email }));
          setStep(STEPS.EM_SUBJECT);
          return {
            confirmation: `Found ${contact.name} in your contacts! Sending to ${contact.email}.`,
            prompt: getPromptForStep(STEPS.EM_SUBJECT),
            pipelineStep: 'composer',
          };
        }
      }
    }

    switch (step) {
      case STEPS.GREETING: {
        setStep(STEPS.AWAITING_TYPE);
        return {
          confirmation: null,
          prompt: getPromptForStep(STEPS.AWAITING_TYPE),
          pipelineStep: 'voice',
        };
      }

      case STEPS.AWAITING_TYPE: {
        if (input.includes('whatsapp') || input.includes('what\'s app') || input.includes('whats app')) {
          setChannelType('whatsapp');
          setStep(STEPS.WA_RECIPIENT);
          return {
            confirmation: getQuip('afterTypeWhatsApp'),
            prompt: getPromptForStep(STEPS.WA_RECIPIENT),
            pipelineStep: 'intent',
          };
        } else if (input.includes('email') || input.includes('mail') || input.includes('e-mail')) {
          setChannelType('email');
          setStep(STEPS.EM_RECIPIENT);
          return {
            confirmation: getQuip('afterTypeEmail'),
            prompt: getPromptForStep(STEPS.EM_RECIPIENT),
            pipelineStep: 'intent',
          };
        } else {
          const count = incrementRetry('AWAITING_TYPE');
          if (count >= 3) {
            return {
              confirmation: 'Having trouble hearing you clearly.',
              prompt: 'Just say the word "WhatsApp" or "Email" and I\'ll get it!',
              pipelineStep: null,
            };
          }
          return {
            confirmation: null,
            prompt: 'I didn\'t quite catch that. Would you like to send via WhatsApp or Email?',
            pipelineStep: null,
          };
        }
      }

      // ---- WhatsApp Flow ----
      case STEPS.WA_RECIPIENT: {
        const phone = cleanPhoneFromSpeech(transcript);
        const digits = phone.replace(/\D/g, '');

        if (digits.length < 7) {
          const count = incrementRetry('WA_RECIPIENT');
          if (count >= 3) {
            return {
              confirmation: `I heard "${transcript}" but couldn't extract a valid number.`,
              prompt: 'Try saying the digits slowly, like "plus 9 1 9 8 7 6 5 4 3 2 1 0".',
              pipelineStep: null,
            };
          }
          return {
            confirmation: `I heard "${phone}" but that doesn't seem like a complete number.`,
            prompt: 'Please tell me the full phone number with country code, like plus 91 followed by 10 digits.',
            pipelineStep: null,
          };
        }

        setCollected((prev) => ({ ...prev, to: phone }));
        setStep(STEPS.WA_MESSAGE);
        return {
          confirmation: `${getQuip('afterRecipient')} Recipient is ${phone}.`,
          prompt: getPromptForStep(STEPS.WA_MESSAGE),
          pipelineStep: 'composer',
        };
      }

      case STEPS.WA_MESSAGE: {
        if (transcript.trim().length < 2) {
          return {
            confirmation: null,
            prompt: 'The message seems too short. Please tell me what you\'d like to say.',
            pipelineStep: null,
          };
        }
        setCollected((prev) => ({ ...prev, body: transcript.trim() }));
        setStep(STEPS.WA_CONFIRM);
        return {
          confirmation: getQuip('afterBody'),
          prompt: getPromptForStep(STEPS.WA_CONFIRM),
          pipelineStep: 'router',
        };
      }

      case STEPS.WA_CONFIRM: {
        if (['yes', 'yeah', 'sure', 'send', 'proceed', 'go ahead', 'do it', 'confirm'].some(w => input.includes(w))) {
          setStep(STEPS.SENDING);
          return {
            confirmation: 'Sending your WhatsApp message now...',
            prompt: null,
            pipelineStep: 'validator',
            action: 'send',
          };
        } else if (['no', 'cancel', 'don\'t', 'stop', 'wait', 'hold', 'edit'].some(w => input.includes(w))) {
          setStep(STEPS.EDIT_CHOICE);
          return {
            confirmation: 'No problem!',
            prompt: 'Would you like to edit something or cancel entirely?',
            pipelineStep: null,
          };
        }
        return {
          confirmation: null,
          prompt: 'Please say Yes to send, or No to edit or cancel.',
          pipelineStep: null,
        };
      }

      // ---- Email Flow ----
      case STEPS.EM_RECIPIENT: {
        const email = cleanEmailFromSpeech(transcript);

        if (!isValidEmail(email)) {
          const count = incrementRetry('EM_RECIPIENT');
          if (count >= 3) {
            return {
              confirmation: `I heard "${email}" but it doesn't look right.`,
              prompt: 'Try saying it slowly like "john at gmail dot com". Or you can type it in the card below.',
              pipelineStep: null,
            };
          }
          return {
            confirmation: `I heard "${email}" but that doesn't look like a valid email.`,
            prompt: 'Please say the email address again. For example, "john at gmail dot com".',
            pipelineStep: null,
          };
        }

        setCollected((prev) => ({ ...prev, to: email }));
        setStep(STEPS.EM_SUBJECT);
        return {
          confirmation: `${getQuip('afterRecipient')} Sending to ${email}.`,
          prompt: getPromptForStep(STEPS.EM_SUBJECT),
          pipelineStep: 'composer',
        };
      }

      case STEPS.EM_SUBJECT: {
        if (transcript.trim().length < 2) {
          return {
            confirmation: null,
            prompt: 'That was too short for a subject. What should the email subject be?',
            pipelineStep: null,
          };
        }
        setCollected((prev) => ({ ...prev, subject: transcript.trim() }));
        setStep(STEPS.EM_BODY);
        return {
          confirmation: `${getQuip('afterSubject')}`,
          prompt: getPromptForStep(STEPS.EM_BODY),
          pipelineStep: 'composer',
        };
      }

      case STEPS.EM_BODY: {
        if (transcript.trim().length < 2) {
          return {
            confirmation: null,
            prompt: 'The body seems too short. Please tell me what you\'d like to write.',
            pipelineStep: null,
          };
        }
        setCollected((prev) => ({ ...prev, body: transcript.trim() }));
        setStep(STEPS.EM_CONFIRM);
        return {
          confirmation: getQuip('afterBody'),
          prompt: getPromptForStep(STEPS.EM_CONFIRM),
          pipelineStep: 'router',
        };
      }

      case STEPS.EM_CONFIRM: {
        if (['yes', 'yeah', 'sure', 'send', 'proceed', 'go ahead', 'do it', 'confirm'].some(w => input.includes(w))) {
          setStep(STEPS.SENDING);
          return {
            confirmation: 'Sending your email now...',
            prompt: null,
            pipelineStep: 'validator',
            action: 'send',
          };
        } else if (['no', 'cancel', 'don\'t', 'stop', 'wait', 'hold', 'edit'].some(w => input.includes(w))) {
          setStep(STEPS.EDIT_CHOICE);
          return {
            confirmation: 'No problem!',
            prompt: 'Would you like to edit something or cancel entirely?',
            pipelineStep: null,
          };
        }
        return {
          confirmation: null,
          prompt: 'Please say Yes to send, or No to edit or cancel.',
          pipelineStep: null,
        };
      }

      // ---- Edit / Cancel ----
      case STEPS.EDIT_CHOICE: {
        if (input.includes('cancel') || input.includes('discard') || input.includes('forget')) {
          setStep(STEPS.DONE);
          setCollected({ to: '', subject: '', body: '' });
          return {
            confirmation: getQuip('cancelled'),
            prompt: getPromptForStep(STEPS.DONE),
            pipelineStep: null,
          };
        } else if (input.includes('recipient') || input.includes('number') || input.includes('phone') || input.includes('email') || input.includes('address') || input.includes('to')) {
          const nextStep = channelType === 'whatsapp' ? STEPS.WA_RECIPIENT : STEPS.EM_RECIPIENT;
          setStep(nextStep);
          return {
            confirmation: 'Let\'s update the recipient.',
            prompt: getPromptForStep(nextStep),
            pipelineStep: null,
          };
        } else if (input.includes('subject') || input.includes('title')) {
          if (channelType === 'email') {
            setStep(STEPS.EM_SUBJECT);
            return {
              confirmation: 'Let\'s update the subject.',
              prompt: getPromptForStep(STEPS.EM_SUBJECT),
              pipelineStep: null,
            };
          }
        } else if (input.includes('message') || input.includes('body') || input.includes('content') || input.includes('text')) {
          const nextStep = channelType === 'whatsapp' ? STEPS.WA_MESSAGE : STEPS.EM_BODY;
          setStep(nextStep);
          return {
            confirmation: 'Let\'s update the message.',
            prompt: getPromptForStep(nextStep),
            pipelineStep: null,
          };
        }
        return {
          confirmation: null,
          prompt: 'Say recipient, subject, or message to edit that field. Or say cancel to discard.',
          pipelineStep: null,
        };
      }

      // ---- Done / Restart ----
      case STEPS.DONE: {
        if (['yes', 'yeah', 'sure', 'another', 'again', 'more'].some(w => input.includes(w))) {
          const prompt = startFlow();
          return { confirmation: 'Great, let\'s go again!', prompt, pipelineStep: null };
        }
        return {
          confirmation: getQuip('goodbye'),
          prompt: null,
          pipelineStep: null,
          action: 'end',
        };
      }

      default:
        return { confirmation: null, prompt: null, pipelineStep: null };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, channelType, collected.to, collected.subject, collected.body, getPromptForStep, startFlow, incrementRetry]);

  const markDone = useCallback(() => setStep(STEPS.DONE), []);

  const goToStep = useCallback((stepName) => setStep(stepName), []);

  const reset = useCallback(() => {
    setStep(STEPS.IDLE);
    setChannelType(null);
    setCollected({ to: '', subject: '', body: '' });
    resetRetries();
  }, [resetRetries]);

  return {
    step,
    channelType,
    collected,
    updateCollected,
    startFlow,
    processInput,
    markDone,
    goToStep,
    reset,
    STEPS,
  };
}
