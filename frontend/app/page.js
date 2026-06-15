'use client';
import { useState, useRef, useEffect } from 'react';
import { api } from './lib/api';

/* ── helpers ── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getCampaignFriendlyName(goal) {
  const g = String(goal).toUpperCase();
  if (g.includes('WINBACK')) return 'Win-Back Campaign';
  if (g.includes('RETENTION')) return 'Retention Campaign';
  if (g.includes('UPSELL')) return 'Upsell Campaign';
  if (g.includes('ENGAGEMENT')) return 'Engagement Campaign';
  return 'Marketing Campaign';
}

const QUICK_ACTIONS = [
  'Bring Back Inactive Customers',
  'Increase Repeat Purchases',
  'Reduce Customer Churn',
  'Boost WhatsApp Engagement',
];

/* ── Sub-components ── */
function TypingIndicator() {
  return (
    <div className="msg-row ai anim-fadeIn">
      <div className="ai-avatar">
        <svg viewBox="0 0 24 24" fill="white">
          <path d="M13.6 12L20 4H17.5L12.4 9.8 8.1 4H2L8.7 13.3 2 22H4.5L10 15.8 14.6 22H21L13.6 12ZM5.4 5.8H7.2L17.6 20.3H15.8L5.4 5.8Z"/>
        </svg>
      </div>
      <div className="msg-bubble ai">
        <div className="bubble-body">
          <div className="typing-indicator">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        </div>
      </div>
    </div>
  );
}

function UserMessage({ text }) {
  return (
    <div className="msg-row user anim-fadeUp">
      <div className="msg-bubble user">
        <div className="bubble-body">{text}</div>
      </div>
    </div>
  );
}

