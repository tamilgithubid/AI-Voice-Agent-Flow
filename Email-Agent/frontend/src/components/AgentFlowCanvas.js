import React, { useMemo } from 'react';
import AgentNode from './AgentNode';

// ---- Pipeline Configurations ----

const EMAIL_NODES = [
  { id: 'voice',     label: 'Voice Input',      sublabel: 'Speech-to-Text', icon: 'mic',      color: '#3b82f6', x: 90,  y: 60 },
  { id: 'intent',    label: 'Intent Detector',   sublabel: 'AI Agent',       icon: 'brain',    color: '#8b5cf6', x: 280, y: 60 },
  { id: 'composer',  label: 'Email Composer',    sublabel: 'Groq LLM',      icon: 'compose',  color: '#a855f7', x: 470, y: 60 },
  { id: 'router',    label: 'Action Router',     sublabel: 'IF / Switch',    icon: 'route',    color: '#f59e0b', x: 660, y: 60 },
  { id: 'validator', label: 'Validator',         sublabel: 'Check Data',     icon: 'check',    color: '#10b981', x: 660, y: 170 },
  { id: 'gmail',     label: 'Gmail Send',        sublabel: 'Send Email',     icon: 'mail',     color: '#ef4444', x: 470, y: 170 },
  { id: 'response',  label: 'Voice Response',    sublabel: 'Text-to-Speech', icon: 'speaker',  color: '#06b6d4', x: 280, y: 170 },
];

const WHATSAPP_NODES = [
  { id: 'voice',     label: 'Voice Input',       sublabel: 'Speech-to-Text', icon: 'mic',      color: '#3b82f6', x: 90,  y: 60 },
  { id: 'intent',    label: 'Intent Detector',    sublabel: 'AI Agent',       icon: 'brain',    color: '#8b5cf6', x: 280, y: 60 },
  { id: 'composer',  label: 'Msg Composer',       sublabel: 'Groq LLM',      icon: 'message',  color: '#25D366', x: 470, y: 60 },
  { id: 'router',    label: 'Action Router',      sublabel: 'IF / Switch',    icon: 'route',    color: '#f59e0b', x: 660, y: 60 },
  { id: 'validator', label: 'Validator',          sublabel: 'Check Data',     icon: 'check',    color: '#10b981', x: 660, y: 170 },
  { id: 'whatsapp',  label: 'WhatsApp Send',     sublabel: 'Twilio API',     icon: 'whatsapp', color: '#25D366', x: 470, y: 170 },
  { id: 'response',  label: 'Voice Response',    sublabel: 'Text-to-Speech', icon: 'speaker',  color: '#06b6d4', x: 280, y: 170 },
];

const EMAIL_CONNECTIONS = [
  ['voice', 'intent'],
  ['intent', 'composer'],
  ['composer', 'router'],
  ['router', 'validator'],
  ['validator', 'gmail'],
  ['gmail', 'response'],
];

const WHATSAPP_CONNECTIONS = [
  ['voice', 'intent'],
  ['intent', 'composer'],
  ['composer', 'router'],
  ['router', 'validator'],
  ['validator', 'whatsapp'],
  ['whatsapp', 'response'],
];

// Pipeline step IDs for animation (exported for App.js)
export const EMAIL_STEPS = ['voice', 'intent', 'composer', 'router', 'validator', 'gmail', 'response'];
export const WHATSAPP_STEPS = ['voice', 'intent', 'composer', 'router', 'validator', 'whatsapp', 'response'];

function getNodeCenter(node) {
  return { x: node.x, y: node.y };
}

function AgentFlowCanvas({ activeStep, completedSteps = [], errorStep, pipelineType }) {
  const isWhatsApp = pipelineType === 'whatsapp';
  const nodes = isWhatsApp ? WHATSAPP_NODES : EMAIL_NODES;
  const connections = isWhatsApp ? WHATSAPP_CONNECTIONS : EMAIL_CONNECTIONS;
  const accentColor = isWhatsApp ? '#25D366' : '#667eea';

  const nodeMap = useMemo(() => {
    const map = {};
    nodes.forEach((n) => { map[n.id] = n; });
    return map;
  }, [nodes]);

  const getNodeStatus = (nodeId) => {
    if (errorStep === nodeId) return 'error';
    if (activeStep === nodeId) return 'active';
    if (completedSteps.includes(nodeId)) return 'done';
    return 'idle';
  };

  const getConnectionStatus = (fromId, toId) => {
    const fromDone = completedSteps.includes(fromId);
    const toActive = activeStep === toId;
    const toDone = completedSteps.includes(toId);
    if (fromDone && (toActive || toDone)) return 'active';
    if (fromDone && toDone) return 'done';
    return 'idle';
  };

  return (
    <div className={`agent-flow-canvas ${isWhatsApp ? 'whatsapp-mode' : 'email-mode'}`}>
      <div className="flow-title">
        <span className="flow-title-dot" style={isWhatsApp ? { background: '#25D366' } : {}} />
        AI Agent Pipeline
        {pipelineType && (
          <span className={`flow-badge ${pipelineType}`}>
            {isWhatsApp ? 'WhatsApp' : 'Email'}
          </span>
        )}
      </div>
      <svg
        viewBox="0 0 750 240"
        className="flow-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="activeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.2" />
            <stop offset="50%" stopColor={accentColor} stopOpacity="1" />
            <stop offset="100%" stopColor={isWhatsApp ? '#128C7E' : '#764ba2'} stopOpacity="0.2" />
          </linearGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <circle id="particle" r="3" fill={accentColor}>
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
          </circle>
        </defs>

        {/* Render connections */}
        {connections.map(([fromId, toId], i) => {
          const from = getNodeCenter(nodeMap[fromId]);
          const to = getNodeCenter(nodeMap[toId]);
          const status = getConnectionStatus(fromId, toId);

          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const isHorizontal = Math.abs(dx) > Math.abs(dy);

          let pathD;
          if (isHorizontal) {
            const midX = from.x + dx / 2;
            pathD = `M ${from.x + 65} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x - 65} ${to.y}`;
          } else {
            const midY = from.y + dy / 2;
            pathD = `M ${from.x} ${from.y + 26} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y - 26}`;
          }

          const pathId = `path-${fromId}-${toId}`;

          return (
            <g key={i}>
              <path
                d={pathD}
                fill="none"
                stroke={status === 'idle' ? '#1e1e3a' : `${accentColor}33`}
                strokeWidth="2"
              />

              {(status === 'active' || status === 'done') && (
                <>
                  <path
                    id={pathId}
                    d={pathD}
                    fill="none"
                    stroke={status === 'active' ? accentColor : `${accentColor}66`}
                    strokeWidth={status === 'active' ? 2.5 : 1.5}
                    strokeDasharray={status === 'active' ? '6 4' : 'none'}
                    className={status === 'active' ? 'connection-active' : ''}
                    filter={status === 'active' ? 'url(#glow)' : ''}
                  />

                  {status === 'active' && (
                    <circle r="3" fill={accentColor} filter="url(#glow)">
                      <animateMotion dur="1.2s" repeatCount="indefinite">
                        <mpath href={`#${pathId}`} />
                      </animateMotion>
                    </circle>
                  )}
                </>
              )}
            </g>
          );
        })}

        {/* Render nodes */}
        {nodes.map((node) => (
          <AgentNode
            key={node.id}
            {...node}
            status={getNodeStatus(node.id)}
          />
        ))}
      </svg>
    </div>
  );
}

export default AgentFlowCanvas;
