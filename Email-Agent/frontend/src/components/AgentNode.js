import React from 'react';

const ICONS = {
  mic: (
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
  ),
  brain: (
    <>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
      <circle cx="8" cy="10" r="1.5" />
      <circle cx="16" cy="10" r="1.5" />
      <circle cx="12" cy="7" r="1.5" />
      <circle cx="12" cy="13" r="1.5" />
      <path d="M8 10l4-3 4 3M8 10l4 3 4-3" fill="none" stroke="currentColor" strokeWidth="1" />
    </>
  ),
  compose: (
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
  ),
  message: (
    <>
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
      <path d="M7 9h10v2H7zm0-3h10v2H7z" />
    </>
  ),
  check: (
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  ),
  route: (
    <>
      <path d="M14 4l2.29 2.29-2.88 2.88 1.42 1.42 2.88-2.88L20 10V4h-6z" />
      <path d="M10 4H4v6l2.29-2.29 4.71 4.7V20h2v-8.41l-5.29-5.3L10 4z" />
    </>
  ),
  mail: (
    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
  ),
  whatsapp: (
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  ),
  speaker: (
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.5v7a4.47 4.47 0 002.5-3.5zM14 3.23v2.06a6.5 6.5 0 010 13.42v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  ),
};

function AgentNode({ id, label, sublabel, icon, status, x, y, color }) {
  const isActive = status === 'active';
  const isDone = status === 'done';
  const isError = status === 'error';

  const nodeColor = isError ? '#e74c3c' : (color || '#667eea');
  const glowColor = isActive ? nodeColor : 'transparent';

  return (
    <g
      className={`agent-node ${status}`}
      transform={`translate(${x}, ${y})`}
    >
      {/* Glow effect */}
      {isActive && (
        <rect
          x="-70"
          y="-30"
          width="140"
          height="60"
          rx="12"
          fill="none"
          stroke={glowColor}
          strokeWidth="2"
          opacity="0.6"
          className="node-glow"
        />
      )}

      {/* Node background */}
      <rect
        x="-65"
        y="-26"
        width="130"
        height="52"
        rx="10"
        fill={isDone || isActive ? `${nodeColor}22` : '#1e1e3a'}
        stroke={isDone ? nodeColor : isActive ? nodeColor : '#2a2a4a'}
        strokeWidth={isActive ? 2 : 1}
        className="node-bg"
      />

      {/* Icon circle */}
      <circle
        cx="-35"
        cy="0"
        r="15"
        fill={isDone || isActive ? `${nodeColor}33` : '#16213e'}
        stroke={isDone || isActive ? nodeColor : '#333'}
        strokeWidth="1.5"
      />

      {/* Icon */}
      <svg
        x="-44"
        y="-9"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={isDone || isActive ? nodeColor : '#666'}
      >
        {ICONS[icon]}
      </svg>

      {/* Label */}
      <text
        x="10"
        y="-4"
        fill={isDone || isActive ? '#fff' : '#999'}
        fontSize="11"
        fontWeight="600"
        textAnchor="middle"
      >
        {label}
      </text>

      {/* Sublabel */}
      {sublabel && (
        <text
          x="10"
          y="12"
          fill={isDone || isActive ? '#aaa' : '#555'}
          fontSize="9"
          textAnchor="middle"
        >
          {sublabel}
        </text>
      )}

      {/* Status indicator */}
      {isActive && (
        <circle cx="55" cy="-18" r="4" fill={nodeColor} className="status-pulse" />
      )}
      {isDone && (
        <svg x="47" y="-24" width="14" height="14" viewBox="0 0 24 24" fill="#4ade80">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
        </svg>
      )}
      {isError && (
        <svg x="47" y="-24" width="14" height="14" viewBox="0 0 24 24" fill="#e74c3c">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
        </svg>
      )}
    </g>
  );
}

export default AgentNode;
