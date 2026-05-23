<script>
  import { onMount } from 'svelte';

  let url = '';
  let loading = false;
  let error = '';
  let results = null;
  let isLoggedIn = false;

  onMount(() => {
    isLoggedIn = !!localStorage.getItem('token');
  });

  function detectPlatformFromUrl(u) {
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
    if (lower.includes('linktree') || lower.includes('linktr.ee')) return 'linktree';
    return 'website';
  }

  $: detectedPlatform = url ? detectPlatformFromUrl(url) : '';

  const platformColors = {
    youtube: '#ff0000',
    twitch: '#9146ff',
    tiktok: '#00f2ea',
    kick: '#53fc19',
    instagram: '#e1306c',
    discord: '#5865f2',
    reddit: '#ff4500',
    facebook: '#1877f2',
    twitter: '#1da1f2',
    linktree: '#43e660',
    website: '#6ee7b7',
  };

  async function findSponsors() {
    if (!url) return;
    error = '';
    loading = true;
    results = null;

    try {
      const headers = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/audit', {
        method: 'POST',
        headers,
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? 'Analysis failed');
      results = data.data;
    } catch (err) {
      error = err.message ?? 'Something went wrong. Please try again.';
    } finally {
      loading = false;
    }
  }

  function getScoreColor(score) {
    if (score >= 75) return 'var(--green)';
    if (score >= 50) return 'var(--accent)';
    if (score >= 30) return 'var(--yellow)';
    return 'var(--red)';
  }
</script>

<svelte:head>
  <title>Find Your Sponsors -- Free Channel Analysis | SponsorAgent</title>
  <meta name="description" content="Paste any channel URL and instantly discover matching brand sponsors, your sponsor score, and what you should charge." />
</svelte:head>

