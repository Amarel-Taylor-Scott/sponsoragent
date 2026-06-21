<script>
  let email = '';
  let submitted = false;
  let error = '';
  let loading = false;

  async function joinWaitlist() {
    error = '';
    loading = true;
    try {
      const res = await fetch('/api/v1/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, variant: 'A', source: 'youtube_landing' }),
      });
      const data = await res.json();
      if (!res.ok && !data.data?.alreadyJoined) throw new Error(data.error?.message ?? 'Failed');
      submitted = true;
    } catch (err) { error = err.message; }
    finally { loading = false; }
  }
</script>

<svelte:head>
  <title>YouTube Sponsorship Manager | SponsorAgent</title>
  <meta name="description" content="Find YouTube sponsors automatically. SponsorAgent analyzes your channel, matches you with brands, and recommends what to charge." />
</svelte:head>

<div class="platform-page container">
  <div class="platform-hero">
    <span class="platform-badge" style="background: rgba(255,0,0,0.15); color: #ff0000">YouTube</span>
    <h1>Find Sponsors for Your <span class="gradient-text">YouTube Channel</span></h1>
    <p>SponsorAgent analyzes your YouTube channel and matches you with brands that align with your content, audience, and niche.</p>

    <div class="features">
      <div class="feature card">
        <h3>Channel Analysis</h3>
        <p>Paste your YouTube channel URL and get a complete sponsorship readiness score, content theme breakdown, and recommended rate tier.</p>
      </div>
      <div class="feature card">
        <h3>Brand Matching</h3>
        <p>Our AI matches you with brands from our database of 50K+ sponsors. See estimated deal values and fit scores for each match.</p>
      </div>
      <div class="feature card">
        <h3>Rate Optimization</h3>
        <p>Stop undercharging. We analyze CPM data, audience quality, and engagement to recommend competitive sponsorship rates.</p>
      </div>
    </div>

    <div class="cta-section card">
      <h2>Get Early Access</h2>
      {#if submitted}
        <div class="alert-success">You're on the list! We'll notify you when YouTube-specific features launch.</div>
      {:else}
        {#if error}<div class="alert-error">{error}</div>{/if}
        <form class="waitlist-form" on:submit|preventDefault={joinWaitlist}>
          <input type="email" bind:value={email} placeholder="you@example.com" required />
          <button type="submit" class="btn btn-primary" disabled={loading}>{loading ? 'Joining...' : 'Join Waitlist'}</button>
        </form>
      {/if}
      <p class="cta-alt">or <a href="/try">try a free channel audit now</a></p>
    </div>
  </div>
</div>

<style>
  .platform-page { padding: 3rem 0; max-width: 800px; }
  .platform-hero { text-align: center; }
  .platform-badge { display: inline-block; padding: 0.3rem 0.8rem; border-radius: 6px; font-size: 0.85rem; font-weight: 600; margin-bottom: 1rem; }
  h1 { font-size: clamp(1.75rem, 4vw, 2.5rem); margin-bottom: 1rem; }
  .gradient-text { background: linear-gradient(135deg, #ff0000, #ff6b6b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .platform-hero > p { color: var(--text-muted); max-width: 600px; margin: 0 auto 2rem; font-size: 1.05rem; }
  .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 2rem; text-align: left; }
  .feature h3 { font-size: 1rem; margin-bottom: 0.5rem; }
  .feature p { font-size: 0.88rem; color: var(--text-muted); }
  .cta-section { max-width: 500px; margin: 0 auto; text-align: center; }
  .cta-section h2 { font-size: 1.25rem; margin-bottom: 1rem; }
  .waitlist-form { display: flex; gap: 0.75rem; }
  .waitlist-form input { flex: 1; }
  .cta-alt { margin-top: 1rem; font-size: 0.85rem; color: var(--text-dim); }
</style>
