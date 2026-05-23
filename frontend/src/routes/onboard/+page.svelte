<script>
  import { onMount } from 'svelte';

  let step = 1;
  let loading = false;
  let error = '';

  // Step 1 - Connect Channel
  let channelUrl = '';
  let channelSkipped = false;
  let auditResults = null;
  let auditLoading = false;

  // Step 2 - Preferences
  let selectedNiches = [];
  let minDealValue = 500;
  let prefsSkipped = false;

  const NICHES = [
    'Gaming', 'Tech', 'Beauty', 'Fashion', 'Fitness', 'Food', 'Travel',
    'Education', 'Finance', 'Music', 'Comedy', 'Entertainment', 'Lifestyle',
    'Health', 'Sports', 'Business', 'Science', 'Art', 'Photography', 'DIY',
  ];

  const platformIcons = {
    youtube: 'YT', twitch: 'TW', tiktok: 'TT', kick: 'KK', instagram: 'IG',
    discord: 'DC', reddit: 'RD', facebook: 'FB', twitter: 'X', linktree: 'LT', website: 'WB',
    linkinbio: 'LB',
  };

  const platformColors = {
    youtube: '#ff0000', twitch: '#9146ff', tiktok: '#00f2ea', kick: '#53fc19',
    instagram: '#e1306c', discord: '#5865f2', reddit: '#ff4500', facebook: '#1877f2',
    twitter: '#1da1f2', linktree: '#43e660', website: '#6ee7b7', linkinbio: '#43e660',
  };

  onMount(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/signup';
    }
  });

  function detectPlatform(u) {
    const lower = u.toLowerCase();
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
    if (lower.includes('twitch.tv')) return 'twitch';
    if (lower.includes('tiktok.com')) return 'tiktok';
    if (lower.includes('kick.com')) return 'kick';
    if (lower.includes('instagram.com')) return 'instagram';
    if (lower.includes('discord.gg') || lower.includes('discord.com')) return 'discord';
    if (lower.includes('reddit.com')) return 'reddit';
    if (lower.includes('facebook.com') || lower.includes('fb.com')) return 'facebook';
    if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter';
    if (lower.includes('linktr.ee') || lower.includes('bio.link') || lower.includes('beacons.ai')) return 'linkinbio';
    return 'website';
  }

  $: detectedPlatform = channelUrl ? detectPlatform(channelUrl) : '';

  async function runAudit() {
    if (!channelUrl) return;
    auditLoading = true;
    error = '';
    auditResults = null;

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/audit', {
        method: 'POST',
        headers,
        body: JSON.stringify({ url: channelUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? 'Audit failed');
      auditResults = data.data;
    } catch (err) {
      error = err.message ?? 'Something went wrong.';
    } finally {
      auditLoading = false;
    }
  }

  function skipStep1() {
    channelSkipped = true;
    step = 2;
  }

  function nextFromStep1() {
    step = 2;
  }

  function toggleNiche(niche) {
    if (selectedNiches.includes(niche)) {
      selectedNiches = selectedNiches.filter(n => n !== niche);
    } else {
      selectedNiches = [...selectedNiches, niche];
    }
  }

  function skipStep2() {
    prefsSkipped = true;
    step = 3;
  }

  async function savePreferences() {
    const token = localStorage.getItem('token');
    if (!token) return;

    loading = true;
    try {
      await fetch('/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          content_niches: selectedNiches,
          min_deal_value: minDealValue,
        }),
      });
    } catch (err) {
      // Non-critical, continue
    }
    loading = false;
    step = 3;
  }

  async function finishOnboarding() {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/dashboard';
      return;
    }

    try {
      await fetch('/api/v1/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ onboarding_completed: true }),
      }).catch(() => {});
    } catch {
      // Non-critical
    }

    window.location.href = '/dashboard';
  }

  function getScoreColor(score) {
    if (score >= 75) return 'var(--green)';
    if (score >= 50) return 'var(--accent)';
    if (score >= 30) return 'var(--yellow)';
    return 'var(--red)';
  }

  function getScoreLabel(score) {
    if (score >= 80) return 'Excellent';
    if (score >= 65) return 'Good';
    if (score >= 50) return 'Fair';
    if (score >= 35) return 'Developing';
    return 'Early stage';
  }
</script>

<svelte:head><title>Get Started | SponsorAgent</title></svelte:head>

