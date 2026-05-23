<script>
  let email = '';
  let password = '';
  let error = '';
  let loading = false;

  async function handleSubmit() {
    error = '';
    loading = true;
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? 'Invalid email or password');
      localStorage.setItem('token', data.data.token);
      window.location.href = '/dashboard';
    } catch (err) {
      error = err.message ?? 'Login failed';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head><title>Log In | SponsorAgent</title></svelte:head>

<div class="auth-page">
  <div class="auth-card card">
    <div class="auth-logo">
      <span class="logo-icon">S</span>
    </div>
    <h1>Welcome back</h1>
    <p class="auth-sub">Log in to your SponsorAgent account</p>

    {#if error}
      <div class="alert-error">{error}</div>
    {/if}

    <form on:submit|preventDefault={handleSubmit}>
      <label>
        Email
        <input type="email" bind:value={email} placeholder="you@example.com" required autocomplete="email" />
      </label>

      <label>
        Password
        <input type="password" bind:value={password} placeholder="Your password" required autocomplete="current-password" />
      </label>

      <button type="submit" class="btn btn-primary full-width" disabled={loading}>
        {loading ? 'Logging in...' : 'Log In'}
      </button>
    </form>

    <p class="auth-footer">Don't have an account? <a href="/signup">Sign up</a></p>
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
  .full-width { width: 100%; justify-content: center; margin-top: 0.5rem; }
  .auth-footer { text-align: center; margin-top: 1.5rem; font-size: 0.9rem; color: var(--text-muted); }
</style>
