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
          <path d="M13.6 12L20 4H17.5L12.4 9.8 8.1 4H2L8.7 13.3 2 22H4.5L10 15.8 14.6 22H21L13.6 12ZM5.4 5.8H7.2L17.6 20.3H15.8L5.4 5.8Z" />
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
    <div className="msg-row user msg-slide-right">
      <div className="msg-bubble user">
        <div className="bubble-body">{text}</div>
      </div>
    </div>
  );
}

function CampaignLaunchProgress({ campaignId, channel, onComplete }) {
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(false);
  const logContainerRef = useRef(null);

  useEffect(() => {
    let interval;
    const fetchProgress = async () => {
      try {
        const res = await api.getCampaignProgress(campaignId);
        setProgress(res);
        if (res.status === 'COMPLETED' || res.completed >= res.total) {
          clearInterval(interval);
          if (onComplete) onComplete(res);
        }
      } catch (err) {
        console.error('Error fetching campaign progress:', err);
        setError(true);
      }
    };

    fetchProgress();
    interval = setInterval(fetchProgress, 1000); // 1-second polling to minimize backend load

    return () => clearInterval(interval);
  }, [campaignId]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [progress?.logs?.length]);

  if (error) {
    return (
      <div className="progress-error" style={{ color: 'var(--red)', fontSize: 12, marginTop: 10 }}>
        ⚠️ Failed to fetch campaign progress.
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="progress-initializing">
        <div className="progress-spinner" />
        <span>Initializing campaign broadcast...</span>
      </div>
    );
  }

  const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <div className="campaign-progress-card">
      <div className="progress-header">
        <span className="progress-badge">{channel} Broadcast</span>
        <span className="progress-percentage">{pct}%</span>
      </div>
      
      <div className="progress-bar-bg">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="progress-stats">
        <span>Sent: <strong>{progress.completed}</strong> / {progress.total}</span>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span className="success-text">Success: <strong>{progress.completed - progress.failed}</strong></span>
          {progress.failed > 0 && <span className="failed-text">Failed: <strong>{progress.failed}</strong></span>}
        </div>
      </div>

      <div className="progress-terminal" ref={logContainerRef}>
        <div className="terminal-log-row system-msg">📡 [SYSTEM] Initializing campaign...</div>
        {progress.logs && progress.logs.map((log) => (
          <div key={log.id} className={`terminal-log-row ${log.message.includes('❌') ? 'failed' : ''}`}>
            {log.message}
          </div>
        ))}
        {progress.status === 'COMPLETED' && (
          <div className="terminal-log-row success-msg">🎉 [SYSTEM] Campaign successfully launched!</div>
        )}
      </div>
    </div>
  );
}

