<script>
  import { onMount } from 'svelte';

  let loading = true;
  let pipeline = [];
  let error = '';
  let success = '';

  // Kanban columns
  const columns = [
    { key: 'draft', label: 'Draft', color: 'var(--text-dim)' },
    { key: 'sent', label: 'Sent', color: 'var(--accent)' },
    { key: 'replied', label: 'Replied', color: 'var(--teal)' },
    { key: 'negotiating', label: 'Negotiating', color: 'var(--yellow)' },
    { key: 'closed', label: 'Closed', color: 'var(--green)' },
    { key: 'rejected', label: 'Rejected', color: 'var(--red)' },
  ];

  // New outreach form
  let showNewForm = false;
  let newBrand = '';
  let newDealValue = '';
  let newNotes = '';
  let savingNew = false;

  // Expanded card detail
  let expandedId = null;
  let editNotes = '';
  let editDealValue = '';
  let editStatus = '';
  let savingEdit = false;

  onMount(async () => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login'; return; }

    await loadPipeline();
    loading = false;
  });

  async function loadPipeline() {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/v1/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        pipeline = data.data.pipeline ?? [];
      }
    } catch (err) {
      error = 'Failed to load outreach data';
    }
  }

  function getColumnItems(status) {
    return pipeline.filter(item => item.status === status);
  }

  function toggleExpand(id) {
    if (expandedId === id) {
      expandedId = null;
    } else {
      expandedId = id;
      const item = pipeline.find(p => p.id === id);
      if (item) {
        editNotes = item.notes ?? '';
        editDealValue = item.deal_value ? String(item.deal_value) : '';
        editStatus = item.status;
      }
    }
  }

  async function createOutreach() {
    if (!newBrand.trim()) return;
    savingNew = true;
    error = '';
    success = '';

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/v1/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'create_outreach',
          brand_name: newBrand.trim(),
          deal_value: newDealValue ? parseFloat(newDealValue) : null,
          notes: newNotes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? 'Failed to create outreach');

      success = `Outreach draft created for ${newBrand}`;
      newBrand = '';
      newDealValue = '';
      newNotes = '';
      showNewForm = false;
      await loadPipeline();
    } catch (err) {
      error = err.message;
    } finally {
      savingNew = false;
    }
  }

  async function updateOutreach(id) {
    savingEdit = true;
    error = '';
    success = '';

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/v1/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'update_outreach',
          outreach_id: id,
          status: editStatus,
          deal_value: editDealValue ? parseFloat(editDealValue) : null,
          notes: editNotes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? 'Failed to update');

      success = 'Outreach updated';
      expandedId = null;
      await loadPipeline();
    } catch (err) {
      error = err.message;
    } finally {
      savingEdit = false;
    }
  }

  async function deleteOutreach(id) {
    if (!confirm('Delete this outreach entry?')) return;
    error = '';
    success = '';

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/v1/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'delete_outreach',
          outreach_id: id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? 'Failed to delete');

      success = 'Outreach entry deleted';
      expandedId = null;
      await loadPipeline();
    } catch (err) {
      error = err.message;
    }
  }

  function timeAgo(date) {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  }

  function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  $: totalValue = pipeline
    .filter(p => p.status === 'closed')
    .reduce((sum, p) => sum + (parseFloat(p.deal_value) || 0), 0);

  $: activeCount = pipeline.filter(p => ['sent', 'replied', 'negotiating'].includes(p.status)).length;
</script>

<svelte:head><title>Outreach Pipeline | SponsorAgent</title></svelte:head>

