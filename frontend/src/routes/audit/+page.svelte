<script>
  import { onMount } from 'svelte';

  let url = '';
  let email = '';
  let loading = false;
  let error = '';
  let results = null;
  let isLoggedIn = false;
  let showEmailGate = false;
  let emailSubmitted = false;
  let emailError = '';

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

  const platformIcons = {
    youtube: 'YT', twitch: 'TW', tiktok: 'TT', kick: 'KK', instagram: 'IG',
    discord: 'DC', reddit: 'RD', facebook: 'FB', twitter: 'X', linktree: 'LT', website: 'WB',
  };

  const platformColors = {
    youtube: '#ff0000', twitch: '#9146ff', tiktok: '#00f2ea', kick: '#53fc19',
    instagram: '#e1306c', discord: '#5865f2', reddit: '#ff4500', facebook: '#1877f2',
    twitter: '#1da1f2', linktree: '#43e660', website: '#6ee7b7',
  };

  async function runAudit() {
    if (!url) return;
    error = '';
    loading = true;
    results = null;
    showEmailGate = false;

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
      if (!res.ok) throw new Error(data.error?.message ?? 'Audit failed');
      results = data.data;

      // Show email gate for non-logged-in users
      if (!isLoggedIn) {
        showEmailGate = true;
      }
    } catch (err) {
      error = err.message ?? 'Something went wrong.';
    } finally {
      loading = false;
    }
  }

  async function submitEmail() {
    emailError = '';
    if (!email) return;
    try {
      const res = await fetch('/api/v1/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, variant: 'A', source: 'audit_page' }),
      });
      const data = await res.json();
      if (!res.ok && !data.data?.alreadyJoined) throw new Error(data.error?.message ?? 'Failed');
      emailSubmitted = true;
      showEmailGate = false;
    } catch (err) {
      emailError = err.message;
    }
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

<svelte:head>
  <title>Channel Audit -- Sponsor Score & Brand Matching | SponsorAgent</title>
  <meta name="description" content="Free channel audit tool. Get your sponsor score, matching brands, and rate recommendations for any platform." />
</svelte:head>

