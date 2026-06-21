<script>
  import { onMount } from 'svelte';

  let user = null;
  let stats = { totalChannels: 0, analysesThisMonth: 0, activeOutreach: 0, matchRate: 0 };
  let activity = [];
  let pipeline = [];
  let channels = [];
  let pipelineByStatus = {};
  let loading = true;

  const statusOrder = ['draft', 'sent', 'replied', 'negotiating', 'closed', 'rejected'];
  const statusColors = {
    draft: 'var(--text-dim)', sent: 'var(--accent)', replied: 'var(--teal)',
    negotiating: 'var(--yellow)', closed: 'var(--green)', rejected: 'var(--red)',
  };

  onMount(async () => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login'; return; }

    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [userRes, dashRes, statsRes] = await Promise.all([
        fetch('/api/v1/auth/me', { headers }),
        fetch('/api/v1/dashboard', { headers }),
        fetch('/api/v1/dashboard/stats', { headers }),
      ]);

      const userData = await userRes.json();
      const dashData = await dashRes.json();
      const statsData = await statsRes.json();

      if (userData.success) user = userData.data.user;
      if (dashData.success) {
        activity = dashData.data.activity ?? [];
        pipeline = dashData.data.pipeline ?? [];
        channels = dashData.data.channels ?? [];
        pipelineByStatus = dashData.data.pipelineByStatus ?? {};
      }
      if (statsData.success) stats = statsData.data;
    } catch (err) {
      console.error('Dashboard load failed', err);
    }
    loading = false;
  });

  function timeAgo(date) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
</script>

<svelte:head><title>Dashboard | SponsorAgent</title></svelte:head>

