<script>
  import { onMount } from 'svelte';

  let variant = 'A';
  let waitlistEmail = '';
  let waitlistSubmitting = false;
  let waitlistMessage = '';
  let waitlistError = '';
  let waitlistCount = 0;
  let faqOpen = [false, false, false, false, false];

  onMount(async () => {
    // A/B test: coin flip stored in localStorage
    if (typeof localStorage !== 'undefined') {
      let stored = localStorage.getItem('sa_variant');
      if (!stored) {
        stored = Math.random() > 0.5 ? 'B' : 'A';
        localStorage.setItem('sa_variant', stored);
      }
      variant = stored;
    }

    // Fetch waitlist count
    try {
      const res = await fetch('/api/v1/waitlist/count');
      const data = await res.json();
      if (data.success) waitlistCount = data.data.count;
    } catch {}
  });

  async function joinWaitlist() {
    waitlistError = '';
    waitlistMessage = '';
    if (!waitlistEmail) return;
    waitlistSubmitting = true;
    try {
      const res = await fetch('/api/v1/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail, variant, source: 'landing' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? 'Failed to join');
      waitlistMessage = data.data.message;
      if (data.data.position) waitlistCount = data.data.position;
    } catch (err) {
      waitlistError = err.message ?? 'Something went wrong';
    } finally {
      waitlistSubmitting = false;
    }
  }

  function toggleFaq(i) {
    faqOpen = faqOpen.map((v, idx) => idx === i ? !v : v);
  }

  const features = [
    { title: 'Auto-Detect Platform', desc: 'Paste any URL. We detect YouTube, Twitch, TikTok, Instagram, Discord, Reddit, and more instantly.' },
    { title: 'Brand Match Engine', desc: 'Our AI matches your channel to sponsors based on content themes, audience fit, and engagement quality.' },
    { title: 'Sponsor Score', desc: 'Get a 0-100 sponsorship readiness score with actionable insights to increase your earning potential.' },
    { title: 'Rate Recommendations', desc: 'Know exactly what to charge. We analyze your tier and recommend pricing based on real market data.' },
    { title: 'Outreach Pipeline', desc: 'Track every brand conversation from draft to closed deal. Never lose a sponsorship opportunity.' },
    { title: 'AI-Powered Agent', desc: 'Your AI agent finds sponsors, drafts outreach emails, and manages follow-ups while you create.' },
  ];

  const stats = [
    { value: '12+', label: 'Platforms supported' },
    { value: '50K+', label: 'Brand database' },
    { value: '89%', label: 'Match accuracy' },
    { value: '<5s', label: 'Analysis time' },
  ];

  const faqs = [
    { q: 'What platforms does SponsorAgent support?', a: 'YouTube, Twitch, TikTok, Kick, Instagram, Discord, Reddit, Facebook, Twitter/X, websites, and Linktree. We auto-detect the platform from any URL you provide.' },
    { q: 'How does the sponsor matching work?', a: 'We analyze your content themes, audience demographics, engagement patterns, and channel growth to match you with relevant brands from our database. Each match includes an estimated deal value and fit score.' },
    { q: 'Is the free plan actually free?', a: 'Yes. The free plan includes 1 channel, 3 analyses per month, and access to our channel audit tool. No credit card required.' },
    { q: 'How accurate are the rate recommendations?', a: 'Our rate tiers are based on aggregated data from real sponsorship deals across platforms. They provide a strong starting point for negotiations.' },
    { q: 'Can I use SponsorAgent for multiple channels?', a: 'Yes! Pro ($19/mo) supports up to 5 channels, and Premium ($39/mo) gives you unlimited channels and analyses.' },
  ];
</script>

<svelte:head>
  <title>SponsorAgent -- AI Sponsorship Manager for YouTube, Twitch & TikTok Creators</title>
  <meta name="description" content="Find brand sponsors, get rate recommendations, and manage outreach with AI. Works with YouTube, Twitch, TikTok, and 9 more platforms." />
</svelte:head>

<section class="hero">
  <div class="container">
    <div class="eyebrow">
      <span class="badge badge-accent">AI-POWERED SPONSORSHIP MANAGER</span>
    </div>

    {#if variant === 'A'}
      <h1>
        Your AI Sponsorship Manager for<br>
        <span class="gradient-text">YouTube, Twitch, TikTok & Beyond</span>
      </h1>
      <p class="subtitle">
        Paste any channel URL. Get matched with sponsors, see what you should charge, and let AI handle outreach -- all in under 5 seconds.
      </p>
    {:else}
      <h1>
        Stop Leaving Money on the Table.<br>
        <span class="gradient-text">Let AI Find Your Next Sponsor.</span>
      </h1>
      <p class="subtitle">
        Most creators undercharge by 40%. SponsorAgent analyzes your channel, matches you with brands, and tells you exactly what to charge.
      </p>
    {/if}

    <div class="hero-cta">
      <a href="/try" class="btn btn-primary btn-large">Find My Sponsors -- Free</a>
      <a href="/pricing" class="btn btn-secondary btn-large">View Pricing</a>
    </div>

    <div class="stats-strip">
      {#each stats as stat}
        <div class="stat">
          <div class="stat-value">{stat.value}</div>
          <div class="stat-label">{stat.label}</div>
        </div>
      {/each}
    </div>
  </div>
</section>

<section class="features-section">
  <div class="container">
    <h2>Everything You Need to Land Sponsors</h2>
    <p class="section-sub">From channel analysis to closed deals, SponsorAgent automates the entire sponsorship workflow.</p>
    <div class="features-grid">
      {#each features as f, i}
        <div class="feature-card card">
          <div class="feature-num">{String(i + 1).padStart(2, '0')}</div>
          <h3>{f.title}</h3>
          <p>{f.desc}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<section class="pricing-preview">
  <div class="container">
    <h2>Simple, Transparent Pricing</h2>
    <div class="pricing-grid">
      <div class="price-card card">
        <h3>Free</h3>
        <div class="price">$0</div>
        <ul>
          <li>1 channel</li>
          <li>3 analyses/month</li>
          <li>2 brand matches shown</li>
        </ul>
        <a href="/signup" class="btn btn-secondary" style="width:100%;justify-content:center">Start Free</a>
      </div>
      <div class="price-card card featured">
        <span class="popular-tag">Popular</span>
        <h3>Pro</h3>
        <div class="price">$19<span>/mo</span></div>
        <ul>
          <li>5 channels</li>
          <li>30 analyses/month</li>
          <li>Full brand matches</li>
          <li>Outreach pipeline</li>
        </ul>
        <a href="/signup" class="btn btn-primary" style="width:100%;justify-content:center">Get Pro</a>
      </div>
      <div class="price-card card">
        <h3>Premium</h3>
        <div class="price">$39<span>/mo</span></div>
        <ul>
          <li>Unlimited channels</li>
          <li>Unlimited analyses</li>
          <li>AI outreach agent</li>
          <li>Priority support</li>
        </ul>
        <a href="/signup" class="btn btn-secondary" style="width:100%;justify-content:center">Get Premium</a>
      </div>
    </div>
  </div>
</section>

<section class="waitlist-section">
  <div class="container">
    <div class="waitlist-box card">
      <h2>Join the Waitlist</h2>
      <p>Get early access and be the first to know when new features launch.</p>
      {#if waitlistMessage}
        <div class="alert-success">{waitlistMessage}</div>
      {/if}
      {#if waitlistError}
        <div class="alert-error">{waitlistError}</div>
      {/if}
      <form class="waitlist-form" on:submit|preventDefault={joinWaitlist}>
        <input type="email" bind:value={waitlistEmail} placeholder="you@example.com" required />
        <button type="submit" class="btn btn-primary" disabled={waitlistSubmitting}>
          {waitlistSubmitting ? 'Joining...' : 'Join Waitlist'}
        </button>
      </form>
      {#if waitlistCount > 0}
        <p class="waitlist-count">{waitlistCount.toLocaleString()} creators already joined</p>
      {/if}
    </div>
  </div>
</section>

<section class="faq-section">
  <div class="container">
    <h2>Frequently Asked Questions</h2>
    <div class="faq-list">
      {#each faqs as faq, i}
        <button class="faq-item" on:click={() => toggleFaq(i)} class:open={faqOpen[i]}>
          <div class="faq-q">
            <span>{faq.q}</span>
            <span class="faq-toggle">{faqOpen[i] ? '-' : '+'}</span>
          </div>
          {#if faqOpen[i]}
            <p class="faq-a">{faq.a}</p>
          {/if}
        </button>
      {/each}
    </div>
  </div>
</section>

<style>
  .hero { padding: 5rem 0 3rem; text-align: center; }
  .eyebrow { margin-bottom: 1.25rem; }
  .hero h1 {
    font-size: clamp(2rem, 5vw, 3.5rem);
    line-height: 1.1;
    margin-bottom: 1.25rem;
  }
  .gradient-text {
    background: linear-gradient(135deg, var(--accent), var(--accent-dark), var(--teal));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .subtitle {
    color: var(--text-muted);
    font-size: 1.15rem;
    max-width: 640px;
    margin: 0 auto 2rem;
  }
  .hero-cta { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
  .stats-strip {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
    max-width: 700px;
    margin: 3rem auto 0;
    text-align: center;
  }
  .stat-value { font-family: var(--font-heading); font-size: 1.75rem; font-weight: 700; color: var(--accent); }
  .stat-label { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem; }
  .features-section { padding: 4rem 0; }
  .features-section h2, .pricing-preview h2, .waitlist-section h2, .faq-section h2 {
    font-size: 2rem; text-align: center; margin-bottom: 0.5rem;
  }
  .section-sub { color: var(--text-muted); text-align: center; margin-bottom: 2.5rem; font-size: 1rem; }
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.25rem;
  }
  .feature-card { text-align: left; }
  .feature-num { font-family: var(--font-heading); font-weight: 700; color: var(--accent); font-size: 0.8rem; margin-bottom: 0.5rem; }
  .feature-card h3 { font-size: 1.05rem; margin-bottom: 0.5rem; }
  .feature-card p { color: var(--text-muted); font-size: 0.9rem; line-height: 1.6; }
  .pricing-preview { padding: 4rem 0; background: var(--bg-surface); }
  .pricing-preview h2 { margin-bottom: 2rem; }
  .pricing-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1.5rem;
    max-width: 900px;
    margin: 0 auto;
  }
  .price-card { position: relative; display: flex; flex-direction: column; }
  .price-card h3 { font-size: 1.15rem; margin-bottom: 0.5rem; }
  .price { font-size: 2.25rem; font-weight: 700; font-family: var(--font-heading); margin-bottom: 1rem; }
  .price span { font-size: 0.9rem; font-weight: 400; color: var(--text-muted); }
  .price-card ul { list-style: none; flex: 1; margin-bottom: 1.5rem; }
  .price-card li { padding: 0.35rem 0; font-size: 0.88rem; color: var(--text-muted); }
  .price-card li::before { content: '\2713  '; color: var(--accent); font-weight: 700; }
  .featured { border-color: var(--accent); box-shadow: 0 0 40px var(--accent-glow); }
  .popular-tag { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--accent); color: #0a0a0f; padding: 0.2rem 0.75rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 700; }
  .waitlist-section { padding: 4rem 0; }
  .waitlist-box { max-width: 560px; margin: 0 auto; text-align: center; }
  .waitlist-box h2 { margin-bottom: 0.5rem; }
  .waitlist-box > p { color: var(--text-muted); margin-bottom: 1.5rem; }
  .waitlist-form { display: flex; gap: 0.75rem; }
  .waitlist-form input { flex: 1; }
  .waitlist-count { margin-top: 1rem; font-size: 0.85rem; color: var(--text-dim); }
  .faq-section { padding: 4rem 0; }
  .faq-section h2 { margin-bottom: 2rem; }
  .faq-list { max-width: 700px; margin: 0 auto; }
  .faq-item {
    display: block; width: 100%; text-align: left;
    background: transparent; border: none; border-bottom: 1px solid var(--border);
    padding: 1.25rem 0; cursor: pointer; color: var(--text);
  }
  .faq-q { display: flex; justify-content: space-between; align-items: center; font-weight: 500; font-size: 1rem; }
  .faq-toggle { font-size: 1.5rem; color: var(--accent); width: 30px; text-align: center; }
  .faq-a { margin-top: 0.75rem; color: var(--text-muted); font-size: 0.9rem; line-height: 1.6; }
  @media (max-width: 768px) {
    .hero { padding: 3rem 0 2rem; }
    .stats-strip { grid-template-columns: repeat(2, 1fr); }
    .waitlist-form { flex-direction: column; }
  }
</style>
