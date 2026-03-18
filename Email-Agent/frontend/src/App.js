import React, { useState, useCallback, useRef, useEffect } from 'react';
import VoiceButton from './components/VoiceButton';
import ChatWindow from './components/ChatWindow';
import EmailConfirmation from './components/EmailConfirmation';
import StatusBar from './components/StatusBar';
import TextInput from './components/TextInput';
import AgentFlowCanvas from './components/AgentFlowCanvas';
import CharacterSelect from './components/CharacterSelect';
import { useVoice } from './hooks/useVoice';
import { useSpeech } from './hooks/useSpeech';
import { useConversationFlow } from './hooks/useConversationFlow';
import { useIdleNudge } from './hooks/useIdleNudge';
import { confirmEmail, confirmWhatsApp, chatWithAI } from './services/api';
import { getQuip } from './utils/personality';
import './styles/App.css';

function App() {
  const [started, setStarted] = useState(false); // splash screen gate
  const [characterSelected, setCharacterSelected] = useState(() => {
    try { return localStorage.getItem('tamilAgent_characterSelected') === 'true'; }
    catch { return false; }
  });
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

  // Mode preferences (persisted in localStorage)
  const [voiceGender, setVoiceGender] = useState(() => {
    try { return localStorage.getItem('tamilAgent_voiceGender') || 'female'; }
    catch { return 'female'; }
  });
  const [chatMode, setChatMode] = useState(() => {
    try { return localStorage.getItem('tamilAgent_chatMode') || 'general'; }
    catch { return 'general'; }
  });

  const handleVoiceChange = useCallback((gender) => {
    setVoiceGender(gender);
    localStorage.setItem('tamilAgent_voiceGender', gender);
  }, []);

  const handleModeChange = useCallback((mode) => {
    setChatMode(mode);
    localStorage.setItem('tamilAgent_chatMode', mode);
  }, []);

  const [selectedVoiceId, setSelectedVoiceId] = useState(() => {
    try { return localStorage.getItem('tamilAgent_voiceId') || ''; }
    catch { return ''; }
  });
  const [charName, setCharName] = useState(() => {
    try { return localStorage.getItem('tamilAgent_charName') || 'Nova'; }
    catch { return 'Nova'; }
  });

  const { speak, stop: stopSpeaking } = useSpeech(voiceGender, chatMode, selectedVoiceId);
  const flow = useConversationFlow(chatMode, charName);
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

    // Handle chat action — call AI backend
    if (result.action === 'chat') {
      // Auto-mode detection from romantic keywords
      let activeChatMode = chatMode;
      if (result.modeSwitch === 'romantic' && chatMode === 'general') {
        const autoMode = voiceGender === 'male' ? 'girlfriend' : 'boyfriend';
        handleModeChange(autoMode);
        activeChatMode = autoMode;
      }

      setStatus('processing');
      try {
        const chatResponse = await chatWithAI(
          result.chatInput || transcript,
          flow.chatHistory,
          sessionId,
          activeChatMode
        );

        const { intent, response: aiResponse } = chatResponse.data;

        // If LLM detected intent to send email/whatsapp, switch modes
        if (intent === 'send_email') {
          flow.addToChatHistory('assistant', aiResponse);
          // Use processInput with keyword to properly set channelType
          const switchResult = flow.processInput('email');
          setPipelineType('email');
          addMessage('assistant', aiResponse);
          await speak(aiResponse);
          await new Promise((r) => setTimeout(r, 200));
          if (switchResult.prompt) {
            await speakAndListen(switchResult.prompt);
          }
          setStatus('idle');
          return;
        }
        if (intent === 'send_whatsapp') {
          flow.addToChatHistory('assistant', aiResponse);
          // Use processInput with keyword to properly set channelType
          const switchResult = flow.processInput('whatsapp');
          setPipelineType('whatsapp');
          addMessage('assistant', aiResponse);
          await speak(aiResponse);
          await new Promise((r) => setTimeout(r, 200));
          if (switchResult.prompt) {
            await speakAndListen(switchResult.prompt);
          }
          setStatus('idle');
          return;
        }

        // Regular chat response
        flow.addToChatHistory('assistant', aiResponse);
        await advanceStep('response');
        setActiveStep(null);
        setPipelineType('chat');
        await speakAndListen(aiResponse);
      } catch (err) {
        const errorMsg = 'Sorry, I had trouble processing that. Could you try again?';
        addMessage('assistant', errorMsg);
        await speakAndListen(errorMsg);
      }
      setStatus('idle');
      return;
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

  // Character select handler
  const handleCharacterSelect = useCallback(async (mode, gender, voiceId, name) => {
    // Update all state synchronously
    handleModeChange(mode);
    handleVoiceChange(gender);
    setSelectedVoiceId(voiceId || '');
    localStorage.setItem('tamilAgent_voiceId', voiceId || '');
    setCharName(name || 'Nova');
    localStorage.setItem('tamilAgent_charName', name || 'Nova');
    setCharacterSelected(true);
    localStorage.setItem('tamilAgent_characterSelected', 'true');

    // Unlock speech synthesis
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    const warmup = new SpeechSynthesisUtterance('');
    warmup.volume = 0;
    window.speechSynthesis.speak(warmup);

    // Wait for state to propagate to useSpeech hook
    await new Promise((r) => setTimeout(r, 600));
    flowStartedRef.current = true;
    const greeting = flow.startFlow();
    resetPipeline();
    await speakAndListen(greeting);
  }, [flow, resetPipeline, speakAndListen, handleModeChange, handleVoiceChange]);

  // Reopen character select
  const handleReopenCharacterSelect = useCallback(() => {
    setCharacterSelected(false);
    localStorage.setItem('tamilAgent_characterSelected', 'false');
    flow.reset();
    flowStartedRef.current = false;
  }, [flow]);

  // charName is dynamic based on gender + mode selection

  return (
    <div className={`app theme-${chatMode}`}>
      {/* Cinematic background layers */}
      <div className="shooting-star-layer" />
      <div className="nebula-layer" />

      {/* HUD corner readouts */}
      <div className="hud-corner hud-top-left">
        <div className="hud-label">SYNAPTIC LOAD: 88% [ACTIVE]</div>
        <div className="hud-waveform">
          <svg viewBox="0 0 120 30" preserveAspectRatio="none">
            <polyline points="0,15 8,10 16,18 24,8 32,20 40,12 48,22 56,6 64,18 72,14 80,20 88,10 96,16 104,8 112,18 120,15" fill="none" stroke="rgba(139,92,246,0.5)" strokeWidth="1.5">
              <animate attributeName="points" values="0,15 8,10 16,18 24,8 32,20 40,12 48,22 56,6 64,18 72,14 80,20 88,10 96,16 104,8 112,18 120,15;0,15 8,18 16,8 24,20 32,10 40,22 48,12 56,18 64,6 72,20 80,10 88,18 96,8 104,16 112,12 120,15;0,15 8,10 16,18 24,8 32,20 40,12 48,22 56,6 64,18 72,14 80,20 88,10 96,16 104,8 112,18 120,15" dur="3s" repeatCount="indefinite" />
            </polyline>
          </svg>
        </div>
      </div>
      <div className="hud-corner hud-top-right">
        <div className="hud-label">CORE FREQUENCY: 3.2 GHz [STABLE]</div>
        <div className="hud-waveform">
          <svg viewBox="0 0 120 30" preserveAspectRatio="none">
            <polyline points="0,15 10,15 12,5 14,25 16,15 30,15 32,8 34,22 36,15 50,15 52,3 54,27 56,15 70,15 72,10 74,20 76,15 90,15 92,6 94,24 96,15 110,15 112,8 114,22 116,15 120,15" fill="none" stroke="rgba(6,182,212,0.5)" strokeWidth="1.5">
              <animate attributeName="points" values="0,15 10,15 12,5 14,25 16,15 30,15 32,8 34,22 36,15 50,15 52,3 54,27 56,15 70,15 72,10 74,20 76,15 90,15 92,6 94,24 96,15 110,15 112,8 114,22 116,15 120,15;0,15 10,15 12,8 14,22 16,15 30,15 32,3 34,27 36,15 50,15 52,6 54,24 56,15 70,15 72,5 74,25 76,15 90,15 92,10 94,20 96,15 110,15 112,4 114,26 116,15 120,15;0,15 10,15 12,5 14,25 16,15 30,15 32,8 34,22 36,15 50,15 52,3 54,27 56,15 70,15 72,10 74,20 76,15 90,15 92,6 94,24 96,15 110,15 112,8 114,22 116,15 120,15" dur="2s" repeatCount="indefinite" />
            </polyline>
          </svg>
        </div>
      </div>

      <header className="app-header">
        <h1> Tamil AI Voice Agent</h1>
        <p>
          Powered by Groq LLM &bull; Voice &bull; Email &bull; WhatsApp
          {characterSelected && (
            <span
              className="header-mode-badge"
              onClick={handleReopenCharacterSelect}
              title="Change character"
            >
              {charName}
            </span>
          )}
        </p>
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

      {/* Character Selection Screen — after splash, before conversation */}
      {started && !characterSelected && (
        <CharacterSelect
          onSelect={handleCharacterSelect}
          initialMode={chatMode}
          initialGender={voiceGender}
        />
      )}

      <main className={`app-main mode-${chatMode}`}>
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

        <ChatWindow messages={messages} chatMode={chatMode} voiceGender={voiceGender} />

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
            chatMode={chatMode}
            charName={charName}
          />
          <TextInput
            onSubmit={handleInput}
            disabled={status === 'processing' || status === 'sending'}
            placeholder={flow.step === 'IDLE' ? 'Enter your command...' : 'Enter your command...'}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
