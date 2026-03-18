import { useMemo, useState, useEffect } from 'react';
import AgentNode from './AgentNode';

// ---- Hook: detect mobile ----
function useIsMobile(breakpoint = 480) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= breakpoint);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return isMobile;
}

// ---- Pipeline Configurations ----

// Desktop: horizontal layout
const EMAIL_NODES = [
  { id: 'voice',     label: 'Voice Input',       icon: 'mic',      color: '#3b82f6', x: 70,  y: 80 },
  { id: 'intent',    label: 'Intent Detector',    icon: 'brain',    color: '#8b5cf6', x: 210, y: 60 },
  { id: 'composer',  label: 'Msg Composer',       icon: 'compose',  color: '#a855f7', x: 350, y: 85 },
  { id: 'router',    label: 'Action Router',      icon: 'route',    color: '#06b6d4', x: 490, y: 60 },
  { id: 'validator', label: 'Validator',          icon: 'check',    color: '#10b981', x: 630, y: 80 },
  { id: 'gmail',     label: 'Gmail Send',         icon: 'mail',     color: '#ef4444', x: 350, y: 185 },
  { id: 'response',  label: 'Voice Response',     icon: 'speaker',  color: '#06b6d4', x: 490, y: 185 },
];

const WHATSAPP_NODES = [
  { id: 'voice',     label: 'Voice Input',        icon: 'mic',      color: '#3b82f6', x: 70,  y: 80 },
  { id: 'intent',    label: 'Intent Detector',     icon: 'brain',    color: '#8b5cf6', x: 210, y: 60 },
  { id: 'composer',  label: 'Msg Composer',        icon: 'message',  color: '#25D366', x: 350, y: 85 },
  { id: 'router',    label: 'Action Router',       icon: 'route',    color: '#06b6d4', x: 490, y: 60 },
  { id: 'validator', label: 'Validator',           icon: 'check',    color: '#10b981', x: 630, y: 80 },
  { id: 'whatsapp',  label: 'WhatsApp Send',      icon: 'whatsapp', color: '#25D366', x: 350, y: 185 },
  { id: 'response',  label: 'Voice Response',     icon: 'speaker',  color: '#06b6d4', x: 490, y: 185 },
];

// Mobile: vertical zigzag layout (fits 320px wide viewport)
const EMAIL_NODES_MOBILE = [
  { id: 'voice',     label: 'Voice Input',       icon: 'mic',      color: '#3b82f6', x: 80,  y: 50 },
  { id: 'intent',    label: 'Intent Detector',    icon: 'brain',    color: '#8b5cf6', x: 200, y: 110 },
  { id: 'composer',  label: 'Msg Composer',       icon: 'compose',  color: '#a855f7', x: 80,  y: 170 },
  { id: 'router',    label: 'Action Router',      icon: 'route',    color: '#06b6d4', x: 200, y: 230 },
  { id: 'validator', label: 'Validator',          icon: 'check',    color: '#10b981', x: 80,  y: 290 },
  { id: 'gmail',     label: 'Gmail Send',         icon: 'mail',     color: '#ef4444', x: 200, y: 350 },
  { id: 'response',  label: 'Voice Response',     icon: 'speaker',  color: '#06b6d4', x: 80,  y: 410 },
];