function AiMessage({ msg, onAction, disabled, currentChannel, onChannelChange }) {
  return (
    <div className="msg-row ai anim-fadeUp">
      <div className="ai-avatar">
        <svg viewBox="0 0 24 24" fill="white">
          <path d="M13.6 12L20 4H17.5L12.4 9.8 8.1 4H2L8.7 13.3 2 22H4.5L10 15.8 14.6 22H21L13.6 12ZM5.4 5.8H7.2L17.6 20.3H15.8L5.4 5.8Z"/>
        </svg>
      </div>
      <div className="msg-bubble ai" style={{ maxWidth: '85%' }}>
        <div className="bubble-body">
          <div className="ai-label">
            <span className="ai-label-dot" />
            <span className="ai-label-text">Xeno AI</span>
          </div>

          {/* Main text */}
          <p className="bubble-text">{msg.text}</p>

          {/* Audience insight grid */}
          {msg.insights && (
            <div className="insight-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
              {[
                { label: 'Inactive Customers', value: msg.insights.audience_size?.toLocaleString(), sub: 'last 45 days' },
                { label: 'Avg Spend',           value: `₹${msg.insights.avg_spend?.toLocaleString()}`, sub: 'per customer' },
                { label: 'High Value',           value: msg.insights.high_value_customers?.toLocaleString(), sub: '> ₹15,000 spend' },
                { label: 'Top Channel',           value: msg.insights.preferred_channel, sub: 'preferred' },
                { label: 'Top City',             value: msg.insights.top_city, sub: 'most users' },
                { label: 'Top Category',         value: msg.insights.top_category, sub: 'most orders' },
              ].map(({ label, value, sub }) => (
                <div className="insight-card" key={label}>
                  <div className="insight-label">{label}</div>
                  <div className="insight-value">{value ?? '—'}</div>
                  <div className="insight-sub">{sub}</div>
                </div>
              ))}
            </div>
          )}

          {/* Campaign draft */}
          {msg.campaignDraft && (
            <div className="campaign-draft">
              <div className="campaign-draft-label">
                <span>✍️</span> AI Campaign Draft
              </div>
              <div className="campaign-draft-text">{msg.campaignDraft}</div>
            </div>
          )}

          {/* Success banner */}
          {msg.success && (
            <div className="success-banner">
              <div className="success-icon">🚀</div>
              <div>
                <div className="success-title">{msg.success.title}</div>
                <div className="success-sub">{msg.success.subtitle}</div>
              </div>
            </div>
          )}

          {/* Channel Selector - show only when insights are loaded and action buttons are present */}
          {msg.insights && msg.actions?.length > 0 && onChannelChange && (
            <div style={{ marginTop: 16, marginBottom: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Select Delivery Channel:
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { id: 'WhatsApp', label: '💬 WhatsApp', color: '#10B981' },
                  { id: 'Email',    label: '📧 Email',    color: '#2563EB' },
                  { id: 'SMS',      label: '📱 SMS',      color: '#F59E0B' },
                ].map(ch => {
                  const active = currentChannel === ch.id;
                  return (
                    <button
                      key={ch.id}
                      disabled={disabled}
                      onClick={() => onChannelChange(ch.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius)',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: active ? `1.5px solid ${ch.color}` : '1.5px solid var(--border)',
                        background: active ? `${ch.color}15` : 'var(--surface-2)',
                        color: active ? ch.color : 'var(--text-2)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {ch.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action buttons */}
          {msg.actions?.length > 0 && (
            <div className="msg-actions">
              {msg.actions.map((action) => (
                <button
                  key={action.key}
                  className={`msg-action-btn ${action.variant || 'primary'}`}
                  onClick={() => onAction(action.key, action.payload)}
                  disabled={disabled}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Summary Panel ── */
function SummaryPanel({ summary }) {
  const cards = [
    { key: 'goal',     emoji: '🎯', title: 'Goal'     },
    { key: 'insight',  emoji: '📊', title: 'Insight'  },
    { key: 'strategy', emoji: '✨', title: 'Strategy' },
    { key: 'campaign', emoji: '💬', title: 'Campaign' },
  ];

  return (
    <div className="summary-panel">
      <div className="summary-header">Conversation Summary</div>
      <div className="summary-cards">
        {cards.map(({ key, emoji, title }) => (
          <div key={key} className={`summary-card${summary[key] ? ' filled' : ''}`}>
            <div className="summary-card-top">
              <span className="summary-card-emoji">{emoji}</span>
              <span className="summary-card-title">{title}</span>
            </div>
            <div className="summary-card-value">
              {summary[key] || '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function WorkspacePage() {
  const [messages, setMessages]     = useState([]);
  const [summary,  setSummary]      = useState({ goal: null, insight: null, strategy: null, campaign: null });
  const [input,    setInput]        = useState('');
  const [loading,  setLoading]      = useState(false);
  const [phase,    setPhase]        = useState('INITIAL');
  const [draftPayload, setDraftPayload] = useState(null);
  const [classifiedGoal, setClassifiedGoal] = useState('WINBACK');
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  /* ── Add messages helpers ── */
  const pushUser = (text) =>
    setMessages(prev => [...prev, { type: 'user', text }]);

  const pushAi = (msg) =>
    setMessages(prev => [...prev, { type: 'ai', ...msg }]);

  /* ── Handle quick chip click ── */
  const handleChip = (text) => {
    if (loading) return;
    setInput('');
    sendMessage(text);
  };

  /* ── Send message to backend ── */
  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    pushUser(trimmed);
    setInput('');
    setLoading(true);

    try {
      const res = await api.agentChat(trimmed);

      // Save raw classified goal intent (e.g. WINBACK, RETENTION)
      setClassifiedGoal(res.goal || 'WINBACK');

      // Use AI-determined goal label (cleaner than raw user text)
      const goalLabel = res.goal_label || trimmed;
      setSummary(s => ({ ...s, goal: goalLabel }));

      const actions = [];
      if (res.actions?.includes('USE_DEMO_DATA')) {
        actions.push({ key: 'USE_DEMO_COFFEE',  label: '☕ Coffee Shop Demo', variant: 'primary' });
        actions.push({ key: 'USE_DEMO_FASHION', label: '👗 Fashion Retail Demo', variant: 'primary' });
        actions.push({ key: 'USE_DEMO_SAAS',    label: '💻 SaaS Platform Demo', variant: 'primary' });
      }
      if (res.actions?.includes('UPLOAD_DATA')) {
        actions.push({ key: 'UPLOAD_DATA', label: '📤 Upload Data', variant: 'secondary' });
      }

      pushAi({
        text: res.message || "I'm analyzing your request...",
        actions,
      });

      setPhase(res.agent_state || 'NEEDS_DATA');
    } catch (err) {
      pushAi({ text: 'Sorry, I had trouble connecting to the backend. Please ensure the API is running on port 8000.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChannelChange = (channel) => {
    setDraftPayload(prev => ({
      ...prev,
      channel
    }));
  };

  /* ── Handle action button clicks ── */
  const handleAction = async (key) => {
    if (loading) return;
    setLoading(true);

    try {
      if (key === 'USE_DEMO_COFFEE' || key === 'USE_DEMO_FASHION' || key === 'USE_DEMO_SAAS') {
        const preset = key === 'USE_DEMO_COFFEE' ? 'coffee' : key === 'USE_DEMO_FASHION' ? 'fashion' : 'saas';
        const label = key === 'USE_DEMO_COFFEE' ? 'Coffee Shop preset' : key === 'USE_DEMO_FASHION' ? 'Fashion Retail preset' : 'SaaS Platform preset';

        pushUser(`Load ${label}`);
        const res = await api.agentUseDemo(classifiedGoal, preset);
        const { thinking, decision, action_plan, actions } = res;

        // Get raw insights for the grid
        const insights = await api.audiencePreview();
        
        // Randomize audience size between 50 and 300 for demo data flow
        const randomAudience = Math.floor(Math.random() * (300 - 50 + 1)) + 50;
        insights.audience_size = randomAudience;

        setSummary(s => ({
          ...s,
          insight:  `${insights.audience_size?.toLocaleString()} dormant customers identified`,
          strategy: `${decision?.channel} ${decision?.campaign_type}`,
        }));

        const nextActions = [];
        if (actions?.includes('GENERATE_AI_CAMPAIGN')) {
          nextActions.push({ key: 'GENERATE_AI_CAMPAIGN', label: '🤖 Generate AI Campaign', variant: 'primary' });
        }
        nextActions.push({ key: 'UPLOAD_CUSTOM_MESSAGE', label: '✏️ Use Custom Message', variant: 'secondary' });

        pushAi({
          text: `I've analyzed your customer base. Here's what I found:`,
          insights,
          actions: nextActions,
        });

        setPhase('STRATEGY_READY');
        setDraftPayload({ channel: decision?.channel || 'WhatsApp', audience_size: insights.audience_size });

      } else if (key === 'GENERATE_AI_CAMPAIGN') {
        pushUser('Generate AI campaign');
        const selectedChannel = draftPayload?.channel || 'WhatsApp';
        const res = await api.agentGenerateCampaign(classifiedGoal, selectedChannel);

        // Parse campaign name if present in the AI response
        const nameMatch = res.campaign_draft?.match(/Campaign Name:\s*(.*)/i);
        const parsedName = nameMatch ? nameMatch[1].trim() : undefined;

        setDraftPayload(prev => ({
          ...prev,
          campaign_name: parsedName || prev?.campaign_name || getCampaignFriendlyName(classifiedGoal)
        }));

        setSummary(s => ({ ...s, campaign: 'Draft ready for review' }));

        pushAi({
          text: 'Here is your AI-generated campaign draft. Review it below, then launch when ready.',
          campaignDraft: res.campaign_draft,
          actions: [
            {
              key: 'LAUNCH_CAMPAIGN',
              label: '🚀 Launch Campaign',
              variant: 'primary',
              payload: {
                campaign_name: parsedName || draftPayload?.campaign_name || getCampaignFriendlyName(classifiedGoal),
                goal: classifiedGoal || 'WINBACK',
                channel: selectedChannel,
                audience_size: draftPayload?.audience_size || 50,
              },
            },
          ],
        });

        setPhase('CAMPAIGN_DRAFT_READY');

      } else if (key === 'LAUNCH_CAMPAIGN') {
        pushUser('Launch campaign now');
        const payload = {
          campaign_name: draftPayload?.campaign_name || getCampaignFriendlyName(classifiedGoal),
          goal: classifiedGoal || 'WINBACK',
          channel: draftPayload?.channel || 'WhatsApp',
          audience_size: draftPayload?.audience_size || 50,
        };

        const res = await api.launchCampaign(payload);
        setSummary(s => ({ ...s, campaign: `Campaign #${res.campaign_id} is live` }));

        // Save to localStorage for campaigns page
        const stored = JSON.parse(localStorage.getItem('xp_campaigns') || '[]');
        stored.unshift({
          id: res.campaign_id,
          name: res.campaign_name,
          goal: payload.goal,
          channel: payload.channel,
          audience_size: res.audience_size,
          logs_created: res.logs_created,
          status: res.status,
          created_at: new Date().toISOString(),
        });
        localStorage.setItem('xp_campaigns', JSON.stringify(stored));

        pushAi({
          text: `Your campaign is live and messages are being delivered.`,
          success: {
            title: `Campaign #${res.campaign_id} Launched Successfully`,
            subtitle: `${res.logs_created} messages sent via ${payload.channel}`,
          },
        });

        setPhase('LAUNCHED');

      } else if (key === 'UPLOAD_DATA') {
        pushAi({ text: '📤 CSV Upload: This feature is currently disabled in the preview environment to prevent rate-limiting and performance load. It will be enabled in the production version. Please try one of our interactive presets instead!' });
      } else if (key === 'UPLOAD_CUSTOM_MESSAGE') {
        pushAi({
          text: 'Custom message upload is coming soon. For now, let me generate an AI campaign for you.',
          actions: [{ key: 'GENERATE_AI_CAMPAIGN', label: '🤖 Generate AI Campaign', variant: 'primary' }],
        });
      }
    } catch (err) {
      pushAi({ text: `Something went wrong: ${err.message}. Please try again.` });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const showGreeting = messages.length === 0;

  return (
    <div className="workspace-layout">
      {/* ── Chat Column ── */}
      <div className="chat-column">
        {/* Header */}
        <div className="page-header">
          <div className="page-header-left">
            <div className="page-title">Workspace</div>
            <div className="page-subtitle">AI-powered customer engagement</div>
          </div>
          <div className="user-avatar">S</div>
        </div>

        {/* Greeting + chips */}
        {showGreeting && (
          <>
            <div className="chat-greeting anim-fadeUp">
              <div className="greeting-title">
                {getGreeting()}, Saket 👋
              </div>
              <div className="greeting-sub">What would you like to achieve today?</div>
            </div>
            <div className="quick-actions">
              {QUICK_ACTIONS.map((q) => (
                <button key={q} className="quick-chip" onClick={() => handleChip(q)}>
                  {q}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Messages */}
        <div className="messages-area">
          {messages.map((msg, i) =>
            msg.type === 'user'
              ? <UserMessage key={i} text={msg.text} />
              : <AiMessage
                  key={i}
                  msg={msg}
                  onAction={handleAction}
                  disabled={loading}
                  currentChannel={draftPayload?.channel || 'WhatsApp'}
                  onChannelChange={handleChannelChange}
                />
          )}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="chat-input-area">
          <form className="chat-input-wrap" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className="chat-input"
              placeholder="Describe your marketing goal…"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="send-btn" disabled={loading || !input.trim()}>
              <svg fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* ── Summary Panel ── */}
      <SummaryPanel summary={summary} />
    </div>
  );
}
