'use client';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';

function FunnelBar({ label, count, total, color, pct }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(total > 0 ? Math.max((count / total) * 100, count > 0 ? 4 : 0) : 0), 200);
    return () => clearTimeout(t);
  }, [count, total]);

  return (
    <div className="funnel-row">
      <div className="funnel-label">{label}</div>
      <div className="funnel-bar-wrap">
        <div className="funnel-bar" style={{ width: `${width}%`, background: color }}>
          {width > 10 ? `${pct ?? count}` : ''}
        </div>
      </div>
      <div className="funnel-count">{count?.toLocaleString()}</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [audience, setAudience] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.stats(),
      api.audiencePreview(),
      api.debugLogs(),
    ])
      .then(([s, a, l]) => {
        setStats(s);
        setAudience(a);
        setLogs(Array.isArray(l) ? l : []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  /* Compute funnel from logs */
  const total = logs.length;
  const delivered = logs.filter(l => l.delivered_at && l.delivered_at !== 'None').length;
  const opened = logs.filter(l => l.opened_at && l.opened_at !== 'None').length;
  const clicked = logs.filter(l => l.clicked_at && l.clicked_at !== 'None').length;
  const converted = logs.filter(l => l.converted_at && l.converted_at !== 'None').length;
  const failed = logs.filter(l => l.status === 'PERMANENT_FAILURE' || l.status === 'FAILED').length;
  const pending = logs.filter(l => l.status === 'PENDING').length;

  const pct = (n) => total > 0 ? `${Math.round((n / total) * 100)}%` : '0%';

  const funnelSteps = [
    { label: 'Sent', count: total, color: '#94A3B8', pct: '100%' },
    { label: 'Delivered', count: delivered, color: '#2563EB', pct: pct(delivered) },
    { label: 'Opened', count: opened, color: '#8B5CF6', pct: pct(opened) },
    { label: 'Clicked', count: clicked, color: '#10B981', pct: pct(clicked) },
    { label: 'Converted', count: converted, color: '#F59E0B', pct: pct(converted) },
  ];

  /* Status count map */
  const statusCount = logs.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});

  const statusColor = (s) => {
    if (s === 'DELIVERED' || s === 'OPENED' || s === 'CLICKED' || s === 'CONVERTED') return 'var(--green)';
    if (s === 'PERMANENT_FAILURE' || s === 'FAILED') return 'var(--red)';
    if (s === 'PENDING') return 'var(--amber)';
    return 'var(--text-3)';
  };

  const channelClass = (ch) => {
    if (!ch) return '';
    const clean = ch.toLowerCase();
    if (clean === 'whatsapp') return 'whatsapp';
    if (clean === 'email') return 'email';
    if (clean === 'rcs') return 'rcs';
    return 'sms';
  };

  if (loading) {
    return (
      <>
        <div className="page-header">
          <div className="page-header-left">
            <div className="page-title">Analytics</div>
            <div className="page-subtitle">Campaign performance and audience insights</div>
          </div>
        </div>
        <div className="page-content">
          <div className="stats-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="stat-card">
                <div className="skeleton" style={{ width: 38, height: 38, borderRadius: 10, marginBottom: 14 }} />
                <div className="skeleton" style={{ width: '60%', height: 28, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: '40%', height: 14 }} />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="page-header">
          <div className="page-header-left">
            <div className="page-title">Analytics</div>
          </div>
        </div>
        <div className="page-content">
          <div className="empty-state" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <div className="empty-icon">⚠️</div>
            <div className="empty-title">Backend not reachable</div>
            <div className="empty-sub">Make sure the backend is running on http://localhost:8000</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Analytics</div>
          <div className="page-subtitle">Campaign performance and audience insights</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Live Data</span>
        </div>
      </div>

      <div className="page-content">

        {/* Top stats */}
        <div className="stats-row" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 24 }}>
          {[
            { emoji: '👥', label: 'Total Customers', value: stats?.customers?.toLocaleString() ?? '—', color: '#EFF6FF' },
            { emoji: '🛒', label: 'Total Orders', value: stats?.orders?.toLocaleString() ?? '—', color: '#F0FDF4' },
            { emoji: '😴', label: 'Inactive Customers', value: audience?.audience_size?.toLocaleString() ?? '—', color: '#FFF7ED' },
            { emoji: '📨', label: 'Messages Tracked', value: total.toLocaleString(), color: '#EDE9FE' },
          ].map(({ emoji, label, value, color }, i) => (
            <div key={label} className="stat-card anim-fadeUp" style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="stat-icon" style={{ background: color, fontSize: 20 }}>{emoji}</div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        {/* Middle row: Funnel + Audience */}
        <div className="analytics-grid" style={{ marginBottom: 24 }}>

          {/* Communication Funnel */}
          <div className="analytics-card">
            <div className="analytics-card-title">
              <div className="analytics-card-icon" style={{ background: '#EFF6FF' }}>📊</div>
              Delivery Funnel
            </div>
            {total === 0 ? (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <div className="empty-icon">📭</div>
                <div className="empty-sub">No messages tracked yet. Launch a campaign first.</div>
              </div>
            ) : (
              <div className="funnel">
                {funnelSteps.map(({ label, count, color, pct }) => (
                  <FunnelBar key={label} label={label} count={count} total={total} color={color} pct={pct} />
                ))}
              </div>
            )}
          </div>

          {/* Audience Insights */}
          <div className="analytics-card">
            <div className="analytics-card-title">
              <div className="analytics-card-icon" style={{ background: '#FFF7ED' }}>👥</div>
              Audience Insights
            </div>
            {audience && audience.audience_size > 0 ? (
              <div className="audience-list">
                {[
                  { label: 'Inactive Customers (45d)', value: audience.audience_size?.toLocaleString() },
                  { label: 'Average Spend', value: `₹${audience.avg_spend?.toLocaleString()}` },
                  { label: 'Total Revenue at Risk', value: `₹${audience.total_revenue?.toLocaleString()}` },
                  { label: 'High-Value Customers', value: audience.high_value_customers?.toLocaleString() },
                  { label: 'Preferred Channel', value: audience.preferred_channel },
                  { label: 'Top City', value: audience.top_city },
                  { label: 'Top Category', value: audience.top_category },
                  { label: 'Avg Order Value', value: `₹${audience.avg_order_value?.toLocaleString()}` },
                ].map(({ label, value }) => (
                  <div key={label} className="audience-row">
                    <span className="audience-row-label">{label}</span>
                    <span className="audience-row-value">{value ?? '—'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <div className="empty-icon">🔍</div>
                <div className="empty-sub">Load demo data to see audience insights.</div>
              </div>
            )}
          </div>
        </div>

        {/* Status breakdown */}
        {total > 0 && (
          <div className="analytics-card" style={{ marginBottom: 24 }}>
            <div className="analytics-card-title">
              <div className="analytics-card-icon" style={{ background: '#F0FDF4' }}>📬</div>
              Message Status Breakdown
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {Object.entries(statusCount).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
                <div key={status} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 16px',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-full)',
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(status), display: 'inline-block' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{status}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Communication Logs */}
        <div className="analytics-card">
          <div className="analytics-card-title">
            <div className="analytics-card-icon" style={{ background: '#EDE9FE' }}>📋</div>
            Recent Communication Logs
            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 500, color: 'var(--text-3)' }}>
              Last {Math.min(logs.length, 50)} entries
            </span>
          </div>

          {logs.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-icon">📭</div>
              <div className="empty-sub">No communication logs yet. Launch a campaign to see messages here.</div>
            </div>
          ) : (
            <div className="logs-table-wrap">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Campaign</th>
                    <th>Customer</th>
                    <th>Channel</th>
                    <th>Status</th>
                    <th>Retries</th>
                    <th>Sent At</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 30).map(log => (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-1)' }}>#{log.id}</td>
                      <td>#{log.campaign_id}</td>
                      <td>#{log.customer_id}</td>
                      <td>
                        <span className={`channel-pill ${channelClass(log.channel)}`}>
                          {log.channel === 'WhatsApp' ? '💬' : log.channel === 'Email' ? '📧' : log.channel === 'RCS' ? '💬' : '📱'} {log.channel}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                          background: log.status === 'PERMANENT_FAILURE' ? '#FEE2E2'
                            : log.status === 'CONVERTED' ? '#D1FAE5'
                              : log.status === 'DELIVERED' ? '#DBEAFE'
                                : log.status === 'OPENED' ? '#EDE9FE'
                                  : '#FEF3C7',
                          color: log.status === 'PERMANENT_FAILURE' ? '#991B1B'
                            : log.status === 'CONVERTED' ? '#065F46'
                              : log.status === 'DELIVERED' ? '#1E40AF'
                                : log.status === 'OPENED' ? '#4C1D95'
                                  : '#92400E',
                        }}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>{log.retry_count}</td>
                      <td style={{ fontSize: 11 }}>
                        {log.sent_at && log.sent_at !== 'None'
                          ? new Date(log.sent_at).toLocaleTimeString()
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