<div class="dashboard container">
  {#if loading}
    <div class="loading">
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
      <p>Loading dashboard...</p>
    </div>
  {:else if user}
    <header class="dash-header">
      <div>
        <h1>Welcome back, {user.name ?? user.email.split('@')[0]}</h1>
        <p class="dash-sub">Here's your sponsorship overview</p>
      </div>
      <span class="badge badge-accent plan-badge">{user.subscription_plan} plan</span>
    </header>

    <!-- Stats Bar -->
    <div class="stats-grid">
      <div class="stat-card card">
        <div class="stat-label">Total Channels</div>
        <div class="stat-value">{stats.totalChannels}</div>
      </div>
      <div class="stat-card card">
        <div class="stat-label">Analyses This Month</div>
        <div class="stat-value">{stats.analysesThisMonth}</div>
      </div>
      <div class="stat-card card">
        <div class="stat-label">Active Outreach</div>
        <div class="stat-value">{stats.activeOutreach}</div>
      </div>
      <div class="stat-card card">
        <div class="stat-label">Match Rate</div>
        <div class="stat-value">{stats.matchRate}%</div>
      </div>
    </div>

    <div class="dash-grid">
      <!-- Activity Feed -->
      <section class="dash-section">
        <h2>Activity Feed</h2>
        {#if activity.length === 0}
          <div class="empty card">
            <p>No activity yet. <a href="/audit">Run your first audit</a> to get started.</p>
          </div>
        {:else}
          <div class="activity-list">
            {#each activity.slice(0, 10) as item}
              <div class="activity-item card">
                <div class="activity-dot" style="background: var(--accent)"></div>
                <div class="activity-content">
                  <p>{item.description}</p>
                  <span class="activity-time">{timeAgo(item.created_at)}</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </section>

      <!-- Outreach Pipeline -->
      <section class="dash-section">
        <h2>Outreach Pipeline</h2>
        {#if pipeline.length === 0}
          <div class="empty card">
            <p>No outreach yet. Brand matches from your audits will appear here.</p>
          </div>
        {:else}
          <div class="pipeline-summary">
            {#each statusOrder as s}
              {#if pipelineByStatus[s]}
                <div class="pipeline-stat">
                  <span class="pipeline-dot" style="background: {statusColors[s]}"></span>
                  <span class="pipeline-label">{s}</span>
                  <span class="pipeline-count">{pipelineByStatus[s]}</span>
                </div>
              {/if}
            {/each}
          </div>
          <div class="pipeline-list">
            {#each pipeline.slice(0, 8) as item}
              <div class="pipeline-item card">
                <div class="pipeline-main">
                  <strong>{item.brand_name}</strong>
                  {#if item.deal_value}
                    <span class="deal-val">${Number(item.deal_value).toLocaleString()}</span>
                  {/if}
                </div>
                <span class="badge" style="background: {statusColors[item.status]}20; color: {statusColors[item.status]}">{item.status}</span>
              </div>
            {/each}
          </div>
        {/if}
      </section>
    </div>

    <!-- Channel Overview -->
    <section class="channels-section">
      <div class="section-header">
        <h2>Channel Overview</h2>
        <a href="/audit" class="btn btn-secondary" style="padding:0.4rem 1rem;font-size:0.85rem">+ Audit Channel</a>
      </div>
      {#if channels.length === 0}
        <div class="empty card">
          <p>No channels added yet. <a href="/audit">Audit a channel</a> to start building your profile.</p>
        </div>
      {:else}
        <div class="channel-grid">
          {#each channels as ch}
            <div class="channel-card card">
              <div class="channel-platform badge" style="background: var(--accent-glow); color: var(--accent)">{ch.platform_type}</div>
              <h4>{ch.name ?? ch.url}</h4>
              <a href={ch.url} target="_blank" rel="noopener" class="channel-url">{ch.url}</a>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {/if}
</div>

<style>
  .dashboard { padding: 2rem 0 3rem; }
  .loading { text-align: center; padding: 4rem; color: var(--text-muted); }
  .loading-dots { display: flex; gap: 0.35rem; justify-content: center; margin-bottom: 1rem; }
  .loading-dots span { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); animation: pulse 1.2s ease-in-out infinite; }
  .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
  .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
  .dash-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
  .dash-header h1 { font-size: 1.75rem; }
  .dash-sub { color: var(--text-muted); }
  .plan-badge { text-transform: capitalize; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
  .stat-card { text-align: center; }
  .stat-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
  .stat-value { font-size: 1.75rem; font-weight: 700; font-family: var(--font-heading); color: var(--accent); }
  .dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
  .dash-section h2 { font-size: 1.15rem; margin-bottom: 1rem; }
  .empty { text-align: center; padding: 2rem; }
  .empty p { color: var(--text-muted); }
  .activity-list { display: flex; flex-direction: column; gap: 0.5rem; }
  .activity-item { display: flex; gap: 0.75rem; align-items: flex-start; padding: 1rem; }
  .activity-dot { width: 8px; height: 8px; min-width: 8px; border-radius: 50%; margin-top: 6px; }
  .activity-content p { font-size: 0.9rem; }
  .activity-time { font-size: 0.75rem; color: var(--text-dim); }
  .pipeline-summary { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; }
  .pipeline-stat { display: flex; align-items: center; gap: 0.35rem; font-size: 0.85rem; }
  .pipeline-dot { width: 8px; height: 8px; border-radius: 50%; }
  .pipeline-label { color: var(--text-muted); text-transform: capitalize; }
  .pipeline-count { font-weight: 700; color: var(--text); }
  .pipeline-list { display: flex; flex-direction: column; gap: 0.5rem; }
  .pipeline-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; }
  .pipeline-main { display: flex; align-items: center; gap: 1rem; }
  .deal-val { color: var(--accent); font-weight: 600; font-size: 0.9rem; }
  .channels-section { margin-top: 1rem; }
  .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .section-header h2 { font-size: 1.15rem; }
  .channel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
  .channel-card { display: flex; flex-direction: column; gap: 0.4rem; }
  .channel-platform { align-self: flex-start; text-transform: capitalize; }
  .channel-card h4 { font-size: 1rem; }
  .channel-url { font-size: 0.8rem; color: var(--text-dim); word-break: break-all; }
  @media (max-width: 768px) {
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .dash-grid { grid-template-columns: 1fr; }
  }
</style>