function AiMessage({ msg, onAction, disabled, currentChannel, onChannelChange, onUpload }) {
  const [custFile, setCustFile] = useState(null);
  const [ordFile, setOrdFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  return (
    <div className="msg-row ai anim-fadeUp">
      <div className="ai-avatar">
        <svg viewBox="0 0 24 24" fill="white">
          <path d="M13.6 12L20 4H17.5L12.4 9.8 8.1 4H2L8.7 13.3 2 22H4.5L10 15.8 14.6 22H21L13.6 12ZM5.4 5.8H7.2L17.6 20.3H15.8L5.4 5.8Z" />
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

          {/* Progress Indicator if launching */}
          {msg.progressCampaignId && (
            <CampaignLaunchProgress 
              campaignId={msg.progressCampaignId} 
              channel={msg.progressChannel || 'WhatsApp'}
              onComplete={(progressRes) => {
                // Update local storage status to ACTIVE
                const stored = JSON.parse(localStorage.getItem('xp_campaigns') || '[]');
                const target = stored.find(c => c.id === msg.progressCampaignId);
                if (target) {
                  target.status = 'ACTIVE';
                  localStorage.setItem('xp_campaigns', JSON.stringify(stored));
                }
              }}
            />
          )}

          {/* Audience insight grid */}
          {msg.insights && (
            <div className="insight-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
              {[
                { label: 'Inactive Customers', value: msg.insights.audience_size?.toLocaleString(), sub: 'last 45 days' },
                { label: 'Avg Spend', value: `₹${msg.insights.avg_spend?.toLocaleString()}`, sub: 'per customer' },
                { label: 'High Value', value: msg.insights.high_value_customers?.toLocaleString(), sub: '> ₹15,000 spend' },
                { label: 'Top Channel', value: msg.insights.preferred_channel, sub: 'preferred' },
                { label: 'Top City', value: msg.insights.top_city, sub: 'most users' },
                { label: 'Top Category', value: msg.insights.top_category, sub: 'most orders' },
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

          {/* CSV Upload form area */}
          {msg.showUploadArea && (
            <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 12 }}>
                📁 Select CSV Files to Ingest
              </div>

              {/* Customers Input */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>
                  1. Customers CSV File:
                </label>
                <input
                  type="file"
                  accept=".csv"
                  disabled={uploading || disabled}
                  onChange={e => {
                    setCustFile(e.target.files[0]);
                    setErrorMsg('');
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    fontSize: 12,
                    padding: '8px',
                    borderRadius: 'var(--radius)',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                  }}
                />
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
                  Required columns: <code>customer_id, name, email, city, preferred_channel, total_spend, last_purchase_date</code>
                </span>
              </div>

              {/* Orders Input */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>
                  2. Orders CSV File:
                </label>
                <input
                  type="file"
                  accept=".csv"
                  disabled={uploading || disabled}
                  onChange={e => {
                    setOrdFile(e.target.files[0]);
                    setErrorMsg('');
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    fontSize: 12,
                    padding: '8px',
                    borderRadius: 'var(--radius)',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                  }}
                />
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
                  Required columns: <code>order_id, customer_id, amount, category, order_date</code>
                </span>
              </div>

              {errorMsg && (
                <div style={{ color: 'var(--red)', fontSize: 11, fontWeight: 600, marginBottom: 12 }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <button
                disabled={!custFile || !ordFile || uploading || disabled}
                onClick={async () => {
                  setUploading(true);
                  setErrorMsg('');
                  try {
                    const formData = new FormData();
                    formData.append('customers_file', custFile);
                    formData.append('orders_file', ordFile);
                    const res = await api.uploadCSV(formData);
                    if (onUpload) {
                      onUpload(res);
                    }
                  } catch (err) {
                    setErrorMsg(err.message || 'Upload failed. Please check the file formatting.');
                  } finally {
                    setUploading(false);
                  }
                }}
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px', fontSize: 12 }}
              >
                {uploading ? 'Ingesting data...' : '📤 Ingest & Analyze'}
              </button>
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
                  { id: 'Email', label: '📧 Email', color: '#2563EB' },
                  { id: 'SMS', label: '📱 SMS', color: '#F59E0B' },
                  { id: 'RCS', label: '💬 RCS', color: '#8B5CF6' },
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
    { key: 'goal', emoji: '🎯', title: 'Goal' },
    { key: 'insight', emoji: '📊', title: 'Insight' },
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
  const [messages, setMessages] = useState([]);
  const [summary, setSummary] = useState({ goal: null, insight: null, strategy: null, campaign: null });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('INITIAL');
  const [draftPayload, setDraftPayload] = useState(null);
  const [classifiedGoal, setClassifiedGoal] = useState('WINBACK');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

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
        actions.push({ key: 'USE_DEMO_COFFEE', label: '☕ Coffee Shop Demo', variant: 'primary' });
        actions.push({ key: 'USE_DEMO_FASHION', label: '👗 Fashion Retail Demo', variant: 'primary' });
        actions.push({ key: 'USE_DEMO_SAAS', label: '💻 SaaS Platform Demo', variant: 'primary' });
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

        setSummary(s => ({
          ...s,
          insight: `${insights.audience_size?.toLocaleString()} dormant customers identified`,
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

        // Save to localStorage for campaigns page (initially mark as ACTIVE/SENDING)
        const stored = JSON.parse(localStorage.getItem('xp_campaigns') || '[]');
        stored.unshift({
          id: res.campaign_id,
          name: res.campaign_name,
          goal: payload.goal,
          channel: payload.channel,
          audience_size: res.audience_size,
          logs_created: res.logs_created,
          status: 'SENDING',
          created_at: new Date().toISOString(),
        });
        localStorage.setItem('xp_campaigns', JSON.stringify(stored));

        pushAi({
          text: `Your campaign is live and messages are being delivered.`,
          progressCampaignId: res.campaign_id,
          progressChannel: payload.channel,
        });

        setPhase('LAUNCHED');

      } else if (key === 'UPLOAD_DATA') {
        pushUser('Upload customer data');
        pushAi({
          text: 'Select your customers and orders CSV files below to ingest them into XenoPulse AI.',
          showUploadArea: true,
        });
        setPhase('NEEDS_DATA');
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

  const handleUploadSuccess = async (res) => {
    pushUser(`Uploaded files successfully: ${res.customers_loaded} customers, ${res.orders_loaded} orders ingested.`);
    setLoading(true);

    try {
      // Analyze newly uploaded data from DB
      const demoRes = await api.agentUseDemo(classifiedGoal, 'uploaded');
      const { thinking, decision, action_plan, actions } = demoRes;

      const insights = await api.audiencePreview();

      setSummary(s => ({
        ...s,
        insight: `${insights.audience_size?.toLocaleString()} dormant customers identified`,
        strategy: `${decision?.channel} ${decision?.campaign_type}`,
      }));

      const nextActions = [];
      if (actions?.includes('GENERATE_AI_CAMPAIGN')) {
        nextActions.push({ key: 'GENERATE_AI_CAMPAIGN', label: '🤖 Generate AI Campaign', variant: 'primary' });
      }
      nextActions.push({ key: 'UPLOAD_CUSTOM_MESSAGE', label: '✏️ Use Custom Message', variant: 'secondary' });

      pushAi({
        text: `Ingestion complete. I've analyzed your customer segment. Here is the summary of your uploaded data:`,
        insights,
        actions: nextActions,
      });

      setPhase('STRATEGY_READY');
      setDraftPayload({ channel: decision?.channel || 'WhatsApp', audience_size: insights.audience_size });

    } catch (err) {
      pushAi({ text: `Failed to analyze uploaded data: ${err.message}` });
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
                Greetings!! HAPPYxens 👋
              </div>
              <div className="greeting-sub">What would you like to achieve today?</div>
            </div>
            <div className="quick-actions">
              {QUICK_ACTIONS.map((q, idx) => (
                <button
                  key={q}
                  className="quick-chip"
                  onClick={() => handleChip(q)}
                  style={{ animationDelay: `${idx * 0.08}s` }}
                >
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
                onUpload={handleUploadSuccess}
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
