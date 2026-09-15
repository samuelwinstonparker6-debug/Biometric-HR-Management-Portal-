import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { askAssistant } from '../api/client';
import ReactMarkdown from 'react-markdown';

/* ── RAPY Face Avatar ───────────────────────────────────────── */
function RapyFace({ mood }) {
  // mood: 'idle' | 'typing' | 'thinking' | 'happy' | 'speaking'

  const eyeStyle = (side) => ({
    width: mood === 'thinking' ? '8px' : '10px',
    height: mood === 'thinking' ? '4px' : '10px',
    background: '#c4b5fd',
    borderRadius: mood === 'thinking' ? '4px 4px 0 0' : '50%',
    position: 'absolute',
    top: side === 'left' ? (mood === 'happy' ? '29%' : '30%') : (mood === 'happy' ? '29%' : '30%'),
    [side === 'left' ? 'left' : 'right']: '20%',
    transition: 'all 0.3s ease',
    boxShadow: '0 0 6px rgba(196,181,253,0.8)',
  });

  const getMouth = () => {
    if (mood === 'happy' || mood === 'speaking') {
      return (
        <div style={{
          position: 'absolute',
          bottom: '22%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '22px',
          height: '11px',
          borderRadius: '0 0 12px 12px',
          background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
          boxShadow: '0 0 8px rgba(167,139,250,0.6)',
          transition: 'all 0.3s ease',
        }} />
      );
    }
    if (mood === 'thinking') {
      return (
        <div style={{
          position: 'absolute',
          bottom: '23%',
          left: '42%',
          transform: 'translateX(-50%)',
          width: '16px',
          height: '6px',
          borderRadius: '3px',
          background: 'rgba(196,181,253,0.6)',
          transition: 'all 0.3s ease',
        }} />
      );
    }
    if (mood === 'typing') {
      return (
        <div style={{
          position: 'absolute',
          bottom: '22%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '20px',
          height: '8px',
          borderRadius: '4px',
          background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
          boxShadow: '0 0 6px rgba(167,139,250,0.5)',
          transition: 'all 0.3s ease',
        }} />
      );
    }
    // idle
    return (
      <div style={{
        position: 'absolute',
        bottom: '24%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '18px',
        height: '5px',
        borderRadius: '3px',
        borderTop: '2.5px solid rgba(196,181,253,0.5)',
        background: 'transparent',
        transition: 'all 0.3s ease',
      }} />
    );
  };

  const getAntenna = () => (
    <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        width: '8px', height: '8px', borderRadius: '50%',
        background: mood === 'thinking' ? '#fbbf24' : mood === 'speaking' ? '#34d399' : '#c4b5fd',
        boxShadow: `0 0 ${mood === 'thinking' ? '10px' : '6px'} ${mood === 'thinking' ? 'rgba(251,191,36,0.9)' : mood === 'speaking' ? 'rgba(52,211,153,0.9)' : 'rgba(196,181,253,0.7)'}`,
        transition: 'all 0.3s ease',
        animation: mood === 'thinking' ? 'antennaPulse 0.6s ease infinite alternate' : 'none',
      }} />
      <div style={{ width: '2px', height: '10px', background: 'rgba(196,181,253,0.4)' }} />
    </div>
  );

  const cheekStyle = (side) => ({
    position: 'absolute',
    bottom: '28%',
    [side]: '13%',
    width: '10px',
    height: '6px',
    borderRadius: '50%',
    background: (mood === 'happy' || mood === 'speaking') ? 'rgba(236,72,153,0.4)' : 'transparent',
    boxShadow: (mood === 'happy' || mood === 'speaking') ? '0 0 8px rgba(236,72,153,0.3)' : 'none',
    transition: 'all 0.4s ease',
  });

  return (
    <div className="rapy-avatar-wrapper" style={{ position: 'relative', width: '72px', height: '72px', flexShrink: 0 }}>
      {/* Glow ring */}
      <div style={{
        position: 'absolute',
        inset: '-4px',
        borderRadius: '50%',
        background: `conic-gradient(from 0deg, #8b5cf6, #4f8ef7, #ec4899, #8b5cf6)`,
        animation: mood === 'thinking' ? 'spin 1.2s linear infinite' : mood === 'speaking' ? 'spin 0.8s linear infinite' : 'spin 4s linear infinite',
        opacity: mood === 'idle' ? 0.3 : 0.7,
        transition: 'opacity 0.4s ease',
      }} />
      <div style={{ position: 'absolute', inset: '2px', borderRadius: '50%', background: '#0a0e1a' }} />

      {/* Face */}
      <div style={{
        position: 'absolute',
        inset: '4px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(79,142,247,0.12))',
        border: '1px solid rgba(139,92,246,0.3)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {getAntenna()}
        {/* Eyes */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <div style={eyeStyle('left')} />
          <div style={eyeStyle('right')} />
          {/* Cheeks */}
          <div style={cheekStyle('left')} />
          <div style={cheekStyle('right')} />
          {getMouth()}
        </div>
      </div>

      {/* Mood label */}
      <div style={{
        position: 'absolute',
        bottom: '-20px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '0.58rem',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: mood === 'thinking' ? '#fbbf24' : mood === 'happy' ? '#34d399' : mood === 'speaking' ? '#a78bfa' : mood === 'typing' ? '#60a5fa' : 'rgba(148,163,184,0.6)',
        whiteSpace: 'nowrap',
        transition: 'color 0.3s ease',
      }}>
        {mood === 'thinking' ? '⚙ Processing...' : mood === 'happy' ? '✓ Done!' : mood === 'speaking' ? '◉ RAPY' : mood === 'typing' ? '• Ready' : '• RAPY'}
      </div>
    </div>
  );
}

/* ── Typing Indicator Dots ──────────────────────────────────── */
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: '5px', alignItems: 'center', padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: '7px', height: '7px', borderRadius: '50%',
          background: 'var(--accent-purple)',
          animation: `bounceDot 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────── */
export default function Assistant() {
  const { showToast } = useApp();
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! I am **RAPY**, your AI HR Assistant. How can I help you today? 🤖' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mood, setMood] = useState('idle'); // idle | typing | thinking | happy | speaking
  const endRef = useRef(null);
  const inputRef = useRef(null);

  // Mood transitions
  useEffect(() => {
    if (input.trim().length > 0) {
      setMood('typing');
    } else if (!loading) {
      setMood('idle');
    }
  }, [input, loading]);

  const scrollToBottom = () => {
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const usermsg = input.trim();
    setInput('');
    setMessages(p => [...p, { sender: 'user', text: usermsg }]);
    setLoading(true);
    setMood('thinking');
    scrollToBottom();

    try {
      const res = await askAssistant(usermsg);
      setMood('happy');
      setMessages(p => [...p, { sender: 'bot', text: res.response || 'No response.' }]);
      setTimeout(() => setMood('speaking'), 200);
      setTimeout(() => setMood('idle'), 2800);
    } catch (err) {
      setMood('idle');
      setMessages(p => [...p, { sender: 'bot', text: `⚠️ **Error:** ${err.message}` }]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes antennaPulse { from { transform: scale(1); opacity: 1; } to { transform: scale(1.5); opacity: 0.7; } }
        @keyframes bounceDot {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
          40% { transform: scale(1.2); opacity: 1; }
        }
        @keyframes msgSlideIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes avatarFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        .rapy-avatar-wrapper { animation: avatarFloat 3s ease-in-out infinite; }
        .chat-bubble { animation: msgSlideIn 0.3s cubic-bezier(0.34, 1.3, 0.64, 1) both; }
        .rapy-input:focus { 
          border-color: rgba(139,92,246,0.7) !important;
          box-shadow: 0 0 0 4px rgba(139,92,246,0.12), 0 8px 32px rgba(139,92,246,0.15) !important;
          background: rgba(139,92,246,0.06) !important;
        }
        .rapy-send-btn:hover:not(:disabled) {
          transform: scale(1.08) !important;
          box-shadow: 0 8px 28px rgba(139,92,246,0.55) !important;
        }
        .rapy-send-btn:active:not(:disabled) {
          transform: scale(0.95) !important;
        }
      `}</style>

      <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        
        {/* ── Header ── */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(139,92,246,0.2)',
          background: 'linear-gradient(90deg, rgba(139,92,246,0.08), rgba(79,142,247,0.05))',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: '1.3rem' }}>🤖</div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#c4b5fd', marginBottom: '2px' }}>
              RAPY — AI HR Assistant
            </h2>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Powered by NexGen AI · Always here to help</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px rgba(52,211,153,0.8)', animation: 'antennaPulse 2s ease infinite alternate' }} />
            <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 600 }}>Online</span>
          </div>
        </div>

        {/* ── Messages Area ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((m, i) => (
            <div key={i} className="chat-bubble" style={{ display: 'flex', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start', gap: '10px', alignItems: 'flex-end' }}>
              {m.sender === 'bot' && (
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(79,142,247,0.2))',
                  border: '1px solid rgba(139,92,246,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.9rem',
                }}>🤖</div>
              )}
              <div style={{
                maxWidth: '78%',
                padding: '14px 18px',
                borderRadius: m.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                background: m.sender === 'user'
                  ? 'linear-gradient(135deg, rgba(79,142,247,0.22), rgba(139,92,246,0.15))'
                  : 'rgba(255,255,255,0.04)',
                border: m.sender === 'user'
                  ? '1px solid rgba(79,142,247,0.3)'
                  : '1px solid rgba(255,255,255,0.07)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                lineHeight: 1.65,
                backdropFilter: 'blur(10px)',
                boxShadow: m.sender === 'user'
                  ? '0 4px 20px rgba(79,142,247,0.12)'
                  : '0 4px 16px rgba(0,0,0,0.2)',
              }}>
                {m.sender === 'bot'
                  ? <div className="markdown-body"><ReactMarkdown>{m.text}</ReactMarkdown></div>
                  : m.text}
              </div>
              {m.sender === 'user' && (
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, color: '#fff',
                }}>U</div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="chat-bubble" style={{ display: 'flex', justifyContent: 'flex-start', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(79,142,247,0.2))',
                border: '1px solid rgba(139,92,246,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem',
              }}>🤖</div>
              <div style={{
                padding: '14px 18px',
                borderRadius: '20px 20px 20px 4px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                backdropFilter: 'blur(10px)',
              }}>
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* ── Input Area ── */}
        <div style={{
          padding: '16px 20px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(10,14,26,0.6)',
          backdropFilter: 'blur(20px)',
          flexShrink: 0,
        }}>
          {/* Avatar + Input row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
            
            {/* RAPY Face Avatar */}
            <div style={{ paddingBottom: '22px' }}>
              <RapyFace mood={mood} />
            </div>

            {/* Input + Send */}
            <form onSubmit={sendMessage} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Textarea wrapper */}
              <div style={{
                position: 'relative',
                borderRadius: '24px',
                background: 'rgba(255,255,255,0.04)',
                border: '1.5px solid rgba(139,92,246,0.25)',
                transition: 'all 0.25s ease',
                boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
              }}>
                <textarea
                  ref={inputRef}
                  className="rapy-input"
                  rows={3}
                  placeholder="Ask me anything about employees, payroll, attendance, or leaves…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '0.92rem',
                    fontFamily: 'var(--font-sans)',
                    lineHeight: 1.6,
                    padding: '16px 18px 12px',
                    borderRadius: '24px',
                    transition: 'all 0.25s ease',
                  }}
                />
                {/* Hint text */}
                <div style={{
                  padding: '0 18px 10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    Press <kbd style={{ padding: '1px 5px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.68rem' }}>Enter</kbd> to send · <kbd style={{ padding: '1px 5px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.68rem' }}>Shift+Enter</kbd> for new line
                  </span>
                  <span style={{ fontSize: '0.68rem', color: input.length > 400 ? 'var(--accent-orange)' : 'var(--text-muted)' }}>
                    {input.length}/500
                  </span>
                </div>
              </div>

              {/* Send button row */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                {/* Clear btn */}
                {input.length > 0 && (
                  <button type="button" onClick={() => setInput('')} style={{
                    padding: '10px 18px',
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-sans)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}>
                    Clear
                  </button>
                )}
                <button
                  type="submit"
                  className="rapy-send-btn"
                  disabled={loading || !input.trim()}
                  style={{
                    padding: '10px 26px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #8b5cf6, #4f8ef7)',
                    color: '#fff',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-sans)',
                    cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                    opacity: loading || !input.trim() ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 18px rgba(139,92,246,0.35)',
                    transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  {loading
                    ? <><i className="fa-solid fa-spinner fa-spin" /> Processing</>
                    : <><i className="fa-solid fa-paper-plane" /> Send</>
                  }
                </button>
              </div>
            </form>
          </div>

          {/* Suggestion chips */}
          {messages.length <= 1 && !loading && (
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', paddingLeft: '88px' }}>
              {['Show payroll summary', 'Who is on leave today?', 'Top performers this month', 'Attendance report'].map(chip => (
                <button key={chip} onClick={() => setInput(chip)} style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: '1px solid rgba(139,92,246,0.25)',
                  background: 'rgba(139,92,246,0.08)',
                  color: '#c4b5fd',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontWeight: 500,
                }} onMouseEnter={e => { e.target.style.background = 'rgba(139,92,246,0.18)'; e.target.style.borderColor = 'rgba(139,92,246,0.5)'; }}
                   onMouseLeave={e => { e.target.style.background = 'rgba(139,92,246,0.08)'; e.target.style.borderColor = 'rgba(139,92,246,0.25)'; }}>
                  {chip}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