<div class="audit-page">
  <section class="audit-hero">
    <div class="container">
      <h1>Channel <span class="gradient-text">Audit</span></h1>
      <p class="subtitle">Get your sponsorship readiness score, matching brands, and rate tier for any platform.</p>

      <div class="audit-input card">
        <form on:submit|preventDefault={runAudit}>
          <div class="input-row">
            {#if detectedPlatform}
              <div class="platform-indicator" style="background: {platformColors[detectedPlatform]}">
                {platformIcons[detectedPlatform]}
              </div>
            {/if}
            <input
              type="url"
              bind:value={url}
              placeholder="https://youtube.com/c/yourchannel"
              required
              class="audit-url-input"
              style="{detectedPlatform ? 'padding-left: 3.5rem' : ''}"
            />
            <button type="submit" class="btn btn-primary audit-btn" disabled={loading || !url}>
              {loading ? 'Analyzing...' : 'Audit Channel'}
            </button>
          </div>
        </form>
        <p class="auto-detect-note">Auto-detects: YouTube, Twitch, TikTok, Instagram, Discord, Reddit, Twitter/X, Facebook, Kick, Linktree, and any website</p>
      </div>
    </div>
  </section>

  {#if error}
    <div class="container">
      <div class="alert-error" style="max-width:700px;margin:1rem auto">{error}</div>
    </div>
  {/if}

  {#if results}
    <section class="audit-results">
      <div class="container">
        <!-- Score Overview -->
        <div class="score-overview">
          <div class="score-display">
            <div class="score-ring" style="--score-pct: {results.sponsorScore}%; --score-color: {getScoreColor(results.sponsorScore)}">
              <svg viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" stroke-width="8" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--score-color)" stroke-width="8"
                  stroke-dasharray="{results.sponsorScore * 3.27} 327" stroke-dashoffset="0"
                  transform="rotate(-90 60 60)" stroke-linecap="round" />
              </svg>
              <div class="score-center">
                <span class="score-number">{results.sponsorScore}</span>
                <span class="score-max">/100</span>
              </div>
            </div>
            <div class="score-info">
              <h2>Sponsor Score: <span style="color: {getScoreColor(results.sponsorScore)}">{getScoreLabel(results.sponsorScore)}</span></h2>
              <div class="meta-row">
                <span class="badge" style="background: {platformColors[results.platform]}20; color: {platformColors[results.platform]}">{results.platform}</span>
                <span class="rate-tier-badge badge badge-accent">{results.rateTier}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Content Themes -->
        <div class="section-block card">
          <h3>Content Themes</h3>
          <div class="theme-tags">
            {#each results.contentThemes as theme}
              <span class="badge badge-accent">{theme}</span>
            {/each}
          </div>
        </div>

        <!-- Brand Matches -->
        <div class="section-block">
          <h3>Brand Matches ({results.brandMatches.length})</h3>
          <div class="brand-list">
            {#each results.brandMatches as match, i}
              <div class="brand-row card" class:blurred={showEmailGate && !emailSubmitted && i >= 3}>
                <div class="brand-main">
                  <div class="brand-name-row">
                    <strong>{showEmailGate && !emailSubmitted && i >= 3 ? '????????' : match.brand}</strong>
                    <span class="brand-score" style="color: {getScoreColor(match.matchScore)}">{match.matchScore}% match</span>
                  </div>
                  <p class="brand-deal">{match.estimatedDeal}</p>
                  <p class="brand-reason">{match.reason}</p>
                </div>
                <div class="brand-cats">
                  {#each match.categories as cat}
                    <span class="badge badge-teal">{cat}</span>
                  {/each}
                </div>
              </div>
            {/each}
          </div>

          <!-- Email Gate -->
          {#if showEmailGate && !emailSubmitted}
            <div class="email-gate card">
              <h3>Get the Full Report</h3>
              <p>Enter your email to see all brand matches and detailed recommendations.</p>
              {#if emailError}
                <div class="alert-error">{emailError}</div>
              {/if}
              <form class="gate-form" on:submit|preventDefault={submitEmail}>
                <input type="email" bind:value={email} placeholder="you@example.com" required />
                <button type="submit" class="btn btn-primary">Unlock Full Results</button>
              </form>
              <p class="gate-alt">or <a href="/signup">create an account</a> for unlimited audits</p>
            </div>
          {/if}
        </div>

        <!-- Recommendations -->
        {#if results.recommendations?.length}
          <div class="section-block card">
            <h3>Recommendations</h3>
            <div class="recs-list">
              {#each results.recommendations as rec, i}
                <div class="rec-item">
                  <span class="rec-num">{i + 1}</span>
                  <p>{rec}</p>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- CTA -->
        <div class="audit-cta card">
          <h3>Ready to land sponsors?</h3>
          <p>Create a free account to save your audit results, track multiple channels, and start AI-powered outreach.</p>
          <div class="cta-btns">
            <a href="/signup" class="btn btn-primary">Sign Up Free</a>
            <a href="/pricing" class="btn btn-secondary">See Plans</a>
          </div>
        </div>
      </div>
    </section>
  {/if}
</div>

<style>
  .audit-page { padding-bottom: 3rem; }
  .audit-hero { padding: 3rem 0 0; text-align: center; }
  .audit-hero h1 { font-size: clamp(1.75rem, 4vw, 2.75rem); margin-bottom: 0.75rem; }
  .gradient-text {
    background: linear-gradient(135deg, var(--accent), var(--teal));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .subtitle { color: var(--text-muted); max-width: 560px; margin: 0 auto 2rem; }
  .audit-input { max-width: 700px; margin: 0 auto; }
  .input-row { display: flex; gap: 0.75rem; position: relative; }
  .platform-indicator {
    position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
    width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center;
    justify-content: center; font-weight: 700; font-size: 0.75rem; color: white; z-index: 2;
  }
  .audit-url-input { flex: 1; }
  .audit-btn { white-space: nowrap; }
  .auto-detect-note { font-size: 0.75rem; color: var(--text-dim); margin-top: 0.75rem; text-align: center; }

  .audit-results { padding: 2rem 0; }
  .score-overview { margin-bottom: 2rem; }
  .score-display { display: flex; align-items: center; gap: 2rem; flex-wrap: wrap; }
  .score-ring { width: 130px; height: 130px; position: relative; }
  .score-ring svg { width: 100%; height: 100%; }
  .score-center {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    text-align: center;
  }
  .score-number { font-family: var(--font-heading); font-size: 2.25rem; font-weight: 700; color: var(--score-color); }
  .score-max { font-size: 0.8rem; color: var(--text-dim); display: block; margin-top: -4px; }
  .score-info h2 { font-size: 1.25rem; margin-bottom: 0.5rem; }
  .meta-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }

  .section-block { margin-bottom: 1.5rem; }
  .section-block h3 { font-size: 1.1rem; margin-bottom: 1rem; }
  .theme-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }

  .brand-list { display: flex; flex-direction: column; gap: 0.75rem; }
  .brand-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; }
  .brand-row.blurred { filter: blur(6px); user-select: none; pointer-events: none; }
  .brand-name-row { display: flex; align-items: center; gap: 1rem; }
  .brand-score { font-family: var(--font-heading); font-weight: 600; font-size: 0.9rem; }
  .brand-deal { color: var(--accent); font-weight: 600; font-size: 0.9rem; margin-top: 0.25rem; }
  .brand-reason { color: var(--text-muted); font-size: 0.85rem; }
  .brand-cats { display: flex; gap: 0.35rem; flex-wrap: wrap; }

  .email-gate { text-align: center; margin-top: 1.5rem; padding: 2rem; border-color: var(--accent); box-shadow: 0 0 30px var(--accent-glow); }
  .email-gate h3 { font-size: 1.2rem; margin-bottom: 0.5rem; }
  .email-gate > p { color: var(--text-muted); margin-bottom: 1rem; }
  .gate-form { display: flex; gap: 0.75rem; max-width: 450px; margin: 0 auto; }
  .gate-form input { flex: 1; }
  .gate-alt { font-size: 0.85rem; color: var(--text-dim); margin-top: 1rem; }

  .recs-list { display: flex; flex-direction: column; gap: 0.75rem; }
  .rec-item { display: flex; gap: 1rem; align-items: flex-start; }
  .rec-num {
    width: 28px; height: 28px; min-width: 28px; border-radius: 50%;
    background: var(--accent-glow); color: var(--accent);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.8rem; font-weight: 700;
  }
  .rec-item p { color: var(--text-muted); font-size: 0.9rem; }

  .audit-cta {
    text-align: center; margin-top: 2rem; padding: 2.5rem;
    background: radial-gradient(circle at center, var(--accent-glow), var(--bg-surface));
    border-color: var(--accent);
  }
  .audit-cta h3 { font-size: 1.35rem; margin-bottom: 0.5rem; }
  .audit-cta p { color: var(--text-muted); max-width: 500px; margin: 0 auto 1.5rem; }
  .cta-btns { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

  @media (max-width: 768px) {
    .input-row { flex-direction: column; }
    .score-display { flex-direction: column; text-align: center; }
    .gate-form { flex-direction: column; }
  }
</style>
