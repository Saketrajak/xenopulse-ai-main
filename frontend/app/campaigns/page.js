'use client';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';

const CHANNELS = ['WhatsApp', 'Email', 'SMS'];
const GOALS    = ['RETENTION', 'WINBACK', 'UPSELL', 'REACTIVATION', 'ENGAGEMENT'];

const defaultForm = {
  campaign_name: '',
  goal: 'WINBACK',
  channel: 'WhatsApp',
  audience_size: 50,
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns]   = useState([]);
  const [stats, setStats]           = useState(null);
  const [audience, setAudience]     = useState(null);
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState(defaultForm);
  const [launching, setLaunching]   = useState(false);
  const [selected, setSelected]     = useState(null);
  const [analytics, setAnalytics]   = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  /* Load from localStorage + fetch backend stats */
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('xp_campaigns') || '[]');
    setCampaigns(stored);

    api.stats().then(setStats).catch(() => {});
    api.audiencePreview().then(setAudience).catch(() => {});
  }, []);

  const handleLaunch = async (e) => {
    e.preventDefault();
    if (!form.campaign_name.trim()) return;

    setLaunching(true);
    try {
      const res = await api.launchCampaign({
        campaign_name: form.campaign_name,
        goal: form.goal,
        channel: form.channel,
        audience_size: Number(form.audience_size),
      });

      const newCampaign = {
        id: res.campaign_id,
        name: res.campaign_name,
        goal: form.goal,
        channel: form.channel,
        audience_size: res.audience_size,
        logs_created: res.logs_created,
        status: res.status || 'ACTIVE',
        created_at: new Date().toISOString(),
      };

      const updated = [newCampaign, ...campaigns];
      setCampaigns(updated);
      localStorage.setItem('xp_campaigns', JSON.stringify(updated));

      setForm(defaultForm);
      setShowModal(false);
    } catch (err) {
      alert(`Launch failed: ${err.message}`);
    } finally {
      setLaunching(false);
    }
  };

  const viewAnalytics = async (campaign) => {
    setSelected(campaign);
    setAnalytics(null);
    setLoadingAnalytics(true);
    try {
      const res = await api.campaignAnalytics(campaign.id);
      setAnalytics(res);
    } catch {
      setAnalytics({ error: true });
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const channelColor = (ch) => {
    if (ch === 'WhatsApp') return '#10B981';
    if (ch === 'Email')    return '#2563EB';
    return '#F59E0B';
  };

  const channelEmoji = (ch) => {
    if (ch === 'WhatsApp') return '💬';
    if (ch === 'Email')    return '📧';
    return '📱';
  };

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Campaigns</div>
          <div className="page-subtitle">Create, launch and track your marketing campaigns</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Campaign
        </button>
      </div>

      <div className="page-content">
        {/* Stats Row */}
        <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          {[
            { emoji: '👥', label: 'Total Customers', value: stats?.customers?.toLocaleString() ?? '…', color: '#EFF6FF', badge: null },
            { emoji: '🛒', label: 'Total Orders',    value: stats?.orders?.toLocaleString()    ?? '…', color: '#F0FDF4', badge: null },
            { emoji: '😴', label: 'Inactive (45d)',  value: audience?.audience_size?.toLocaleString() ?? '…', color: '#FFF7ED', badge: null },
          ].map(({ emoji, label, value, color }) => (
            <div key={label} className="stat-card anim-fadeUp">
              <div className="stat-icon" style={{ background: color, fontSize: 20 }}>{emoji}</div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        {/* Campaigns List + Analytics */}
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20 }}>
          {/* List */}
          <div>
            <div className="section-header">
              <div>
                <div className="section-title">All Campaigns</div>
                <div className="section-sub">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} launched</div>
              </div>
            </div>

            {campaigns.length === 0 ? (
              <div className="empty-state" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <div className="empty-icon">📢</div>
                <div className="empty-title">No campaigns yet</div>
                <div className="empty-sub">Launch your first campaign using the button above, or try the AI Workspace.</div>
              </div>
            ) : (
              <div className="campaigns-grid">
                {campaigns.map((c, i) => (
                  <div
                    key={c.id ?? i}
                    className="campaign-card"
                    style={{ animationDelay: `${i * 0.05}s`, borderColor: selected?.id === c.id ? 'var(--brand)' : undefined }}
                    onClick={() => viewAnalytics(c)}
                  >
                    <div className="campaign-card-top">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 18 }}>{channelEmoji(c.channel)}</span>
                          <span className="campaign-card-name">{c.name}</span>
                        </div>
                        <div className="campaign-card-goal">{c.goal} · {c.channel}</div>
                      </div>
                      <span className={`status-badge ${c.status}`}>{c.status}</span>
                    </div>

                    {/* Channel bar */}
                    <div style={{
                      height: 3, borderRadius: 99,
                      background: `linear-gradient(90deg, ${channelColor(c.channel)}, ${channelColor(c.channel)}88)`,
                      marginBottom: 14,
                    }} />

                    <div className="campaign-metrics">
                      {[
                        { label: 'Audience', value: c.audience_size?.toLocaleString() ?? '—' },
                        { label: 'Messages',  value: c.logs_created?.toLocaleString()  ?? '—' },
                        { label: 'Campaign',  value: `#${c.id ?? '—'}` },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div className="campaign-metric-label">{label}</div>
                          <div className="campaign-metric-value">{value}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-3)' }}>
                      {c.created_at ? new Date(c.created_at).toLocaleString() : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Analytics Panel */}
          {selected && (
            <div className="analytics-card anim-slideLeft" style={{ height: 'fit-content' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div className="analytics-card-title" style={{ marginBottom: 0 }}>
                  📊 Campaign Analytics
                </div>
                <button
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 18 }}
                  onClick={() => setSelected(null)}
                >×</button>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 16 }}>
                {selected.name} <span style={{ fontWeight: 400, color: 'var(--text-3)' }}>#{selected.id}</span>
              </div>

              {loadingAnalytics && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[80, 60, 40, 30, 20].map(w => (
                    <div key={w} className="skeleton" style={{ height: 36, width: `${w}%` }} />
                  ))}
                </div>
              )}

              {analytics && !analytics.error && !loadingAnalytics && (
                <>
                  <div className="funnel">
                    {[
                      { label: 'Sent',      count: analytics.sent,      color: '#94A3B8', pct: 100 },
                      { label: 'Delivered', count: analytics.delivered, color: '#2563EB', pct: analytics.delivery_rate   },
                      { label: 'Opened',    count: analytics.opened,    color: '#8B5CF6', pct: analytics.open_rate       },
                      { label: 'Clicked',   count: analytics.clicked,   color: '#10B981', pct: analytics.ctr             },
                      { label: 'Converted', count: analytics.converted, color: '#F59E0B', pct: analytics.conversion_rate },
                    ].map(({ label, count, color, pct }) => (
                      <div key={label} className="funnel-row">
                        <div className="funnel-label">{label}</div>
                        <div className="funnel-bar-wrap">
                          <div
                            className="funnel-bar"
                            style={{ width: `${Math.max(pct, count > 0 ? 5 : 0)}%`, background: color }}
                          >
                            {pct > 0 ? `${pct}%` : ''}
                          </div>
                        </div>
                        <div className="funnel-count">{count?.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20 }}>
                    {[
                      { label: 'Delivery Rate',    value: `${analytics.delivery_rate}%`    },
                      { label: 'Open Rate',         value: `${analytics.open_rate}%`         },
                      { label: 'Click-Through',     value: `${analytics.ctr}%`               },
                      { label: 'Conversion Rate',  value: `${analytics.conversion_rate}%`  },
                    ].map(({ label, value }) => (
                      <div key={label} className="insight-card">
                        <div className="insight-label">{label}</div>
                        <div className="insight-value">{value}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {analytics?.message && !loadingAnalytics && (
                <div className="empty-state" style={{ padding: '30px 0' }}>
                  <div className="empty-icon">📭</div>
                  <div className="empty-sub">No analytics yet — messages are still being delivered.</div>
                </div>
              )}

              {analytics?.error && !loadingAnalytics && (
                <div style={{ color: 'var(--red)', fontSize: 13 }}>
                  Failed to load analytics. Please try again.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Launch Modal */}
      {showModal && (
        <div className="launch-modal-bg" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="launch-modal">
            <div className="modal-title">🚀 Launch New Campaign</div>
            <div className="modal-sub">Configure your campaign targeting and channel</div>

            <form onSubmit={handleLaunch}>
              <div className="form-group">
                <label className="form-label">Campaign Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Summer Win-Back Campaign"
                  value={form.campaign_name}
                  onChange={e => setForm(f => ({ ...f, campaign_name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Goal</label>
                  <select
                    className="form-select"
                    value={form.goal}
                    onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
                  >
                    {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Channel</label>
                  <select
                    className="form-select"
                    value={form.channel}
                    onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
                  >
                    {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Audience Size (max 500)</label>
                <input
                  className="form-input"
                  type="number"
                  min={1}
                  max={500}
                  value={form.audience_size}
                  onChange={e => setForm(f => ({ ...f, audience_size: e.target.value }))}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={launching || !form.campaign_name.trim()}
                >
                  {launching ? 'Launching…' : '🚀 Launch Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
