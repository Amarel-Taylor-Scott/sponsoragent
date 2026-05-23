<script>
  let name = '';
  let email = '';
  let password = '';
  let terms = false;
  let error = '';
  let loading = false;

  let passwordErrors = [];
  $: {
    const errs = [];
    if (password.length > 0 && password.length < 10) errs.push('At least 10 characters');
    passwordErrors = errs;
  }

  async function handleSubmit() {
    error = '';
    if (!terms) { error = 'You must accept the terms of service'; return; }
    if (password.length < 10) { error = 'Password must be at least 10 characters'; return; }
    loading = true;
    try {
      const res = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, terms, source: getSource() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? 'Signup failed');
      localStorage.setItem('token', data.data.token);
      window.location.href = '/dashboard';
    } catch (err) {
      error = err.message ?? 'Signup failed';
    } finally {
      loading = false;
    }
  }

  function getSource() {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('source') ?? params.get('ref') ?? document.referrer?.split('/')[2] ?? '';
  }
</script>

<svelte:head><title>Sign Up | SponsorAgent</title></svelte:head>

<div class="auth-page">
  <div class="auth-card card">
    <div class="auth-logo">
      <span class="logo-icon">S</span>
    </div>
    <h1>Create your account</h1>
    <p class="auth-sub">Start finding sponsors for your channels</p>

    {#if error}
      <div class="alert-error">{error}</div>
    {/if}

    <form on:submit|preventDefault={handleSubmit}>
      <label>
        Your name
        <input type="text" bind:value={name} placeholder="Jane Smith" required />
      </label>

      <label>
        Email
        <input type="email" bind:value={email} placeholder="you@example.com" required autocomplete="email" />
      </label>

      <label>
        Password
        <input type="password" bind:value={password} placeholder="Min 10 characters" required minlength="10" autocomplete="new-password" />
        {#if passwordErrors.length > 0}
          <span class="field-hint field-error">{passwordErrors[0]}</span>
        {:else if password.length >= 10}
          <span class="field-hint field-ok">Looks good</span>
        {/if}
      </label>

      <label class="checkbox-label">
        <input type="checkbox" bind:checked={terms} />
        <span>I agree to the <a href="/terms" target="_blank">Terms of Service</a> and <a href="/privacy" target="_blank">Privacy Policy</a></span>
      </label>

      <button type="submit" class="btn btn-primary full-width" disabled={loading}>
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>

    <p class="auth-footer">Already have an account? <a href="/login">Log in</a></p>
  </div>
</div>

<style>
  .auth-page { display: flex; justify-content: center; align-items: center; min-height: 80vh; padding: 2rem; }
  .auth-card { max-width: 420px; width: 100%; }
  .auth-logo { text-align: center; margin-bottom: 1.5rem; }
  .logo-icon {
    display: inline-flex; width: 48px; height: 48px; border-radius: 12px;
    background: linear-gradient(135deg, var(--accent), var(--accent-dark));
    color: #0a0a0f; font-family: var(--font-heading); font-weight: 700;
    font-size: 1.5rem; align-items: center; justify-content: center;
  }
  .auth-card h1 { font-size: 1.5rem; margin-bottom: 0.25rem; text-align: center; }
  .auth-sub { color: var(--text-muted); margin-bottom: 1.5rem; text-align: center; }
  form { display: flex; flex-direction: column; gap: 1rem; }
  label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.9rem; color: var(--text-muted); }
  .checkbox-label { flex-direction: row; align-items: flex-start; gap: 0.5rem; }
  .checkbox-label input { margin-top: 3px; }
  .checkbox-label span { font-size: 0.85rem; }
  .field-hint { font-size: 0.78rem; }
  .field-error { color: var(--red); }
  .field-ok { color: var(--green); }
  .full-width { width: 100%; justify-content: center; margin-top: 0.5rem; }
  .auth-footer { text-align: center; margin-top: 1.5rem; font-size: 0.9rem; color: var(--text-muted); }
</style>
