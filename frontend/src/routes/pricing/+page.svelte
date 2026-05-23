<script>
  let faqOpen = [false, false, false, false, false];

  function toggleFaq(i) {
    faqOpen = faqOpen.map((v, idx) => idx === i ? !v : v);
  }

  const faqs = [
    { q: 'What is included in the free plan?', a: 'The free plan includes 1 channel, 3 analyses per month, and 2 brand matches per audit. No credit card required.' },
    { q: 'Can I upgrade or downgrade anytime?', a: 'Yes. You can change your plan at any time. Upgrades take effect immediately, and downgrades apply at the end of your billing period.' },
    { q: 'What payment methods do you accept?', a: 'We accept all major credit and debit cards through Stripe. Your payment information is securely processed and never stored on our servers.' },
    { q: 'Is there a refund policy?', a: 'Yes. If you are not satisfied, contact us within 14 days of purchase for a full refund.' },
    { q: 'What platforms are supported?', a: 'YouTube, Twitch, TikTok, Kick, Instagram, Discord, Reddit, Facebook, Twitter/X, websites, and Linktree.' },
  ];

  async function checkout(plan) {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      window.location.href = '/signup';
      return;
    }

    try {
      const res = await fetch('/api/v1/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      }
    } catch (err) {
      console.error('Checkout failed', err);
    }
  }
</script>

<svelte:head>
  <title>Pricing | SponsorAgent</title>
  <meta name="description" content="Simple pricing for creators. Free plan with 1 channel and 3 analyses. Pro at $19/mo. Premium at $39/mo with unlimited everything." />
</svelte:head>

<div class="pricing-page container">
  <h1>Simple, Transparent Pricing</h1>
  <p class="subtitle">Start free. Upgrade when you need more channels and analyses.</p>

  <div class="tier-grid">
    <!-- Free -->
    <div class="tier-card card">
      <h3>Free</h3>
      <div class="price">$0<span>/forever</span></div>
      <p class="tier-desc">Perfect for getting started</p>
      <ul>
        <li>1 channel</li>
        <li>3 analyses per month</li>
        <li>2 brand matches per audit</li>
        <li>Sponsor score</li>
        <li>Rate tier recommendations</li>
        <li>Content theme analysis</li>
      </ul>
      <a href="/signup" class="btn btn-secondary full-width">Start Free</a>
    </div>

    <!-- Pro -->
    <div class="tier-card card featured">
      <div class="popular-badge">Most Popular</div>
      <h3>Pro</h3>
      <div class="price">$19<span>/month</span></div>
      <p class="tier-desc">For serious creators</p>
      <ul>
        <li>5 channels</li>
        <li>30 analyses per month</li>
        <li>Full brand matches (all results)</li>
        <li>Sponsor score + detailed breakdown</li>
        <li>Rate tier recommendations</li>
        <li>Outreach pipeline</li>
        <li>AI-drafted outreach emails</li>
        <li>Content theme analysis</li>
        <li>Email support</li>
      </ul>
      <button class="btn btn-primary full-width" on:click={() => checkout('pro')}>Get Pro</button>
    </div>

    <!-- Premium -->
    <div class="tier-card card">
      <h3>Premium</h3>
      <div class="price">$39<span>/month</span></div>
      <p class="tier-desc">Unlimited everything</p>
      <ul>
        <li>Unlimited channels</li>
        <li>Unlimited analyses</li>
        <li>Full brand matches (all results)</li>
        <li>Sponsor score + detailed breakdown</li>
        <li>Rate tier recommendations</li>
        <li>Outreach pipeline</li>
        <li>AI agent (auto outreach)</li>
        <li>Dry run mode</li>
        <li>Priority support</li>
        <li>Early access to new features</li>
      </ul>
      <button class="btn btn-secondary full-width" on:click={() => checkout('premium')}>Get Premium</button>
    </div>
  </div>

  <div class="faq-section">
    <h2>FAQ</h2>
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
</div>

<style>
  .pricing-page { padding: 4rem 0; text-align: center; }
  h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
  .subtitle { color: var(--text-muted); margin-bottom: 3rem; font-size: 1.1rem; }
  .tier-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; max-width: 960px; margin: 0 auto; text-align: left; }
  .tier-card { display: flex; flex-direction: column; position: relative; }
  .tier-card h3 { font-size: 1.25rem; margin-bottom: 0.5rem; }
  .tier-desc { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem; }
  .price { font-size: 2.5rem; font-weight: 700; font-family: var(--font-heading); margin-bottom: 0.5rem; }
  .price span { font-size: 0.9rem; font-weight: 400; color: var(--text-muted); }
  .tier-card ul { list-style: none; flex: 1; margin-bottom: 1.5rem; }
  .tier-card li { padding: 0.4rem 0; font-size: 0.88rem; color: var(--text-muted); }
  .tier-card li::before { content: '\2713  '; color: var(--accent); font-weight: 700; }
  .featured { border-color: var(--accent); box-shadow: 0 0 40px var(--accent-glow); }
  .popular-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--accent); color: #0a0a0f; padding: 0.2rem 0.75rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 700; }
  .full-width { width: 100%; justify-content: center; }
  .faq-section { text-align: left; max-width: 700px; margin: 3rem auto 0; }
  .faq-section h2 { text-align: center; margin-bottom: 2rem; font-size: 1.5rem; }
  .faq-list { display: flex; flex-direction: column; }
  .faq-item {
    display: block; width: 100%; text-align: left;
    background: transparent; border: none; border-bottom: 1px solid var(--border);
    padding: 1.25rem 0; cursor: pointer; color: var(--text);
  }
  .faq-q { display: flex; justify-content: space-between; align-items: center; font-weight: 500; font-size: 1rem; }
  .faq-toggle { font-size: 1.5rem; color: var(--accent); width: 30px; text-align: center; }
  .faq-a { margin-top: 0.75rem; color: var(--text-muted); font-size: 0.9rem; line-height: 1.6; }
</style>
