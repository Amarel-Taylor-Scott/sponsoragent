<script>
  let email = '';
  let submitted = false;
  let error = '';
  let loading = false;
  async function joinWaitlist() {
    error = ''; loading = true;
    try {
      const res = await fetch('/api/v1/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, variant: 'A', source: 'reddit_landing' }) });
      const data = await res.json();
      if (!res.ok && !data.data?.alreadyJoined) throw new Error(data.error?.message ?? 'Failed');
      submitted = true;
    } catch (err) { error = err.message; } finally { loading = false; }
  }
</script>
<svelte:head>
  <title>Reddit Sponsorships for Creators | SponsorAgent</title>
  <meta name="description" content="Find sponsors for your Reddit presence. SponsorAgent analyzes your subreddit engagement and matches you with relevant brands." />
</svelte:head>
<div class="platform-page container">
  <div class="platform-hero">
    <span class="platform-badge" style="background: rgba(255,69,0,0.15); color: #ff4500">Reddit</span>
    <h1>Monetize Your <span class="gradient-text">Reddit Presence</span></h1>
    <p>SponsorAgent helps Reddit creators and moderators find brand partnerships based on subreddit niche, karma, and engagement.</p>
    <div class="features">
      <div class="feature card"><h3>Subreddit Analysis</h3><p>We analyze your posting history, karma distribution, and community influence to score sponsorship readiness.</p></div>
      <div class="feature card"><h3>Niche Authority</h3><p>Brands value niche authority on Reddit. We match you based on your subject expertise and community standing.</p></div>
      <div class="feature card"><h3>AMA Sponsorships</h3><p>Monetize your expertise through sponsored AMAs, promoted discussions, and brand ambassador opportunities.</p></div>
    </div>
    <div class="cta-section card">
      <h2>Get Early Access</h2>
      {#if submitted}<div class="alert-success">You're on the list!</div>
      {:else}
        {#if error}<div class="alert-error">{error}</div>{/if}
        <form class="waitlist-form" on:submit|preventDefault={joinWaitlist}>
          <input type="email" bind:value={email} placeholder="you@example.com" required />
          <button type="submit" class="btn btn-primary" disabled={loading}>{loading ? 'Joining...' : 'Join Waitlist'}</button>
        </form>
      {/if}
      <p class="cta-alt">or <a href="/try">try a free audit now</a></p>
    </div>
  </div>
</div>
<style>
  .platform-page { padding: 3rem 0; max-width: 800px; }
  .platform-hero { text-align: center; }
  .platform-badge { display: inline-block; padding: 0.3rem 0.8rem; border-radius: 6px; font-size: 0.85rem; font-weight: 600; margin-bottom: 1rem; }
  h1 { font-size: clamp(1.75rem, 4vw, 2.5rem); margin-bottom: 1rem; }
  .gradient-text { background: linear-gradient(135deg, #ff4500, #ff7b4f); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
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
