<script>
  import '../app.css';

  let loggedIn = false;

  function checkAuth() {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    loggedIn = !!token;
  }

  if (typeof window !== 'undefined') checkAuth();

  function logout() {
    localStorage.removeItem('token');
    loggedIn = false;
    window.location.href = '/';
  }
</script>

<nav class="nav">
  <div class="nav-inner container">
    <a href="/" class="logo">
      <span class="logo-icon">S</span>
      <span class="logo-text">SponsorAgent</span>
    </a>
    <div class="nav-links">
      {#if loggedIn}
        <a href="/dashboard">Dashboard</a>
        <a href="/audit">Audit</a>
        <a href="/outreach">Outreach</a>
        <a href="/settings">Settings</a>
        <button class="btn-ghost nav-btn" on:click={logout}>Log out</button>
      {:else}
        <a href="/try" class="nav-try">Try Free</a>
        <a href="/pricing">Pricing</a>
        <a href="/login" class="nav-link-muted">Login</a>
        <a href="/signup" class="btn btn-primary nav-cta">Sign Up</a>
      {/if}
    </div>
  </div>
</nav>

<main>
  <slot />
</main>

<footer class="footer">
  <div class="container footer-inner">
    <div class="footer-left">
      <span class="footer-logo">SponsorAgent</span>
      <p>AI sponsorship manager for creators</p>
      <p class="footer-email">sponsoragent@polsia.app</p>
    </div>
    <div class="footer-cols">
      <div class="footer-col">
        <h4>Product</h4>
        <a href="/try">Try Free</a>
        <a href="/audit">Channel Audit</a>
        <a href="/pricing">Pricing</a>
      </div>
      <div class="footer-col">
        <h4>Platforms</h4>
        <a href="/youtube">YouTube</a>
        <a href="/twitch">Twitch</a>
        <a href="/discord">Discord</a>
        <a href="/reddit">Reddit</a>
        <a href="/twitter">Twitter/X</a>
        <a href="/facebook">Facebook</a>
      </div>
      <div class="footer-col">
        <h4>Company</h4>
        <a href="/blog">Blog</a>
        <a href="/terms">Terms</a>
        <a href="/privacy">Privacy</a>
      </div>
    </div>
  </div>
  <div class="container footer-bottom">
    <p>&copy; {new Date().getFullYear()} SponsorAgent by Polsia. All rights reserved.</p>
  </div>
</footer>

<style>
  .nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(10,10,15,0.85); backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border-subtle);
    padding: 0.75rem 0;
  }
  .nav-inner { display: flex; align-items: center; justify-content: space-between; }
  .logo { display: flex; align-items: center; gap: 0.5rem; }
  .logo-icon {
    width: 32px; height: 32px; border-radius: 8px;
    background: linear-gradient(135deg, var(--accent), var(--accent-dark));
    color: #0a0a0f; font-family: var(--font-heading); font-weight: 700;
    font-size: 1.1rem; display: flex; align-items: center; justify-content: center;
  }
  .logo-text {
    font-family: var(--font-heading); font-size: 1.15rem; font-weight: 700;
    color: var(--text);
  }
  .nav-links { display: flex; align-items: center; gap: 1.5rem; }
  .nav-links a { color: var(--text-muted); font-size: 0.9rem; }
  .nav-links a:hover { color: var(--text); }
  .nav-try { color: var(--accent) !important; font-weight: 600; }
  .nav-link-muted { color: var(--text-dim) !important; }
  .nav-cta { padding: 0.5rem 1.25rem !important; font-size: 0.85rem !important; }
  .nav-btn { font-size: 0.9rem; padding: 0.4rem 0.8rem; }
  main { min-height: calc(100vh - 120px); }
  .footer {
    border-top: 1px solid var(--border-subtle);
    padding: 3rem 0 1.5rem; color: var(--text-dim); font-size: 0.85rem;
  }
  .footer-inner { display: flex; justify-content: space-between; gap: 3rem; }
  .footer-left { max-width: 250px; }
  .footer-logo { font-family: var(--font-heading); font-weight: 700; font-size: 1rem; color: var(--text); display: block; margin-bottom: 0.5rem; }
  .footer-email { color: var(--accent); margin-top: 0.5rem; }
  .footer-cols { display: flex; gap: 3rem; }
  .footer-col { display: flex; flex-direction: column; gap: 0.5rem; }
  .footer-col h4 { color: var(--text); font-size: 0.85rem; margin-bottom: 0.25rem; }
  .footer-col a { color: var(--text-dim); font-size: 0.8rem; }
  .footer-col a:hover { color: var(--accent); }
  .footer-bottom { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border-subtle); }
  @media (max-width: 768px) {
    .nav-links { gap: 0.75rem; }
    .footer-inner { flex-direction: column; gap: 2rem; }
    .footer-cols { flex-wrap: wrap; gap: 2rem; }
  }
</style>