<div class="onboard-page">
  <!-- Progress Bar -->
  <div class="progress-bar">
    <div class="progress-track">
      <div class="progress-fill" style="width: {(step / 3) * 100}%"></div>
    </div>
    <div class="progress-steps">
      <div class="progress-step" class:active={step >= 1} class:done={step > 1}>
        <span class="step-num">{step > 1 ? '&#10003;' : '1'}</span>
        <span class="step-label">Connect</span>
      </div>
      <div class="progress-step" class:active={step >= 2} class:done={step > 2}>
        <span class="step-num">{step > 2 ? '&#10003;' : '2'}</span>
        <span class="step-label">Preferences</span>
      </div>
      <div class="progress-step" class:active={step >= 3}>
        <span class="step-num">3</span>
        <span class="step-label">Results</span>
      </div>
    </div>
  </div>

  <div class="container onboard-container">
    <!-- Step 1: Connect Channel -->
    {#if step === 1}
      <div class="step-content">
        <h1>Connect your channel</h1>
        <p class="step-desc">Paste a link to any of your social media channels or website. We will analyze it and find matching sponsors.</p>

        <div class="channel-input card">
          <form on:submit|preventDefault={runAudit}>
            <div class="input-row">
              {#if detectedPlatform}
                <div class="platform-indicator" style="background: {platformColors[detectedPlatform]}">
                  {platformIcons[detectedPlatform]}
                </div>
              {/if}
              <input
                type="url"
                bind:value={channelUrl}
                placeholder="https://youtube.com/@yourchannel"
                class="channel-url-input"
                style="{detectedPlatform ? 'padding-left: 3.5rem' : ''}"
              />
              <button type="submit" class="btn btn-primary" disabled={auditLoading || !channelUrl}>
                {auditLoading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </form>
          <p class="detect-note">Auto-detects: YouTube, Twitch, Instagram, Discord, Reddit, Twitter/X, Facebook, Linktree, and more</p>
        </div>

        {#if error}
          <div class="alert-error">{error}</div>
        {/if}

        {#if auditResults}
          <div class="audit-preview card">
            <div class="preview-header">
              <div class="preview-score" style="color: {getScoreColor(auditResults.sponsorScore)}">
                <span class="score-big">{auditResults.sponsorScore}</span>
                <span class="score-label">Sponsor Score</span>
              </div>
              <div class="preview-info">
                <h3>{auditResults.channelName || 'Channel'}</h3>
                <span class="badge" style="background: {platformColors[auditResults.platform]}20; color: {platformColors[auditResults.platform]}">{auditResults.platform}</span>
                <span class="badge badge-accent">{auditResults.rateTier}</span>
              </div>
            </div>
            {#if auditResults.contentThemes?.length}
              <div class="preview-themes">
                {#each auditResults.contentThemes as theme}
                  <span class="badge badge-teal">{theme}</span>
                {/each}
              </div>
            {/if}
            <p class="preview-match">Found {auditResults.brandMatches?.length ?? 0} matching brand(s)</p>
          </div>
        {/if}

        <div class="step-actions">
          <button class="btn btn-ghost" on:click={skipStep1}>Skip for now</button>
          <button class="btn btn-primary" on:click={nextFromStep1} disabled={!auditResults && !channelUrl}>
            {auditResults ? 'Continue' : 'Next'}
          </button>
        </div>
      </div>

    <!-- Step 2: Set Preferences -->
    {:else if step === 2}
      <div class="step-content">
        <h1>Set your preferences</h1>
        <p class="step-desc">Help us find the best brand matches by selecting your content niches and minimum deal value.</p>

        <div class="prefs-section card">
          <h3>Content Niches</h3>
          <p class="pref-sub">Select all that apply to your content.</p>
          <div class="niche-grid">
            {#each NICHES as niche}
              <button
                class="niche-btn"
                class:selected={selectedNiches.includes(niche)}
                on:click={() => toggleNiche(niche)}
              >
                {niche}
              </button>
            {/each}
          </div>
        </div>

        <div class="prefs-section card">
          <h3>Minimum Deal Value</h3>
          <p class="pref-sub">Only match with brands offering at least this much per deal.</p>
          <div class="slider-wrap">
            <input type="range" min="100" max="10000" step="100" bind:value={minDealValue} class="deal-slider" />
            <div class="slider-labels">
              <span>$100</span>
              <span class="slider-value">${minDealValue.toLocaleString()}</span>
              <span>$10,000</span>
            </div>
          </div>
        </div>

        <div class="step-actions">
          <button class="btn btn-ghost" on:click={() => step = 1}>Back</button>
          <div class="step-actions-right">
            <button class="btn btn-ghost" on:click={skipStep2}>Skip</button>
            <button class="btn btn-primary" on:click={savePreferences} disabled={loading}>
              {loading ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        </div>
      </div>

    <!-- Step 3: See Results -->
    {:else if step === 3}
      <div class="step-content">
        <h1>You are all set</h1>

        {#if auditResults && !channelSkipped}
          <p class="step-desc">Here is your channel analysis summary. Head to the dashboard to explore matching brands and start outreach.</p>

          <div class="results-summary card">
            <div class="summary-header">
              <div class="summary-score" style="color: {getScoreColor(auditResults.sponsorScore)}">
                <svg viewBox="0 0 120 120" width="100" height="100">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" stroke-width="8" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="{getScoreColor(auditResults.sponsorScore)}" stroke-width="8"
                    stroke-dasharray="{auditResults.sponsorScore * 3.27} 327" stroke-dashoffset="0"
                    transform="rotate(-90 60 60)" stroke-linecap="round" />
                </svg>
                <div class="summary-score-inner">
                  <span class="score-num">{auditResults.sponsorScore}</span>
                  <span class="score-of">/100</span>
                </div>
              </div>
              <div class="summary-details">
                <h2>{auditResults.channelName || 'Your Channel'}</h2>
                <p class="summary-tier">{auditResults.rateTier}</p>
                <div class="summary-themes">
                  {#each (auditResults.contentThemes || []).slice(0, 4) as theme}
                    <span class="badge badge-accent">{theme}</span>
                  {/each}
                </div>
              </div>
            </div>

            {#if auditResults.brandMatches?.length}
              <h3 class="mt-1">Top Brand Matches</h3>
              <div class="summary-brands">
                {#each auditResults.brandMatches.slice(0, 5) as match}
                  <div class="brand-row">
                    <span class="brand-name">{match.brand}</span>
                    <span class="brand-deal">{match.estimatedDeal}</span>
                    <span class="brand-match" style="color: {getScoreColor(match.matchScore)}">{match.matchScore}%</span>
                  </div>
                {/each}
              </div>
            {/if}

            {#if auditResults.recommendations?.length}
              <h3 class="mt-1">Top Recommendations</h3>
              <ul class="summary-recs">
                {#each auditResults.recommendations.slice(0, 3) as rec}
                  <li>{rec}</li>
                {/each}
              </ul>
            {/if}
          </div>

        {:else}
          <p class="step-desc">You can run a channel audit anytime from the dashboard. Here is what you can do next:</p>

          <div class="empty-state card">
            <div class="empty-cards">
              <a href="/audit" class="empty-card">
                <span class="empty-icon">&#128269;</span>
                <strong>Run a Channel Audit</strong>
                <p>Get your sponsor score and matching brands</p>
              </a>
              <a href="/outreach" class="empty-card">
                <span class="empty-icon">&#128233;</span>
                <strong>Start Outreach</strong>
                <p>Draft and send pitches to brands</p>
              </a>
              <a href="/settings" class="empty-card">
                <span class="empty-icon">&#9881;</span>
                <strong>Configure Settings</strong>
                <p>Fine-tune your preferences and niches</p>
              </a>
            </div>
          </div>
        {/if}

        <div class="step-actions">
          <button class="btn btn-ghost" on:click={() => step = 2}>Back</button>
          <button class="btn btn-primary btn-large" on:click={finishOnboarding}>
            Go to Dashboard
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .onboard-page { padding-bottom: 3rem; }
  .onboard-container { max-width: 700px; }

  /* Progress Bar */
  .progress-bar { padding: 2rem 1.5rem 0; max-width: 500px; margin: 0 auto; }
  .progress-track { height: 4px; background: var(--border); border-radius: 2px; margin-bottom: 1rem; overflow: hidden; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--teal)); border-radius: 2px; transition: width 0.4s ease; }
  .progress-steps { display: flex; justify-content: space-between; }
  .progress-step { display: flex; flex-direction: column; align-items: center; gap: 0.35rem; }
  .step-num {
    width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-size: 0.8rem; font-weight: 700; background: var(--bg-raised); color: var(--text-dim); border: 2px solid var(--border);
    transition: all 0.3s;
  }
  .progress-step.active .step-num { border-color: var(--accent); color: var(--accent); background: var(--accent-glow); }
  .progress-step.done .step-num { border-color: var(--green); color: var(--green); background: rgba(34,197,94,0.15); }
  .step-label { font-size: 0.75rem; color: var(--text-dim); }
  .progress-step.active .step-label { color: var(--text-muted); }

  /* Step Content */
  .step-content { padding: 2.5rem 0; }
  .step-content h1 { font-size: 1.75rem; margin-bottom: 0.5rem; }
  .step-desc { color: var(--text-muted); margin-bottom: 2rem; }

  /* Step 1 - Channel Input */
  .channel-input { margin-bottom: 1.5rem; }
  .input-row { display: flex; gap: 0.75rem; position: relative; }
  .platform-indicator {
    position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
    width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center;
    justify-content: center; font-weight: 700; font-size: 0.75rem; color: white; z-index: 2;
  }
  .channel-url-input { flex: 1; }
  .detect-note { font-size: 0.75rem; color: var(--text-dim); margin-top: 0.75rem; text-align: center; }

  .audit-preview { margin-bottom: 1.5rem; }
  .preview-header { display: flex; gap: 1.5rem; align-items: center; margin-bottom: 1rem; }
  .preview-score { text-align: center; }
  .score-big { font-size: 2.5rem; font-weight: 700; font-family: var(--font-heading); display: block; }
  .score-label { font-size: 0.75rem; color: var(--text-muted); }
  .preview-info { flex: 1; }
  .preview-info h3 { margin-bottom: 0.5rem; }
  .preview-info .badge { margin-right: 0.5rem; }
  .preview-themes { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.75rem; }
  .preview-match { color: var(--accent); font-weight: 600; margin-top: 0.75rem; }

  /* Step 2 - Preferences */
  .prefs-section { margin-bottom: 1.5rem; }
  .prefs-section h3 { font-size: 1.1rem; margin-bottom: 0.25rem; }
  .pref-sub { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem; }
  .niche-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .niche-btn {
    padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.82rem;
    background: var(--bg-raised); color: var(--text-muted); border: 1px solid var(--border);
    cursor: pointer; transition: all 0.2s;
  }
  .niche-btn.selected { background: var(--accent-glow); color: var(--accent); border-color: var(--accent); }
  .niche-btn:hover { border-color: var(--accent); }
  .slider-wrap { padding: 0.5rem 0; }
  .deal-slider { width: 100%; accent-color: var(--accent); }
  .slider-labels { display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem; }
  .slider-value { font-weight: 700; color: var(--accent); font-size: 1.1rem; }

  /* Step 3 - Results */
  .results-summary { margin-bottom: 1.5rem; }
  .summary-header { display: flex; gap: 1.5rem; align-items: center; margin-bottom: 1.5rem; }
  .summary-score { position: relative; width: 100px; height: 100px; flex-shrink: 0; }
  .summary-score-inner {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;
  }
  .score-num { font-size: 1.75rem; font-weight: 700; font-family: var(--font-heading); }
  .score-of { font-size: 0.7rem; color: var(--text-dim); display: block; margin-top: -4px; }
  .summary-details h2 { font-size: 1.25rem; margin-bottom: 0.35rem; }
  .summary-tier { color: var(--accent); font-weight: 600; font-size: 0.9rem; margin-bottom: 0.5rem; }
  .summary-themes { display: flex; flex-wrap: wrap; gap: 0.35rem; }
  .mt-1 { margin-top: 1.5rem; margin-bottom: 0.75rem; font-size: 1rem; }
  .summary-brands { display: flex; flex-direction: column; gap: 0.5rem; }
  .brand-row {
    display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0;
    border-bottom: 1px solid var(--border-subtle);
  }
  .brand-name { font-weight: 600; }
  .brand-deal { color: var(--accent); font-weight: 600; font-size: 0.9rem; }
  .brand-match { font-family: var(--font-heading); font-weight: 600; }
  .summary-recs { padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; }
  .summary-recs li { color: var(--text-muted); font-size: 0.9rem; line-height: 1.5; }

  /* Empty State */
  .empty-state { margin-bottom: 1.5rem; }
  .empty-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
  .empty-card {
    display: flex; flex-direction: column; align-items: center; text-align: center;
    padding: 1.5rem 1rem; background: var(--bg-raised); border: 1px solid var(--border);
    border-radius: var(--radius-sm); transition: all 0.2s; gap: 0.5rem;
    color: var(--text);
  }
  .empty-card:hover { border-color: var(--accent); transform: translateY(-2px); color: var(--text); }
  .empty-icon { font-size: 1.75rem; display: block; }
  .empty-card strong { font-size: 0.95rem; }
  .empty-card p { font-size: 0.8rem; color: var(--text-muted); }

  /* Actions */
  .step-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; }
  .step-actions-right { display: flex; gap: 0.75rem; }

  @media (max-width: 768px) {
    .input-row { flex-direction: column; }
    .preview-header { flex-direction: column; text-align: center; }
    .summary-header { flex-direction: column; text-align: center; }
    .empty-cards { grid-template-columns: 1fr; }
  }
</style>
