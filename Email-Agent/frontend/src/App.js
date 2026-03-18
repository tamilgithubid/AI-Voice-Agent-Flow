import React, { useState, useCallback, useRef } from 'react';
import VoiceButton from './components/VoiceButton';
import ChatWindow from './components/ChatWindow';
import EmailConfirmation from './components/EmailConfirmation';
import StatusBar from './components/StatusBar';
import AgentFlowCanvas from './components/AgentFlowCanvas';
import { useVoice } from './hooks/useVoice';
import { useSpeech } from './hooks/useSpeech';
import { sendMessage, confirmEmail } from './services/api';
import './styles/App.css';

const PIPELINE_STEPS = ['voice', 'intent', 'composer', 'router', 'validator', 'gmail', 'response'];

function App() {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('idle');
  const [pendingEmail, setPendingEmail] = useState(null);
  const [sessionId] = useState(() => `session_${Date.now()}`);

  // Agent flow state
  const [activeStep, setActiveStep] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [errorStep, setErrorStep] = useState(null);

  const { speak, stop: stopSpeaking } = useSpeech();
  const activeStepRef = useRef(null);

  const addMessage = useCallback((role, text) => {
    setMessages((prev) => [...prev, { role, text, timestamp: new Date() }]);
  }, []);

  // --- Pipeline animation helpers ---
  const advanceStep = useCallback((stepId) => {
    return new Promise((resolve) => {
      setActiveStep(stepId);
      activeStepRef.current = stepId;
      setTimeout(() => {
        setCompletedSteps((prev) =>
          prev.includes(stepId) ? prev : [...prev, stepId]
        );
        resolve();
      }, 500);
    });
  }, []);

  const resetPipeline = useCallback(() => {
    setActiveStep(null);
    setCompletedSteps([]);
    setErrorStep(null);
    activeStepRef.current = null;
  }, []);

  const animateThrough = useCallback(async (stopAtStep) => {
    const stopIndex = PIPELINE_STEPS.indexOf(stopAtStep);
    for (let i = 0; i <= stopIndex; i++) {
      await advanceStep(PIPELINE_STEPS[i]);
      if (i < stopIndex) await new Promise((r) => setTimeout(r, 150));
    }
  }, [advanceStep]);

  // --- Open in local email client via mailto: ---
  const openInLocalMail = useCallback((emailData) => {
    const { to, subject, body } = emailData;
    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, '_blank');
    addMessage('assistant', `Opened your default email app with the draft to ${to}.`);
    speak(`Opening your email app with the draft.`);
    setPendingEmail(null);
    resetPipeline();
  }, [addMessage, speak, resetPipeline]);

  // --- Main voice handler ---
  const handleVoiceResult = useCallback(async (transcript) => {
    if (!transcript.trim()) return;

    // Stop any ongoing speech before processing
    stopSpeaking();

    addMessage('user', transcript);
    setStatus('processing');
    resetPipeline();

    try {
      // Animate voice capture
      await advanceStep('voice');

      // Fire API request
      const responsePromise = sendMessage(transcript, sessionId);

      // Animate processing steps while waiting
      await animateThrough('router');

      const response = await responsePromise;
      const data = response.data;

      if (data.action === 'send_email' || data.action === 'draft_email') {
        // Show email draft for confirmation
        setPendingEmail({
          to: data.to,
          subject: data.subject,
          body: data.body,
        });

        const confirmMsg = `I've drafted an email to ${data.to} with subject "${data.subject}". You can edit it, send it, or open it in your mail app.`;
        addMessage('assistant', confirmMsg);
        await animateThrough('response');
        speak(confirmMsg);
      } else {
        // Chat response
        const msg = data.response || data.message || 'I processed your request.';
        addMessage('assistant', msg);
        await animateThrough('response');
        speak(msg);
      }
    } catch (err) {
      setErrorStep(activeStepRef.current || 'intent');
      const errorMsg = 'Sorry, I had trouble processing that. Please try again.';
      addMessage('assistant', errorMsg);
      speak(errorMsg);
    } finally {
      setStatus('idle');
    }
  }, [addMessage, sessionId, speak, stopSpeaking, resetPipeline, advanceStep, animateThrough]);

  // --- Email confirm/cancel handler ---
  const handleConfirm = useCallback(async (confirmed, emailData) => {
    setStatus('sending');
    stopSpeaking();

    // Keep earlier steps completed
    setCompletedSteps(['voice', 'intent', 'composer', 'router']);
    setErrorStep(null);

    try {
      if (confirmed) {
        await advanceStep('validator');
        await new Promise((r) => setTimeout(r, 300));

        setActiveStep('gmail');
        const sendPromise = confirmEmail(sessionId, true, emailData);
        await new Promise((r) => setTimeout(r, 600));
        await sendPromise;
        setCompletedSteps((prev) => [...prev, 'gmail']);

        await advanceStep('response');
        setActiveStep(null);

        const successMsg = `Email sent to ${emailData.to} successfully!`;
        addMessage('assistant', successMsg);
        speak(successMsg);
      } else {
        await advanceStep('response');
        setActiveStep(null);

        addMessage('assistant', 'Email cancelled.');
        speak('Email cancelled.');
      }
    } catch (err) {
      setErrorStep('gmail');
      const errorMsg = 'Failed to send the email. You can try "Open in Mail" to use your local email app.';
      addMessage('assistant', errorMsg);
      speak(errorMsg);
    } finally {
      setPendingEmail(null);
      setStatus('idle');
    }
  }, [addMessage, sessionId, speak, stopSpeaking, advanceStep]);

  const { isListening, startListening, stopListening, permissionState } = useVoice(handleVoiceResult);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Voice Email Agent</h1>
        <p>Your AI-Powered Personal Email Assistant</p>
      </header>

      <main className="app-main">
        {/* Permission banner */}
        {permissionState === 'denied' && (
          <div className="permission-banner">
            Microphone access is blocked. Please enable it in browser settings to use voice.
          </div>
        )}

        {/* Animated Agent Flow */}
        <AgentFlowCanvas
          activeStep={activeStep}
          completedSteps={completedSteps}
          errorStep={errorStep}
        />

        <ChatWindow messages={messages} />

        {pendingEmail && (
          <EmailConfirmation
            emailData={pendingEmail}
            onConfirm={handleConfirm}
            onOpenLocal={openInLocalMail}
            disabled={status === 'sending'}
          />
        )}

        <div className="controls">
          <VoiceButton
            isListening={isListening}
            onStart={startListening}
            onStop={stopListening}
            disabled={status === 'processing' || status === 'sending'}
          />
          <StatusBar status={status} isListening={isListening} />
        </div>
      </main>
    </div>
  );
}

export default App;