const WHATSAPP_NODES_MOBILE = [
  { id: 'voice',     label: 'Voice Input',        icon: 'mic',      color: '#3b82f6', x: 80,  y: 50 },
  { id: 'intent',    label: 'Intent Detector',     icon: 'brain',    color: '#8b5cf6', x: 200, y: 110 },
  { id: 'composer',  label: 'Msg Composer',        icon: 'message',  color: '#25D366', x: 80,  y: 170 },
  { id: 'router',    label: 'Action Router',       icon: 'route',    color: '#06b6d4', x: 200, y: 230 },
  { id: 'validator', label: 'Validator',           icon: 'check',    color: '#10b981', x: 80,  y: 290 },
  { id: 'whatsapp',  label: 'WhatsApp Send',      icon: 'whatsapp', color: '#25D366', x: 200, y: 350 },
  { id: 'response',  label: 'Voice Response',     icon: 'speaker',  color: '#06b6d4', x: 80,  y: 410 },
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

export const EMAIL_STEPS = ['voice', 'intent', 'composer', 'router', 'validator', 'gmail', 'response'];
export const WHATSAPP_STEPS = ['voice', 'intent', 'composer', 'router', 'validator', 'whatsapp', 'response'];

function AgentFlowCanvas({ activeStep, completedSteps = [], errorStep, pipelineType }) {
  const isMobile = useIsMobile();
  const isWhatsApp = pipelineType === 'whatsapp';
  const nodes = isMobile
    ? (isWhatsApp ? WHATSAPP_NODES_MOBILE : EMAIL_NODES_MOBILE)
    : (isWhatsApp ? WHATSAPP_NODES : EMAIL_NODES);
  const connections = isWhatsApp ? WHATSAPP_CONNECTIONS : EMAIL_CONNECTIONS;
  const accentColor = isWhatsApp ? '#25D366' : '#8b5cf6';
  const accentRgb = isWhatsApp ? '37,211,102' : '139,92,246';

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

  // Check if any node is active (pipeline running)
  const pipelineActive = activeStep || completedSteps.length > 0;

  return (
    <div className={`agent-flow-canvas ${isWhatsApp ? 'whatsapp-mode' : 'email-mode'} ${pipelineActive ? 'pipeline-active' : ''}`}>
      <div className="flow-title">
        <span className="flow-title-dot" style={isWhatsApp ? { background: '#25D366', boxShadow: '0 0 8px rgba(37,211,102,0.5)' } : {}} />
        AI Agent Pipeline
        {pipelineType && (
          <span className={`flow-badge ${pipelineType}`}>
            {isWhatsApp ? 'WhatsApp' : 'Email'}
          </span>
        )}
      </div>
      <svg
        viewBox={isMobile ? "0 0 280 460" : "0 0 700 240"}
        className="flow-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Multi-layer neon glow */}
          <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="6" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Intense energy glow for particles */}
          <filter id="energyGlow" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="7" result="blur2" />
            <feGaussianBlur stdDeviation="14" result="blur3" />
            <feMerge>
              <feMergeNode in="blur3" />
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Wide wave glow for node rings */}
          <filter id="waveGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" result="blur1" />
            <feGaussianBlur stdDeviation="10" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Node radial glow backdrop */}
          <radialGradient id="nodeActiveGlow">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.15" />
            <stop offset="50%" stopColor={accentColor} stopOpacity="0.05" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </radialGradient>

          <radialGradient id="nodeDoneGlow">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#4ade80" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* === AMBIENT BACKGROUND PARTICLES (always visible when pipeline active) === */}
        {pipelineActive && (
          <g className="ambient-particles" opacity="0.4">
            <circle cx="100" cy="30" r="1" fill={accentColor}>
              <animate attributeName="cy" values="30;10;30" dur="4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0.7;0.3" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="250" cy="200" r="0.8" fill={accentColor}>
              <animate attributeName="cy" values="200;180;200" dur="5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.2;0.6;0.2" dur="5s" repeatCount="indefinite" />
            </circle>
            <circle cx="450" cy="20" r="1.2" fill="#06b6d4">
              <animate attributeName="cy" values="20;5;20" dur="3.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.2;0.5;0.2" dur="3.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="580" cy="210" r="0.8" fill={accentColor}>
              <animate attributeName="cy" values="210;190;210" dur="4.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0.6;0.3" dur="4.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="680" cy="40" r="1" fill="#e879f9">
              <animate attributeName="cy" values="40;25;40" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.2;0.5;0.2" dur="3s" repeatCount="indefinite" />
            </circle>
          </g>
        )}

        {/* === RENDER CONNECTIONS === */}
        {connections.map(([fromId, toId], i) => {
          const from = nodeMap[fromId];
          const to = nodeMap[toId];
          const status = getConnectionStatus(fromId, toId);

          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const isHorizontal = Math.abs(dx) > Math.abs(dy);

          let pathD;
          if (isHorizontal) {
            const midX = from.x + dx / 2;
            pathD = `M ${from.x + 28} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x - 28} ${to.y}`;
          } else {
            const midY = from.y + dy / 2;
            pathD = `M ${from.x} ${from.y + 28} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y - 28}`;
          }

          const pathId = `path-${fromId}-${toId}`;
          const isLit = status === 'active' || status === 'done';

          return (
            <g key={i}>
              {/* Base dotted line (always visible) */}
              <path
                d={pathD}
                fill="none"
                stroke={isLit ? `rgba(${accentRgb},0.15)` : 'rgba(100,100,150,0.07)'}
                strokeWidth="1"
                strokeDasharray="4 6"
              />

              {isLit && (
                <>
                  {/* Wide glow trail behind the line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={`rgba(${accentRgb},0.12)`}
                    strokeWidth="8"
                    filter="url(#waveGlow)"
                  />

                  {/* Main neon line */}
                  <path
                    id={pathId}
                    d={pathD}
                    fill="none"
                    stroke={status === 'active' ? accentColor : `rgba(${accentRgb},0.5)`}
                    strokeWidth={status === 'active' ? 2.5 : 1.5}
                    strokeDasharray={status === 'active' ? '8 4' : 'none'}
                    className={status === 'active' ? 'connection-active' : ''}
                    filter="url(#neonGlow)"
                  />

                  {/* Energy particles on active connections */}
                  {status === 'active' && (
                    <>
                      {/* Lead particle — bright white core */}
                      <circle r="4" fill="#fff" opacity="0.9" filter="url(#energyGlow)">
                        <animateMotion dur="1s" repeatCount="indefinite">
                          <mpath href={`#${pathId}`} />
                        </animateMotion>
                      </circle>
                      {/* Color halo around lead */}
                      <circle r="6" fill={accentColor} opacity="0.3" filter="url(#waveGlow)">
                        <animateMotion dur="1s" repeatCount="indefinite">
                          <mpath href={`#${pathId}`} />
                        </animateMotion>
                      </circle>
                      {/* Trailing particle 1 */}
                      <circle r="2.5" fill={accentColor} opacity="0.7" filter="url(#softGlow)">
                        <animateMotion dur="1s" repeatCount="indefinite" begin="0.12s">
                          <mpath href={`#${pathId}`} />
                        </animateMotion>
                      </circle>
                      {/* Trailing particle 2 */}
                      <circle r="1.5" fill={accentColor} opacity="0.4">
                        <animateMotion dur="1s" repeatCount="indefinite" begin="0.25s">
                          <mpath href={`#${pathId}`} />
                        </animateMotion>
                      </circle>
                      {/* Trailing particle 3 (faintest) */}
                      <circle r="1" fill={accentColor} opacity="0.2">
                        <animateMotion dur="1s" repeatCount="indefinite" begin="0.38s">
                          <mpath href={`#${pathId}`} />
                        </animateMotion>
                      </circle>

                      {/* Second wave of particles (offset by half cycle) */}
                      <circle r="3" fill="#fff" opacity="0.6" filter="url(#energyGlow)">
                        <animateMotion dur="1s" repeatCount="indefinite" begin="0.5s">
                          <mpath href={`#${pathId}`} />
                        </animateMotion>
                      </circle>
                      <circle r="2" fill={accentColor} opacity="0.5" filter="url(#softGlow)">
                        <animateMotion dur="1s" repeatCount="indefinite" begin="0.62s">
                          <mpath href={`#${pathId}`} />
                        </animateMotion>
                      </circle>
                      <circle r="1" fill={accentColor} opacity="0.25">
                        <animateMotion dur="1s" repeatCount="indefinite" begin="0.75s">
                          <mpath href={`#${pathId}`} />
                        </animateMotion>
                      </circle>
                    </>
                  )}

                  {/* Done connections: single slow-traveling particle to show completed */}
                  {status === 'done' && (
                    <circle r="2" fill={accentColor} opacity="0.4" filter="url(#softGlow)">
                      <animateMotion dur="3s" repeatCount="indefinite">
                        <mpath href={`#${pathId}`} />
                      </animateMotion>
                    </circle>
                  )}
                </>
              )}
            </g>
          );
        })}

        {/* === RENDER NODES === */}
        {nodes.map((node) => (
          <AgentNode
            key={node.id}
            {...node}
            status={getNodeStatus(node.id)}
            accentColor={accentColor}
            accentRgb={accentRgb}
          />
        ))}
      </svg>
    </div>
  );
}

export default AgentFlowCanvas;
