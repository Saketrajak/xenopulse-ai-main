const BASE = 'http://localhost:8000';

const req = async (path, opts = {}) => {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    console.error(`API error [${path}]:`, err);
    throw err;
  }
};

export const api = {
  // Stats & Data
  stats: () => req('/stats'),
  audiencePreview: () => req('/audience/preview'),
  debugLogs: () => req('/communications/debug'),
  loadDemo: () => req('/demo/load', { method: 'POST' }),

  // Agent Flow
  agentChat: (message) =>
    req('/agent/chat', { method: 'POST', body: JSON.stringify({ message }) }),
  agentUseDemo: (goal, preset) => req('/agent/use-demo', { method: 'POST', body: JSON.stringify({ goal, preset }) }),
  agentGenerateCampaign: (goal, channel) => req('/agent/generate-campaign', { method: 'POST', body: JSON.stringify({ goal, channel }) }),

  // Campaigns
  planCampaign: (goal) =>
    req('/campaigns/plan', { method: 'POST', body: JSON.stringify({ goal }) }),
  launchCampaign: (data) =>
    req('/campaigns/launch', { method: 'POST', body: JSON.stringify(data) }),
  campaignAnalytics: (id) => req(`/campaigns/${id}/analytics`),
};