<div class="outreach-page container">
  <header class="outreach-header">
    <div>
      <h1>Outreach Pipeline</h1>
      <p class="page-sub">Track your brand sponsorship outreach from draft to close.</p>
    </div>
    <button class="btn btn-primary" on:click={() => showNewForm = !showNewForm}>
      {showNewForm ? 'Cancel' : '+ New Outreach'}
    </button>
  </header>

  {#if error}
    <div class="alert-error">{error}</div>
  {/if}
  {#if success}
    <div class="alert-success">{success}</div>
  {/if}

  <!-- Stats Row -->
  <div class="stats-row">
    <div class="stat-mini card">
      <span class="stat-label">Total Outreach</span>
      <span class="stat-val">{pipeline.length}</span>
    </div>
    <div class="stat-mini card">
      <span class="stat-label">Active</span>
      <span class="stat-val" style="color: var(--accent)">{activeCount}</span>
    </div>
    <div class="stat-mini card">
      <span class="stat-label">Closed Deals</span>
      <span class="stat-val" style="color: var(--green)">{pipeline.filter(p => p.status === 'closed').length}</span>
    </div>
    <div class="stat-mini card">
      <span class="stat-label">Total Revenue</span>
      <span class="stat-val" style="color: var(--green)">${totalValue.toLocaleString()}</span>
    </div>
  </div>

  <!-- New Outreach Form -->
  {#if showNewForm}
    <div class="new-form card">
      <h3>Create New Outreach</h3>
      <form on:submit|preventDefault={createOutreach}>
        <div class="form-grid">
          <div class="form-field">
            <label for="brand-name">Brand Name</label>
            <input id="brand-name" type="text" bind:value={newBrand} placeholder="e.g. NordVPN" required />
          </div>
          <div class="form-field">
            <label for="deal-value">Deal Value (optional)</label>
            <input id="deal-value" type="number" bind:value={newDealValue} placeholder="e.g. 2500" min="0" step="100" />
          </div>
        </div>
        <div class="form-field">
          <label for="notes">Notes (optional)</label>
          <textarea id="notes" bind:value={newNotes} placeholder="Initial pitch notes, contact info, etc." rows="3"></textarea>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" disabled={savingNew || !newBrand.trim()}>
            {savingNew ? 'Creating...' : 'Create Draft'}
          </button>
        </div>
      </form>
    </div>
  {/if}

  {#if loading}
    <div class="loading">
      <div class="loading-dots"><span></span><span></span><span></span></div>
      <p>Loading pipeline...</p>
    </div>
  {:else}
    <!-- Kanban Board -->
    <div class="kanban">
      {#each columns as col}
        {@const items = getColumnItems(col.key)}
        <div class="kanban-col">
          <div class="col-header">
            <span class="col-dot" style="background: {col.color}"></span>
            <span class="col-label">{col.label}</span>
            <span class="col-count">{items.length}</span>
          </div>

          <div class="col-cards">
            {#if items.length === 0}
              <div class="col-empty">No {col.label.toLowerCase()} items</div>
            {:else}
              {#each items as item}
                <div class="kanban-card card" class:expanded={expandedId === item.id} on:click={() => toggleExpand(item.id)} on:keydown={(e) => e.key === 'Enter' && toggleExpand(item.id)} tabindex="0" role="button">
                  <div class="card-top">
                    <strong class="card-brand">{item.brand_name}</strong>
                    {#if item.deal_value}
                      <span class="card-deal">${Number(item.deal_value).toLocaleString()}</span>
                    {/if}
                  </div>
                  <div class="card-meta">
                    <span class="card-date">{timeAgo(item.updated_at)}</span>
                  </div>

                  {#if expandedId === item.id}
                    <div class="card-details" on:click|stopPropagation on:keydown|stopPropagation>
                      <div class="detail-row">
                        <span class="detail-label">Created</span>
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                      <div class="detail-row">
                        <span class="detail-label">Last Updated</span>
                        <span>{formatDate(item.updated_at)}</span>
                      </div>

                      <div class="detail-field">
                        <label for="edit-status-{item.id}">Status</label>
                        <select id="edit-status-{item.id}" bind:value={editStatus}>
                          {#each columns as c}
                            <option value={c.key}>{c.label}</option>
                          {/each}
                        </select>
                      </div>

                      <div class="detail-field">
                        <label for="edit-deal-{item.id}">Deal Value ($)</label>
                        <input id="edit-deal-{item.id}" type="number" bind:value={editDealValue} placeholder="0" min="0" step="100" />
                      </div>

                      <div class="detail-field">
                        <label for="edit-notes-{item.id}">Notes</label>
                        <textarea id="edit-notes-{item.id}" bind:value={editNotes} rows="4" placeholder="Add notes about this deal..."></textarea>
                      </div>

                      <div class="detail-actions">
                        <button class="btn btn-primary" on:click={() => updateOutreach(item.id)} disabled={savingEdit} style="font-size:0.85rem;padding:0.5rem 1rem">
                          {savingEdit ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button class="btn btn-ghost" style="color:var(--red);font-size:0.85rem" on:click={() => deleteOutreach(item.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  {/if}
                </div>
              {/each}
            {/if}
          </div>
        </div>
      {/each}
    </div>

    {#if pipeline.length === 0 && !showNewForm}
      <div class="empty-state card">
        <h3>No outreach yet</h3>
        <p>Create your first outreach draft or run a channel audit to get brand match suggestions.</p>
        <div class="empty-actions">
          <button class="btn btn-primary" on:click={() => showNewForm = true}>+ New Outreach</button>
          <a href="/audit" class="btn btn-secondary">Run Channel Audit</a>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .outreach-page { padding: 2rem 0 3rem; }

  .outreach-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
  .outreach-header h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
  .page-sub { color: var(--text-muted); }

  /* Stats */
  .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
  .stat-mini { text-align: center; padding: 1rem; }
  .stat-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 0.35rem; }
  .stat-val { font-size: 1.5rem; font-weight: 700; font-family: var(--font-heading); }

  /* New Form */
  .new-form { margin-bottom: 1.5rem; }
  .new-form h3 { font-size: 1.1rem; margin-bottom: 1rem; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
  .form-field { display: flex; flex-direction: column; gap: 0.35rem; }
  .form-field label { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }
  .form-actions { display: flex; justify-content: flex-end; margin-top: 1rem; }

  /* Loading */
  .loading { text-align: center; padding: 4rem; color: var(--text-muted); }
  .loading-dots { display: flex; gap: 0.35rem; justify-content: center; margin-bottom: 1rem; }
  .loading-dots span { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); animation: pulse 1.2s ease-in-out infinite; }
  .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
  .loading-dots span:nth-child(3) { animation-delay: 0.4s; }

  /* Kanban */
  .kanban { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.75rem; overflow-x: auto; min-width: 0; }
  .kanban-col { min-width: 160px; }
  .col-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; padding: 0.5rem 0; }
  .col-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .col-label { font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; color: var(--text-muted); }
  .col-count { font-size: 0.75rem; color: var(--text-dim); background: var(--bg-raised); padding: 0.1rem 0.45rem; border-radius: 9999px; }

  .col-cards { display: flex; flex-direction: column; gap: 0.5rem; }
  .col-empty { font-size: 0.8rem; color: var(--text-dim); padding: 1rem; text-align: center; border: 1px dashed var(--border); border-radius: var(--radius-sm); }

  .kanban-card { padding: 1rem; cursor: pointer; transition: all 0.2s; }
  .kanban-card:hover { border-color: var(--accent); }
  .kanban-card.expanded { border-color: var(--accent); box-shadow: 0 0 20px var(--accent-glow); }
  .card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; }
  .card-brand { font-size: 0.9rem; word-break: break-word; }
  .card-deal { color: var(--accent); font-weight: 600; font-size: 0.85rem; white-space: nowrap; }
  .card-meta { margin-top: 0.5rem; }
  .card-date { font-size: 0.7rem; color: var(--text-dim); }

  /* Card Details (expanded) */
  .card-details { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); }
  .detail-row { display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.5rem; }
  .detail-label { color: var(--text-dim); }
  .detail-field { margin-bottom: 0.75rem; display: flex; flex-direction: column; gap: 0.3rem; }
  .detail-field label { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }
  .detail-field input, .detail-field select, .detail-field textarea { font-size: 0.85rem; padding: 0.5rem 0.75rem; }
  .detail-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem; }

  /* Empty State */
  .empty-state { text-align: center; padding: 3rem; margin-top: 2rem; }
  .empty-state h3 { font-size: 1.2rem; margin-bottom: 0.5rem; }
  .empty-state p { color: var(--text-muted); margin-bottom: 1.5rem; }
  .empty-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

  @media (max-width: 1024px) {
    .kanban { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 768px) {
    .stats-row { grid-template-columns: repeat(2, 1fr); }
    .kanban { grid-template-columns: 1fr 1fr; }
    .form-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 480px) {
    .kanban { grid-template-columns: 1fr; }
  }
</style>
