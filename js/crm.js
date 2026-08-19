/* =========================================================
   SAAJVAN DESIGN STUDIO — CRM DASHBOARD BEHAVIOR
   ========================================================= */

(function () {
  const CORRECT_PIN = '6565';

  // Elements
  const lockScreen = document.getElementById('crmLockScreen');
  const pinInput = document.getElementById('crmPinInput');
  const unlockBtn = document.getElementById('crmUnlockBtn');
  const pinError = document.getElementById('pinError');
  const lockHeaderBtn = document.getElementById('crmLockHeaderBtn');
  const timeDisplay = document.getElementById('crmTimeDisplay');

  // Metrics
  const metricTotal = document.getElementById('metricTotal');
  const metricToday = document.getElementById('metricToday');
  const metricBooked = document.getElementById('metricBooked');
  const metricPending = document.getElementById('metricPending');

  // Controls
  const searchInput = document.getElementById('crmSearchInput');
  const serviceFilter = document.getElementById('crmServiceFilter');
  const statusFilter = document.getElementById('crmStatusFilter');
  const exportBtn = document.getElementById('crmExportBtn');
  const clearBtn = document.getElementById('crmClearBtn');

  // Table
  const tableBody = document.getElementById('crmTableBody');
  const emptyState = document.getElementById('crmEmptyState');

  // In-memory leads array
  let leads = [];

  /* ---------- 1. Authentication ---------- */
  const checkAuth = () => {
    if (sessionStorage.getItem('crm_unlocked') === 'true') {
      lockScreen.style.display = 'none';
      loadLeads();
    } else {
      lockScreen.style.display = 'flex';
      pinInput.focus();
    }
  };

  const handleUnlock = () => {
    if (pinInput.value === CORRECT_PIN) {
      sessionStorage.setItem('crm_unlocked', 'true');
      lockScreen.style.display = 'none';
      pinError.textContent = '';
      loadLeads();
    } else {
      pinError.textContent = 'Incorrect PIN passcode.';
      pinInput.value = '';
    }
  };

  if (unlockBtn) unlockBtn.addEventListener('click', handleUnlock);
  if (pinInput) {
    pinInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleUnlock();
    });
  }

  if (lockHeaderBtn) {
    lockHeaderBtn.addEventListener('click', () => {
      sessionStorage.removeItem('crm_unlocked');
      checkAuth();
    });
  }

  /* ---------- 2. Time Header ---------- */
  const updateTime = () => {
    if (!timeDisplay) return;
    const now = new Date();
    timeDisplay.textContent = now.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  updateTime();
  setInterval(updateTime, 30000);

  /* ---------- 3. Load Leads ---------- */
  const loadLeads = async () => {
    // 1. Fetch remote API leads if available
    try {
      const res = await fetch('/api/leads');
      if (res.ok) {
        const remoteLeads = await res.json();
        if (Array.isArray(remoteLeads)) {
          leads = remoteLeads.map((l, idx) => ({
            ...l,
            uid: l.id || l.uid || `lead_${idx}_${Date.now()}`
          }));
          localStorage.setItem('saajvan_leads', JSON.stringify(leads));
          renderDashboard();
          return;
        }
      }
    } catch (err) {
      // Offline / Static mode fallback
    }

    // 2. Fallback to local storage
    try {
      const localData = JSON.parse(localStorage.getItem('saajvan_leads') || '[]');
      leads = (Array.isArray(localData) ? localData : []).map((l, idx) => ({
        ...l,
        uid: l.id || l.uid || `lead_${idx}_${Date.now()}`
      }));
    } catch (e) {
      leads = [];
    }

    renderDashboard();
  };

  /* ---------- 4. Save & Sync Leads ---------- */
  const saveLeads = async () => {
    localStorage.setItem('saajvan_leads', JSON.stringify(leads));
    renderDashboard();

    // Sync updated leads list to Cloudflare KV backend
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leads)
      });
    } catch (err) {
      console.error('KV Sync Error:', err);
    }
  };

  /* ---------- 5. Render Metrics & Table ---------- */
  const renderDashboard = () => {
    // A. Metrics
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const total = leads.length;
    const todayCount = leads.filter(l => new Date(l.created_at).getTime() >= startOfToday).length;
    const bookedCount = leads.filter(l => l.status === 'Session Booked').length;
    const pendingCount = leads.filter(l => !l.status || l.status === 'New Lead').length;

    metricTotal.textContent = total;
    metricToday.textContent = todayCount;
    metricBooked.textContent = bookedCount;
    metricPending.textContent = pendingCount;

    // B. Filter Leads
    const search = (searchInput?.value || '').toLowerCase().trim();
    const service = (serviceFilter?.value || '').trim();
    const status = (statusFilter?.value || '').trim();

    const filtered = leads.filter(lead => {
      const matchSearch = !search ||
        (lead.name || '').toLowerCase().includes(search) ||
        (lead.phone || '').toLowerCase().includes(search) ||
        (lead.rawPhone || '').includes(search);

      const matchService = !service || (lead.interested_in || lead.inquiry_type) === service;
      const matchStatus = !status || (lead.status || 'New Lead') === status;

      return matchSearch && matchService && matchStatus;
    });

    // C. Render Table Rows
    tableBody.innerHTML = '';

    if (filtered.length === 0) {
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;

    filtered.forEach((lead, idx) => {
      const tr = document.createElement('tr');
      const leadKey = lead.uid || lead.id || `lead_${idx}`;

      const dateStr = lead.created_at
        ? new Date(lead.created_at).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : 'N/A';

      const rawPhone = (lead.rawPhone || lead.phone || '').replace(/\D/g, '');
      const formattedPhone = lead.phone || `+91 ${rawPhone}`;
      const interestedIn = lead.interested_in || lead.inquiry_type || 'Interior Design';
      const currentStatus = lead.status || 'New Lead';

      tr.innerHTML = `
        <td style="white-space:nowrap; font-size:13px; color:var(--ink-soft);">${dateStr}</td>
        <td class="client-name">${escapeHtml(lead.name || 'Anonymous')}</td>
        <td>
          <div class="client-phone-wrap">
            <span class="phone-num">${escapeHtml(formattedPhone)}</span>
            <a href="tel:+91${rawPhone}" class="btn-action-icon" title="Call ${escapeHtml(lead.name)}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8Z"/>
              </svg>
            </a>
            <a href="https://wa.me/91${rawPhone}?text=${encodeURIComponent('Hello ' + (lead.name || '') + '! Thank you for booking a 3D design session with Saajvan Design Studio.')}" 
               target="_blank" rel="noopener" class="btn-action-icon btn-whatsapp-icon" title="WhatsApp Chat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l5.06-1.33A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2Zm0 18a7.9 7.9 0 0 1-4.03-1.1l-.29-.17-3 .79.8-2.93-.19-.3A7.93 7.93 0 1 1 12 20Zm4.34-5.94c-.24-.12-1.4-.69-1.62-.77-.22-.08-.38-.12-.53.12-.16.24-.6.77-.74.93-.14.16-.27.18-.5.06-.24-.12-1-.37-1.9-1.17-.7-.62-1.18-1.39-1.31-1.63-.14-.24-.01-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.53-1.28-.73-1.75-.19-.46-.38-.4-.53-.4h-.45c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.13 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.4-.57 1.6-1.12.2-.55.2-1.02.14-1.12-.06-.1-.22-.16-.46-.28Z"/>
              </svg>
            </a>
          </div>
        </td>
        <td><span class="status-badge status-contacted">${escapeHtml(interestedIn)}</span></td>
        <td>
          <select class="status-select" data-key="${leadKey}">
            <option value="New Lead" ${currentStatus === 'New Lead' ? 'selected' : ''}>🔴 New Lead</option>
            <option value="Contacted" ${currentStatus === 'Contacted' ? 'selected' : ''}>🟡 Contacted</option>
            <option value="Session Booked" ${currentStatus === 'Session Booked' ? 'selected' : ''}>🟢 Session Booked</option>
            <option value="Closed" ${currentStatus === 'Closed' ? 'selected' : ''}>⚪ Closed</option>
          </select>
        </td>
        <td>
          <button type="button" class="btn-danger-outline btn-delete-lead" data-key="${leadKey}" style="height:32px; padding:0 10px; font-size:12px;">Delete</button>
        </td>
      `;

      // Status change listener
      const statusSel = tr.querySelector('.status-select');
      if (statusSel) {
        statusSel.addEventListener('change', (e) => {
          const targetKey = e.target.getAttribute('data-key');
          const targetLead = leads.find(l => (l.uid || l.id) === targetKey);
          if (targetLead) {
            targetLead.status = e.target.value;
            saveLeads();
          }
        });
      }

      // Delete listener
      const deleteBtn = tr.querySelector('.btn-delete-lead');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          const targetKey = deleteBtn.getAttribute('data-key');
          if (confirm(`Are you sure you want to delete lead "${lead.name}"?`)) {
            leads = leads.filter(l => (l.uid || l.id) !== targetKey);
            saveLeads();
          }
        });
      }

      tableBody.appendChild(tr);
    });
  };

  /* ---------- 6. Export to CSV ---------- */
  const exportCSV = () => {
    if (leads.length === 0) {
      alert('No leads available to export.');
      return;
    }

    const headers = ['Date & Time', 'Client Name', 'Phone Number', 'Interested In', 'Status'];
    const rows = leads.map(l => [
      l.created_at ? new Date(l.created_at).toLocaleString('en-IN') : '',
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${l.phone || ''}"`,
      `"${(l.interested_in || l.inquiry_type || '').replace(/"/g, '""')}"`,
      `"${l.status || 'New Lead'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saajvan_leads_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (exportBtn) exportBtn.addEventListener('click', exportCSV);

  /* ---------- 7. Clear All Leads ---------- */
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if (leads.length === 0) return;
      if (confirm('Are you sure you want to delete ALL leads from the database? This action cannot be undone.')) {
        leads = [];
        localStorage.setItem('saajvan_leads', JSON.stringify([]));
        renderDashboard();
        try {
          await fetch('/api/leads', { method: 'DELETE' });
        } catch (err) {
          console.error('Clear All Error:', err);
        }
      }
    });
  }

  /* ---------- 8. Filter Listeners ---------- */
  if (searchInput) searchInput.addEventListener('input', renderDashboard);
  if (serviceFilter) serviceFilter.addEventListener('change', renderDashboard);
  if (statusFilter) statusFilter.addEventListener('change', renderDashboard);

  // Helper
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Auto-refresh when tab gains focus or localStorage updates
  window.addEventListener('storage', (e) => {
    if (e.key === 'saajvan_leads') loadLeads();
  });
  window.addEventListener('focus', loadLeads);

  // Initialize
  checkAuth();

})();
