import React, { useState, useCallback, useRef, useEffect } from 'react';
import VoiceButton from './components/VoiceButton';
import ChatWindow from './components/ChatWindow';
import EmailConfirmation from './components/EmailConfirmation';
import StatusBar from './components/StatusBar';
import TextInput from './components/TextInput';
import AgentFlowCanvas from './components/AgentFlowCanvas';
import { useVoice } from './hooks/useVoice';
import { useSpeech } from './hooks/useSpeech';
import { useConversationFlow } from './hooks/useConversationFlow';
import { useIdleNudge } from './hooks/useIdleNudge';
import { confirmEmail, confirmWhatsApp } from './services/api';
import { getQuip } from './utils/personality';
import './styles/App.css';

function App() {
  const [started, setStarted] = useState(false); // splash screen gate
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('tamilAgentMessages');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [status, setStatus] = useState('idle');
  const [sessionId] = useState(() => `session_${Date.now()}`);

  // Agent flow state
  const [activeStep, setActiveStep] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [errorStep, setErrorStep] = useState(null);
  const [pipelineType, setPipelineType] = useState(null);

  const { speak, stop: stopSpeaking } = useSpeech();
  const flow = useConversationFlow();
  const autoListenRef = useRef(false);
  const flowStartedRef = useRef(false);
  const [listenTrigger, setListenTrigger] = useState(0); // triggers auto-listen effect

  // Persist messages
  useEffect(() => {
    sessionStorage.setItem('tamilAgentMessages', JSON.stringify(messages.slice(-50)));
  }, [messages]);

  const addMessage = useCallback((role, text) => {
    setMessages((prev) => [...prev, { role, text, timestamp: new Date() }]);
  }, []);

  // --- Pipeline helpers ---
  const advanceStep = useCallback((stepId) => {
    return new Promise((resolve) => {
      setActiveStep(stepId);
      setTimeout(() => {
        setCompletedSteps((prev) =>
          prev.includes(stepId) ? prev : [...prev, stepId]
        );
        resolve();
      }, 400);
    });
  }, []);

  const resetPipeline = useCallback(() => {
    setActiveStep(null);
    setCompletedSteps([]);
    setErrorStep(null);
    setPipelineType(null);
  }, []);

  // --- Speak then auto-listen ---
  const speakAndListen = useCallback(async (text) => {
    if (!text) return;
    addMessage('assistant', text);
    await speak(text);
    autoListenRef.current = true;
    setListenTrigger((n) => n + 1); // force the auto-listen effect to re-run
  }, [addMessage, speak]);

  // --- Idle nudge (when user doesn't respond) ---
  const handleNudge = useCallback(async (nudgeMsg) => {
    addMessage('assistant', nudgeMsg);
    await speak(nudgeMsg);
    autoListenRef.current = true;
    setListenTrigger((n) => n + 1);
  }, [addMessage, speak]);

  // --- Send the actual message ---
  const handleSend = useCallback(async (overrideData) => {
    const { channelType } = flow;
    const data = overrideData || flow.collected;
    const sendStep = channelType === 'whatsapp' ? 'whatsapp' : 'gmail';

    setStatus('sending');

    try {
      await advanceStep('validator');
      await new Promise((r) => setTimeout(r, 300));

      setActiveStep(sendStep);
      const sendFn = channelType === 'whatsapp' ? confirmWhatsApp : confirmEmail;
      const sendPromise = sendFn(sessionId, true, data);
      await new Promise((r) => setTimeout(r, 600));
      await sendPromise;
      setCompletedSteps((prev) => [...prev, sendStep]);

      await advanceStep('response');
      setActiveStep(null);

      const successMsg = `${getQuip('sendSuccess')} ${channelType === 'whatsapp' ? 'WhatsApp message' : 'Email'} sent to ${data.to}!`;
      addMessage('assistant', successMsg);
      await speak(successMsg);

      flow.markDone();

      const donePrompt = 'Is there anything else I can help you with? Say yes to start over, or no to finish.';
      await speakAndListen(donePrompt);
    } catch (err) {
      setErrorStep(sendStep);
      const label = channelType === 'whatsapp' ? 'WhatsApp message' : 'email';
      const errorMsg = `${getQuip('sendError')} Couldn't send the ${label}. ${err.message || ''}`;
      addMessage('assistant', errorMsg);
      await speak(errorMsg);

      // Offer retry instead of ending
      const retryPrompt = 'Would you like me to try again? Say yes to retry, or no to edit.';
      const confirmStep = channelType === 'whatsapp' ? 'WA_CONFIRM' : 'EM_CONFIRM';
      flow.goToStep(confirmStep);
      await speakAndListen(retryPrompt);
    } finally {
      setStatus('idle');
    }
  }, [flow, sessionId, addMessage, speak, advanceStep, speakAndListen]);

  // --- Main voice/text handler ---
  const handleInput = useCallback(async (transcript) => {
    if (!transcript.trim()) return;

    // Wake word detected — activate the agent
    if (transcript === '__WAKE__') {
      stopSpeaking();
      if (flow.step === 'IDLE' || flow.step === 'DONE') {
        addMessage('assistant', 'Yes! I\'m here. How can I help you?');
        const greeting = flow.startFlow();
        resetPipeline();
        await speakAndListen(greeting);
      } else {
        // Already in a flow — just start active listening
        addMessage('assistant', 'I\'m listening!');
        await speak('I\'m listening!');
        autoListenRef.current = true;
      }
      return;
    }

    stopSpeaking();
    addMessage('user', transcript);
    setStatus('processing');

    const result = flow.processInput(transcript);

    // Update pipeline type
    if (flow.channelType) {
      setPipelineType(flow.channelType);
    }

    // Animate pipeline
    if (result.pipelineStep) {
      await advanceStep(result.pipelineStep);
    }

    // Handle reset action
    if (result.action === 'reset') {
      resetPipeline();
      if (result.confirmation) {
        addMessage('assistant', result.confirmation);
        await speak(result.confirmation);
        await new Promise((r) => setTimeout(r, 200));
      }
      if (result.prompt) {
        await speakAndListen(result.prompt);
      }
      setStatus('idle');
      return;
    }

    // Handle read-back action (speak the composed message)
    if (result.action === 'readback') {
      if (result.confirmation) {
        addMessage('assistant', result.confirmation);
        await speak(result.confirmation);
        await new Promise((r) => setTimeout(r, 300));
      }
      if (result.prompt) {
        await speakAndListen(result.prompt);
      }
      setStatus('idle');
      return;
    }

    // Speak confirmation
    if (result.confirmation) {
      addMessage('assistant', result.confirmation);
      await speak(result.confirmation);
      await new Promise((r) => setTimeout(r, 250));
    }

    // Handle send action
    if (result.action === 'send') {
      setStatus('idle');
      await handleSend();
      return;
    }

    // Handle end action — keep step as DONE so passive wake-word listener activates
    if (result.action === 'end') {
      resetPipeline();
      // Don't flow.reset() — stay at DONE so "hey agent" wake word works
      setStatus('idle');
      return;
    }

    // Speak next prompt
    if (result.prompt) {
      await speakAndListen(result.prompt);
    }

    setStatus('idle');
  }, [flow, addMessage, stopSpeaking, speak, advanceStep, speakAndListen, handleSend, resetPipeline]);

  const { isListening, startListening, stopListening, startPassiveListening, passiveMode, permissionState } = useVoice(handleInput);

  // Idle nudge
  const { resetNudge } = useIdleNudge({
    isListening,
    onNudge: handleNudge,
    enabled: flow.step !== 'IDLE' && flow.step !== 'SENDING',
  });

  // Auto-listen after speaking — listenTrigger forces re-evaluation
  useEffect(() => {
    if (autoListenRef.current && !isListening && status === 'idle') {
      autoListenRef.current = false;
      const timer = setTimeout(() => {
        startListening();
      }, 400);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, status, startListening, listenTrigger]);

  // Start passive wake-word listening when flow is DONE (not IDLE — IDLE is pre-greeting)
  useEffect(() => {
    if (flow.step === 'DONE' && !isListening && status === 'idle' && permissionState === 'granted') {
      const timer = setTimeout(() => {
        startPassiveListening();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [flow.step, isListening, status, permissionState, startPassiveListening]);

  // Refs for greeting effect
  const flowRef = useRef(flow);
  const resetPipelineRef = useRef(resetPipeline);
  const speakAndListenRef = useRef(speakAndListen);
  useEffect(() => { flowRef.current = flow; }, [flow]);
  useEffect(() => { resetPipelineRef.current = resetPipeline; }, [resetPipeline]);
  useEffect(() => { speakAndListenRef.current = speakAndListen; }, [speakAndListen]);

  // Splash screen "Start" button — triggers greeting with guaranteed user gesture
  const handleStart = useCallback(async () => {
    if (flowStartedRef.current) return;
    flowStartedRef.current = true;
    setStarted(true);

    // Unlock speech synthesis (user gesture guarantees this works)
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    const warmup = new SpeechSynthesisUtterance('');
    warmup.volume = 0;
    window.speechSynthesis.speak(warmup);

    await new Promise((r) => setTimeout(r, 400));

    const greeting = flow.startFlow();
    resetPipeline();
    await speakAndListen(greeting);
  }, [flow, resetPipeline, speakAndListen]);

  // Manual mic click
  const handleMicStart = useCallback(() => {
    resetNudge();
    stopSpeaking();

    if (!flowStartedRef.current) {
      // First ever click — trigger greeting via handleStart
      handleStart();
      return;
    }

    if (flow.step === 'IDLE' || flow.step === 'DONE') {
      const greeting = flow.startFlow();
      resetPipeline();
      speakAndListen(greeting);
    } else if (flow.step === 'GREETING') {
      const greeting = 'Welcome to Tamil Voice Assistant. How can I help you today? Would you like to send a message via WhatsApp or Email?';
      flow.goToStep('AWAITING_TYPE');
      speakAndListen(greeting);
    } else {
      startListening();
    }
  }, [flow, startListening, resetPipeline, speakAndListen, resetNudge, stopSpeaking, handleStart]);

  // Open in local app
  const handleOpenLocal = useCallback((draftData) => {
    if (flow.channelType === 'whatsapp') {
      const phone = draftData.to.replace(/[^0-9+]/g, '');
      window.open(`https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(draftData.body)}`, '_blank');
      addMessage('assistant', 'Opened WhatsApp Web with your message draft.');
    } else {
      const { to, subject, body } = draftData;
      window.open(`mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
      addMessage('assistant', 'Opened your email app with the draft.');
    }
  }, [flow.channelType, addMessage]);

  // Manual confirm from UI card (FIX: pass data directly, don't mutate state)
  const handleManualConfirm = useCallback(async (confirmed, draftData) => {
    if (confirmed) {
      flow.updateCollected(draftData);
      await handleSend(draftData); // Pass directly to avoid stale closure
    } else {
      addMessage('assistant', getQuip('cancelled'));
      await speak(getQuip('cancelled'));
      flow.markDone();
      const donePrompt = 'Is there anything else I can help you with?';
      await speakAndListen(donePrompt);
    }
  }, [flow, handleSend, addMessage, speak, speakAndListen]);

  // Show confirm card at confirm/edit steps
  const showConfirmCard = ['WA_CONFIRM', 'EM_CONFIRM', 'EDIT_CHOICE'].includes(flow.step);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Tamil AI Voice Agent</h1>
        <p>Your AI-Powered Voice Assistant — Email & WhatsApp</p>
      </header>

      {/* Splash overlay — one click to unlock voice */}
      {!started && (
        <div className="splash-overlay" onClick={handleStart}>
          <div className="splash-content">
            <div className="splash-mic-icon">
              <svg viewBox="0 0 24 24" width="64" height="64" fill="#667eea">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </div>
            <h2>Tap to Start</h2>
            <p>Click anywhere to activate your voice assistant</p>
          </div>
        </div>
      )}

      <main className="app-main">
        {permissionState === 'denied' && (
          <div className="permission-banner">
            Microphone access is blocked. Please enable it in browser settings to use voice.
          </div>
        )}

        <AgentFlowCanvas
          pipelineType={pipelineType}
          activeStep={activeStep}
          completedSteps={completedSteps}
          errorStep={errorStep}
        />

        <ChatWindow messages={messages} />

        {showConfirmCard && flow.collected.to && (
          <EmailConfirmation
            emailData={flow.collected}
            type={flow.channelType || 'email'}
            onConfirm={handleManualConfirm}
            onOpenLocal={handleOpenLocal}
            disabled={status === 'sending'}
          />
        )}

        <div className="controls">
          <VoiceButton
            isListening={isListening}
            onStart={handleMicStart}
            onStop={stopListening}
            disabled={status === 'processing' || status === 'sending'}
          />
          <StatusBar
            status={status}
            isListening={isListening}
            actionType={flow.channelType}
            passiveMode={passiveMode}
          />
          <TextInput
            onSubmit={handleInput}
            disabled={status === 'processing' || status === 'sending'}
            placeholder={flow.step === 'IDLE' ? 'Click mic to start...' : 'Or type your response here...'}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
