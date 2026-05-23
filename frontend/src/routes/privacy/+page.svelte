<svelte:head>
  <title>Privacy Policy | SponsorAgent</title>
</svelte:head>

<div class="legal-page container">
  <h1>Privacy Policy</h1>
  <p class="last-updated">Last updated: April 2026</p>

  <div class="legal-content">
    <section>
      <h2>1. Information We Collect</h2>
      <p>We collect information you provide directly: name, email address, password (hashed), channel URLs, and preferences. We also collect usage data: pages visited, features used, and IP addresses for rate limiting.</p>
    </section>

    <section>
      <h2>2. How We Use Your Information</h2>
      <p>We use your information to: provide and improve the Service; analyze channels and generate brand matches; send account-related emails; process payments; and understand usage patterns to improve the product.</p>
    </section>

    <section>
      <h2>3. Data Storage & Security</h2>
      <p>Your data is stored in encrypted PostgreSQL databases. Passwords are hashed with bcrypt (12 rounds). We use HTTPS for all data transmission. Payment data is processed by Stripe and never stored on our servers.</p>
    </section>

    <section>
      <h2>4. Email Communications</h2>
      <p>We send emails from sponsoragent@polsia.app through our email proxy service. You will receive: account verification emails, onboarding sequences, and product updates. You can unsubscribe from non-essential emails at any time.</p>
    </section>

    <section>
      <h2>5. Third-Party Services</h2>
      <p>We use the following third-party services: Stripe (payments), Polsia Email Proxy (email delivery), and PostgreSQL (data storage). Each service has its own privacy policy.</p>
    </section>

    <section>
      <h2>6. Data Retention</h2>
      <p>We retain your account data for as long as your account is active. Channel analysis data is retained for product improvement. You may request deletion of your data at any time by contacting us.</p>
    </section>

    <section>
      <h2>7. Your Rights</h2>
      <p>You have the right to: access your personal data; correct inaccurate data; request deletion of your data; export your data; and opt out of marketing communications.</p>
    </section>

    <section>
      <h2>8. Cookies</h2>
      <p>We use localStorage for authentication tokens and A/B test variant assignment. We do not use third-party tracking cookies.</p>
    </section>

    <section>
      <h2>9. Changes to This Policy</h2>
      <p>We may update this privacy policy from time to time. We will notify you of material changes via email.</p>
    </section>

    <section>
      <h2>10. Contact</h2>
      <p>For privacy-related questions or data requests, contact us at <a href="mailto:sponsoragent@polsia.app">sponsoragent@polsia.app</a>.</p>
    </section>
  </div>
</div>

<style>
  .legal-page { padding: 3rem 0; max-width: 800px; }
  h1 { font-size: 2rem; margin-bottom: 0.25rem; }
  .last-updated { color: var(--text-dim); font-size: 0.85rem; margin-bottom: 2rem; }
  .legal-content { display: flex; flex-direction: column; gap: 1.5rem; }
  section h2 { font-size: 1.1rem; margin-bottom: 0.5rem; }
  section p { color: var(--text-muted); font-size: 0.95rem; line-height: 1.7; }
</style>
