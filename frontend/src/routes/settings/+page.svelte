<script>
  import { onMount } from 'svelte';

  let loading = true;
  let saving = false;
  let error = '';
  let success = '';

  let settings = {
    content_niches: [],
    brand_exclusions: [],
    min_deal_value: 500,
    outreach_style: 'professional',
    dry_run_mode: false,
    notification_preferences: { email: true, browser: true },
  };

  let nicheInput = '';
  let exclusionInput = '';

  const NICHES = [
    'Gaming', 'Tech', 'Beauty', 'Fashion', 'Fitness', 'Food', 'Travel',
    'Education', 'Finance', 'Music', 'Comedy', 'Entertainment', 'Lifestyle',
    'Health', 'Sports', 'Business', 'Science', 'Art', 'Photography', 'DIY',
  ];

  const OUTREACH_STYLES = [
    { value: 'professional', label: 'Professional', desc: 'Formal tone, business-focused' },
    { value: 'casual', label: 'Casual', desc: 'Friendly, conversational' },
    { value: 'enthusiastic', label: 'Enthusiastic', desc: 'High energy, excited' },
    { value: 'direct', label: 'Direct', desc: 'Straight to the point' },
  ];

  onMount(async () => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login'; return; }

    try {
      const res = await fetch('/api/v1/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data.settings) {
        const s = data.data.settings;
        settings.content_niches = Array.isArray(s.content_niches) ? s.content_niches : JSON.parse(s.content_niches || '[]');
        settings.brand_exclusions = Array.isArray(s.brand_exclusions) ? s.brand_exclusions : JSON.parse(s.brand_exclusions || '[]');
        settings.min_deal_value = s.min_deal_value ?? 500;
        settings.outreach_style = s.outreach_style ?? 'professional';
        settings.dry_run_mode = s.dry_run_mode ?? false;
        const notif = typeof s.notification_preferences === 'string' ? JSON.parse(s.notification_preferences) : (s.notification_preferences ?? {});
        settings.notification_preferences = { email: notif.email ?? true, browser: notif.browser ?? true };
      }
    } catch (err) {
      error = 'Failed to load settings';
    }
    loading = false;
  });

  function addNiche(niche) {
    if (!settings.content_niches.includes(niche)) {
      settings.content_niches = [...settings.content_niches, niche];
    }
  }

  function removeNiche(niche) {
    settings.content_niches = settings.content_niches.filter(n => n !== niche);
  }

  function addExclusion() {
    if (exclusionInput.trim() && !settings.brand_exclusions.includes(exclusionInput.trim())) {
      settings.brand_exclusions = [...settings.brand_exclusions, exclusionInput.trim()];
      exclusionInput = '';
    }
  }

  function removeExclusion(brand) {
    settings.brand_exclusions = settings.brand_exclusions.filter(b => b !== brand);
  }

  async function saveSettings() {
    error = '';
    success = '';
    saving = true;
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? 'Save failed');
      success = 'Settings saved successfully';
    } catch (err) {
      error = err.message ?? 'Failed to save settings';
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head><title>Settings | SponsorAgent</title></svelte:head>

<div class="settings-page container">
  <h1>Settings</h1>
  <p class="page-sub">Configure your sponsorship preferences and AI agent behavior.</p>

  {#if loading}
    <div class="loading">Loading settings...</div>
  {:else}
    {#if error}
      <div class="alert-error">{error}</div>
    {/if}
    {#if success}
      <div class="alert-success">{success}</div>
    {/if}

    <div class="settings-grid">
      <!-- Content Niches -->
      <section class="setting-block card">
        <h2>Content Niches</h2>
        <p class="setting-desc">Select your content categories for better brand matching.</p>
        <div class="selected-tags">
          {#each settings.content_niches as niche}
            <button class="tag-chip active" on:click={() => removeNiche(niche)}>
              {niche} x
            </button>
          {/each}
        </div>
        <div class="niche-grid">
          {#each NICHES as niche}
            <button
              class="niche-btn"
              class:selected={settings.content_niches.includes(niche)}
              on:click={() => settings.content_niches.includes(niche) ? removeNiche(niche) : addNiche(niche)}
            >
              {niche}
            </button>
          {/each}
        </div>
      </section>

      <!-- Brand Exclusions -->
      <section class="setting-block card">
        <h2>Brand Exclusions</h2>
        <p class="setting-desc">Brands you don't want to be matched with.</p>
        <div class="exclusion-input">
          <input type="text" bind:value={exclusionInput} placeholder="Brand name to exclude" on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), addExclusion())} />
          <button class="btn btn-secondary" on:click={addExclusion}>Add</button>
        </div>
        <div class="selected-tags">
          {#each settings.brand_exclusions as brand}
            <button class="tag-chip exclude" on:click={() => removeExclusion(brand)}>
              {brand} x
            </button>
          {/each}
        </div>
      </section>

      <!-- Min Deal Value -->
      <section class="setting-block card">
        <h2>Minimum Deal Value</h2>
        <p class="setting-desc">Only show brand matches above this deal value.</p>
        <div class="slider-wrap">
          <input type="range" min="100" max="10000" step="100" bind:value={settings.min_deal_value} class="deal-slider" />
          <div class="slider-labels">
            <span>$100</span>
            <span class="slider-value">${settings.min_deal_value.toLocaleString()}</span>
            <span>$10,000</span>
          </div>
        </div>
      </section>

      <!-- Outreach Style -->
      <section class="setting-block card">
        <h2>Outreach Style</h2>
        <p class="setting-desc">How should your AI agent communicate with brands?</p>
        <div class="style-grid">
          {#each OUTREACH_STYLES as style}
            <button
              class="style-option"
              class:selected={settings.outreach_style === style.value}
              on:click={() => settings.outreach_style = style.value}
            >
              <strong>{style.label}</strong>
              <span>{style.desc}</span>
            </button>
          {/each}
        </div>
      </section>

      <!-- Dry Run Mode -->
      <section class="setting-block card">
        <h2>Dry Run Mode</h2>
        <p class="setting-desc">When enabled, the AI agent will draft outreach but not actually send anything.</p>
        <label class="toggle-wrap">
          <input type="checkbox" bind:checked={settings.dry_run_mode} />
          <span class="toggle-slider"></span>
          <span class="toggle-label">{settings.dry_run_mode ? 'Enabled (drafts only)' : 'Disabled (live outreach)'}</span>
        </label>
      </section>

      <!-- Notifications -->
      <section class="setting-block card">
        <h2>Notification Preferences</h2>
        <p class="setting-desc">Choose how you want to be notified about new matches and activity.</p>
        <div class="notif-options">
          <label class="toggle-wrap">
            <input type="checkbox" bind:checked={settings.notification_preferences.email} />
            <span class="toggle-slider"></span>
            <span class="toggle-label">Email notifications</span>
          </label>
          <label class="toggle-wrap">
            <input type="checkbox" bind:checked={settings.notification_preferences.browser} />
            <span class="toggle-slider"></span>
            <span class="toggle-label">Browser notifications</span>
          </label>
        </div>
      </section>
    </div>

    <div class="save-bar">
      <button class="btn btn-primary" on:click={saveSettings} disabled={saving}>
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  {/if}
</div>

<style>
  .settings-page { padding: 2rem 0 3rem; }
  h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
  .page-sub { color: var(--text-muted); margin-bottom: 2rem; }
  .loading { text-align: center; padding: 4rem; color: var(--text-muted); }
  .settings-grid { display: flex; flex-direction: column; gap: 1.5rem; }
  .setting-block h2 { font-size: 1.1rem; margin-bottom: 0.35rem; }
  .setting-desc { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem; }
  .selected-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; }
  .tag-chip {
    padding: 0.3rem 0.7rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 500;
    cursor: pointer; border: none; transition: all 0.2s;
  }
  .tag-chip.active { background: var(--accent-glow); color: var(--accent); }
  .tag-chip.exclude { background: rgba(239,68,68,0.15); color: var(--red); }
  .niche-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .niche-btn {
    padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.82rem;
    background: var(--bg-raised); color: var(--text-muted); border: 1px solid var(--border);
    cursor: pointer; transition: all 0.2s;
  }
  .niche-btn.selected { background: var(--accent-glow); color: var(--accent); border-color: var(--accent); }
  .niche-btn:hover { border-color: var(--accent); }
  .exclusion-input { display: flex; gap: 0.75rem; margin-bottom: 0.75rem; }
  .exclusion-input input { flex: 1; }
  .slider-wrap { padding: 0.5rem 0; }
  .deal-slider { width: 100%; accent-color: var(--accent); }
  .slider-labels { display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem; }
  .slider-value { font-weight: 700; color: var(--accent); font-size: 1.1rem; }
  .style-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; }
  .style-option {
    padding: 1rem; border-radius: var(--radius-sm); background: var(--bg-raised);
    border: 1px solid var(--border); cursor: pointer; text-align: left; transition: all 0.2s;
    display: flex; flex-direction: column; gap: 0.25rem; color: var(--text);
  }
  .style-option span { font-size: 0.8rem; color: var(--text-muted); }
  .style-option.selected { border-color: var(--accent); background: var(--accent-glow); }
  .toggle-wrap { display: flex; align-items: center; gap: 0.75rem; cursor: pointer; margin-bottom: 0.5rem; }
  .toggle-wrap input { display: none; }
  .toggle-slider {
    width: 42px; height: 22px; background: var(--border); border-radius: 11px;
    position: relative; transition: background 0.2s; flex-shrink: 0;
  }
  .toggle-slider::after {
    content: ''; width: 18px; height: 18px; border-radius: 50%;
    background: var(--text); position: absolute; top: 2px; left: 2px; transition: transform 0.2s;
  }
  .toggle-wrap input:checked + .toggle-slider { background: var(--accent); }
  .toggle-wrap input:checked + .toggle-slider::after { transform: translateX(20px); }
  .toggle-label { font-size: 0.9rem; color: var(--text-muted); }
  .notif-options { display: flex; flex-direction: column; gap: 0.5rem; }
  .save-bar { margin-top: 2rem; display: flex; justify-content: flex-end; }
</style>