<div class="try-page">
  <section class="hero-mini">
    <div class="container">
      <h1>Find Your <span class="gradient-text">Sponsors</span></h1>
      <p class="subtitle">Paste any channel or social URL below. We'll analyze it and show you matching brands in seconds.</p>

      <div class="input-area card">
        <form on:submit|preventDefault={findSponsors}>
          <div class="url-input-wrap">
            {#if detectedPlatform}
              <span class="platform-badge" style="background: {platformColors[detectedPlatform]}20; color: {platformColors[detectedPlatform]}">
                {detectedPlatform}
              </span>
            {/if}
            <input
              type="url"
              bind:value={url}
              placeholder="Paste any URL: youtube.com/c/..., twitch.tv/..., tiktok.com/@..."
              required
              class="url-input"
            />
          </div>
          <button type="submit" class="btn btn-primary btn-large find-btn" disabled={loading || !url}>
            {#if loading}
              <span class="spinner"></span> Analyzing...
            {:else}
              Find My Sponsors
            {/if}
          </button>
        </form>

        <div class="supported-platforms">
          {#each ['YouTube', 'Twitch', 'TikTok', 'Instagram', 'Discord', 'Reddit', 'Twitter/X', 'Facebook', 'Kick', 'Linktree', 'Any Website'] as p}
            <span class="platform-tag">{p}</span>
          {/each}
        </div>
      </div>
    </div>
  </section>

  {#if error}
    <div class="container">
      <div class="alert-error" style="max-width:700px;margin:1rem auto">{error}</div>
    </div>
  {/if}

  {#if results}
    <section class="results-section">
      <div class="container">
        <div class="results-header">
          <div class="score-circle" style="--score-color: {getScoreColor(results.sponsorScore)}">
            <div class="score-num">{results.sponsorScore}</div>
            <div class="score-label">Sponsor Score</div>
          </div>
          <div class="results-meta">
            <span class="platform-detected badge" style="background: {platformColors[results.platform]}20; color: {platformColors[results.platform]}">
              {results.platform}
            </span>
            <div class="rate-tier">
              <span class="rate-label">Estimated Rate Tier</span>
              <span class="rate-value">{results.rateTier}</span>
            </div>
          </div>
        </div>

        <div class="themes-bar">
          <span class="themes-label">Content Themes:</span>
          {#each results.contentThemes as theme}
            <span class="badge badge-accent">{theme}</span>
          {/each}
        </div>

        <h2 class="matches-title">Brand Matches</h2>
        <div class="matches-grid">
          {#each results.brandMatches as match, i}
            <div class="match-card card" class:blurred={!isLoggedIn && i >= 2}>
              <div class="match-header">
                <h3>{!isLoggedIn && i >= 2 ? '???' : match.brand}</h3>
                <span class="match-score" style="color: {getScoreColor(match.matchScore)}">{match.matchScore}%</span>
              </div>
              <p class="match-deal">{match.estimatedDeal}</p>
              <p class="match-reason">{match.reason}</p>
              <div class="match-cats">
                {#each match.categories as cat}
                  <span class="badge badge-teal">{cat}</span>
                {/each}
              </div>
            </div>

            {#if !isLoggedIn && i === 1}
              <div class="paywall-overlay card">
                <div class="paywall-content">
                  <h3>See All {results.brandMatches.length} Brand Matches</h3>
                  <p>Create a free account to unlock all brand matches, detailed rate recommendations, and AI-powered outreach tools.</p>
                  <div class="paywall-ctas">
                    <a href="/signup" class="btn btn-primary">Sign Up Free</a>
                    <a href="/login" class="btn btn-secondary">Log In</a>
                  </div>
                </div>
              </div>
            {/if}
          {/each}
        </div>

        {#if results.recommendations?.length}
          <div class="recs-section card">
            <h3>Recommendations</h3>
            <ul>
              {#each results.recommendations as rec}
                <li>{rec}</li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    </section>
  {/if}

  {#if !results && !loading}
    <section class="social-proof">
      <div class="container">
        <div class="proof-grid">
          <div class="proof-item card">
            <div class="proof-num">12+</div>
            <p>Platforms supported</p>
          </div>
          <div class="proof-item card">
            <div class="proof-num">50K+</div>
            <p>Brands in database</p>
          </div>
          <div class="proof-item card">
            <div class="proof-num">< 5s</div>
            <p>Analysis time</p>
          </div>
        </div>
      </div>
    </section>
  {/if}
</div>

<style>
  .try-page { padding-bottom: 3rem; }
  .hero-mini { padding: 3rem 0 0; text-align: center; }
  .hero-mini h1 { font-size: clamp(1.75rem, 4vw, 2.75rem); margin-bottom: 0.75rem; }
  .gradient-text {
    background: linear-gradient(135deg, var(--accent), var(--teal));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .subtitle { color: var(--text-muted); max-width: 600px; margin: 0 auto 2rem; font-size: 1.05rem; }
  .input-area { max-width: 700px; margin: 0 auto; }
  .input-area form { display: flex; flex-direction: column; gap: 1rem; }
  .url-input-wrap { position: relative; }
  .platform-badge {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600;
    text-transform: capitalize; z-index: 2;
  }
  .url-input { padding-left: 6rem; font-size: 1rem; }
  .url-input-wrap:not(:has(.platform-badge)) .url-input { padding-left: 1rem; }
  .find-btn { width: 100%; justify-content: center; font-size: 1.05rem; padding: 1rem; }
  .spinner {
    width: 18px; height: 18px; border: 2px solid rgba(0,0,0,0.2);
    border-top-color: #0a0a0f; border-radius: 50%;
    animation: spin 0.6s linear infinite; display: inline-block;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .supported-platforms { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; justify-content: center; }
  .platform-tag { font-size: 0.72rem; color: var(--text-dim); padding: 0.2rem 0.5rem; background: var(--bg-raised); border-radius: 4px; }

  .results-section { padding: 2rem 0; }
  .results-header { display: flex; align-items: center; gap: 2rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .score-circle {
    width: 120px; height: 120px; border-radius: 50%;
    border: 4px solid var(--score-color);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: var(--bg-surface);
  }
  .score-num { font-family: var(--font-heading); font-size: 2.5rem; font-weight: 700; color: var(--score-color); line-height: 1; }
  .score-label { font-size: 0.7rem; color: var(--text-muted); margin-top: 0.25rem; }
  .results-meta { display: flex; flex-direction: column; gap: 0.75rem; }
  .platform-detected { font-size: 0.85rem; padding: 0.3rem 0.8rem; text-transform: capitalize; }
  .rate-label { font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; }
  .rate-value { display: block; font-family: var(--font-heading); font-weight: 600; font-size: 1.1rem; color: var(--accent); }
  .themes-bar { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; margin-bottom: 2rem; }
  .themes-label { font-size: 0.85rem; color: var(--text-muted); margin-right: 0.5rem; }

  .matches-title { font-size: 1.35rem; margin-bottom: 1.25rem; }
  .matches-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; position: relative; }
  .match-card { display: flex; flex-direction: column; gap: 0.5rem; }
  .match-card.blurred { filter: blur(6px); user-select: none; pointer-events: none; }
  .match-header { display: flex; justify-content: space-between; align-items: center; }
  .match-header h3 { font-size: 1.1rem; }
  .match-score { font-family: var(--font-heading); font-weight: 700; font-size: 1.15rem; }
  .match-deal { color: var(--accent); font-weight: 600; font-size: 0.95rem; }
  .match-reason { color: var(--text-muted); font-size: 0.85rem; }
  .match-cats { display: flex; gap: 0.35rem; flex-wrap: wrap; }

  .paywall-overlay {
    grid-column: 1 / -1;
    text-align: center;
    padding: 2.5rem;
    background: linear-gradient(180deg, rgba(18,18,26,0.7), var(--bg-surface));
    border: 1px solid var(--accent);
    box-shadow: 0 0 40px var(--accent-glow);
  }
  .paywall-content h3 { font-size: 1.25rem; margin-bottom: 0.75rem; }
  .paywall-content p { color: var(--text-muted); max-width: 500px; margin: 0 auto 1.5rem; }
  .paywall-ctas { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

  .recs-section { margin-top: 2rem; }
  .recs-section h3 { font-size: 1.1rem; margin-bottom: 0.75rem; }
  .recs-section ul { list-style: none; }
  .recs-section li { padding: 0.4rem 0; font-size: 0.9rem; color: var(--text-muted); }
  .recs-section li::before { content: '\2192  '; color: var(--accent); }

  .social-proof { padding: 3rem 0; }
  .proof-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; max-width: 600px; margin: 0 auto; text-align: center; }
  .proof-num { font-family: var(--font-heading); font-size: 2rem; font-weight: 700; color: var(--accent); }
  .proof-item p { color: var(--text-muted); font-size: 0.85rem; }

  @media (max-width: 768px) {
    .results-header { flex-direction: column; text-align: center; }
    .proof-grid { grid-template-columns: 1fr; }
  }
</style>
