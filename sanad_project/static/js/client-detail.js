/**
 * panel_nouveau.js  (v2 — fixed search + OCR polling)
 *
 * Key fixes vs v1:
 *  - search hits /accounts/clients/search/?q=  (not /accounts/clients/?q=)
 *  - dropdown reads  data.results[i].nom_complet  +  .identifiant  (flat fields
 *    provided by the Django view — no more nested access = no more "__")
 *  - after submit: polls /docs/documents/<id>/ocr/ every 2s and
 *    shows auto-extracted keywords when OCR finishes
 */

const PanelNouveau = (() => {

  // ── State ───────────────────────────────────────────────────────────────
  let _clientId    = null;
  let _dossierId   = null;
  let _file        = null;
  let _searchTimer = null;
  let _allClients  = [];
  let _pollTimer   = null;

  // ── DOM helpers ──────────────────────────────────────────────────────────
  const $  = id  => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  // ── Formatters ───────────────────────────────────────────────────────────
  const fmtDate = iso => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR',
      { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const fmtBytes = n => {
    if (n < 1024)       return n + ' o';
    if (n < 1024 ** 2)  return (n / 1024).toFixed(0) + ' Ko';
    return (n / 1024 ** 2).toFixed(1) + ' Mo';
  };

  const esc = s => s
    ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    : '';

  const highlight = (str, term) => {
    if (!term || !str) return esc(str);
    const idx = String(str).toLowerCase().indexOf(term.toLowerCase());
    if (idx === -1) return esc(str);
    return esc(str.slice(0, idx))
      + `<mark>${esc(str.slice(idx, idx + term.length))}</mark>`
      + esc(str.slice(idx + term.length));
  };

  // ── Section unlock / lock ────────────────────────────────────────────────
  const unlock = id => {
    const s = $(id);
    if (!s) return;
    s.classList.remove('pn-section--locked');
    s.removeAttribute('aria-disabled');
  };
  const lock = id => {
    const s = $(id);
    if (!s) return;
    s.classList.add('pn-section--locked');
    s.setAttribute('aria-disabled', 'true');
  };

  // ── Submit state ─────────────────────────────────────────────────────────
  const refreshSubmit = () => {
    const btn = $('pn-submit-btn');
    if (btn) btn.disabled = !(_clientId && _dossierId && _file);
  };

  // ═══════════════════════════════════════════════════════════════
  //  STEP 1 — CLIENT SEARCH
  // ═══════════════════════════════════════════════════════════════

  function onSearchFocus() {
    if (_clientId) return;                       // already selected
    if ($('client-search')?.value.trim()) return; // already typing
    if (_allClients.length) { renderDropdown(_allClients, ''); return; }
    fetchClients('');
  }

  function onSearchInput(value) {
    $('client-clear-btn')?.classList.toggle('visible', !!value);
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(() => fetchClients(value.trim()), 220);
  }

  // ─── THE FIX ────────────────────────────────────────────────────────────
  // Use /accounts/clients/search/?q=<term>
  // The view returns { results: [ { nom_complet, identifiant, ... } ] }
  // ────────────────────────────────────────────────────────────────────────
  function fetchClients(term) {
    const dd = $('client-dropdown');
    if (!dd) return;

    dd.innerHTML = skeletonDropdown();
    openDropdown();

    fetch(`/accounts/clients/search/?q=${encodeURIComponent(term)}`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => {
        const list = Array.isArray(data) ? data : (data.results || []);
        if (!term) _allClients = list;
        renderDropdown(list, term);
      })
      .catch(() => {
        dd.innerHTML = `<div class="pn-dropdown-empty">Erreur de chargement</div>`;
      });
  }

  function renderDropdown(clients, term) {
    const dd = $('client-dropdown');
    if (!dd) return;

    if (!clients.length) {
      dd.innerHTML = `<div class="pn-dropdown-empty">Aucun client trouvé</div>`;
      openDropdown();
      return;
    }

    dd.innerHTML = clients.map(c => {
      // ── Map the fields your API actually returns ───────────────────────
      // API shape: { id, label, cin, type, email, tel }
      // "label" = full name for physique, raison sociale for morale
      // "type"  = "physique" | "morale"
      const name     = c.label      || c.nom_complet  || '—';
      const ident    = c.cin        || c.identifiant  || c.email || '';
      const isMorale = (c.type || c.type_client) === 'morale';

      // Build initials locally — no nested object needed
      let ini = '?';
      if (isMorale) {
        ini = name.slice(0, 2).toUpperCase();
      } else {
        const parts = name.trim().split(/\s+/);
        ini = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
      }

      return `
        <div class="pn-dropdown-item" role="option" tabindex="0"
             data-id="${c.id}"
             onclick="PanelNouveau.selectClient(${c.id})"
             onkeydown="if(event.key==='Enter')PanelNouveau.selectClient(${c.id})">
          <div class="pn-dropdown-avatar${isMorale ? ' morale' : ''}">${esc(ini)}</div>
          <div class="pn-dropdown-main">
            <div class="pn-dropdown-name">${highlight(name, term)}</div>
            <div class="pn-dropdown-id">${highlight(ident, term)}</div>
          </div>
        </div>`;
    }).join('');

    openDropdown();
  }

  const openDropdown  = () => $('client-dropdown')?.classList.add('open');
  const closeDropdown = () => $('client-dropdown')?.classList.remove('open');

  function selectClient(clientId) {
    closeDropdown();
    _clientId  = clientId;
    _dossierId = null;

    const inp = $('client-search');
    if (inp) inp.value = '';
    $('client-clear-btn')?.classList.remove('visible');

    fetchClientFiche(clientId);   // full nested detail → fiche
    fetchDossiers(clientId);      // dossier grid
  }

  // GET /accounts/clients/<id>/  → full nested object
  function fetchClientFiche(clientId) {
    const fiche = $('client-fiche');
    if (!fiche) return;
    fiche.style.display = 'grid';   // show immediately (with stale/empty data)

    fetch(`/accounts/clients/${clientId}/`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(renderClientFiche)
      .catch(() => fill('client-nom', 'Erreur de chargement'));
  }

  function renderClientFiche(data) {
    // Handle both shapes:
    //   Flat  (from search cache): { label, cin, type, email, tel }
    //   Nested (from detail API):  { type_client, personne_physique, personne_morale }
    const isMorale = (data.type || data.type_client) === 'morale';
    let name, ident, ini;

    if (data.label) {
      // ── Flat shape ─────────────────────────────────────────────────────
      name  = data.label;
      ident = data.cin || '—';
      const parts = name.trim().split(/\s+/);
      ini   = isMorale
        ? name.slice(0, 2).toUpperCase()
        : ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';

    } else if (!isMorale && data.personne_physique) {
      // ── Nested physique ────────────────────────────────────────────────
      const pp = data.personne_physique;
      name  = `${pp.prenom} ${pp.nom}`;
      ident = [pp.type_identite, pp.numero_identite].filter(Boolean).join(' · ') || '—';
      const parts = name.trim().split(/\s+/);
      ini   = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();

    } else if (data.personne_morale) {
      // ── Nested morale ──────────────────────────────────────────────────
      const pm = data.personne_morale;
      name  = pm.raison_sociale;
      ident = pm.numero_rc ? `RC ${pm.numero_rc}` : (pm.ice || '—');
      ini   = name.slice(0, 2).toUpperCase();

    } else {
      name = '—'; ident = ''; ini = '?';
    }

    const av = $('client-avatar');
    if (av) {
      av.textContent = ini;
      av.className   = 'pn-avatar' + (isMorale ? ' morale' : '');
    }

    fill('client-nom',     name);
    fill('client-cin',     ident);
    fill('client-email',   data.email);
    fill('client-tel',     data.telephone);
    fill('client-adresse',
      [data.adresse, data.ville, data.pays].filter(Boolean).join(', '));

    const badge = $('client-type-badge');
    if (badge) {
      badge.textContent = isMorale ? 'Pers. morale' : 'Pers. physique';
      badge.className   = 'pn-badge ' + (isMorale ? 'pn-badge--purple' : 'pn-badge--blue');
    }

    $('client-fiche').style.display = 'grid';
  }

  // ═══════════════════════════════════════════════════════════════
  //  STEP 2 — DOSSIERS
  // ═══════════════════════════════════════════════════════════════

  function fetchDossiers(clientId) {
    unlock('step-dossier');
    hideDossierFiche();

    const grid    = $('dossier-grid');
    const addWrap = $('dossier-add-wrap');
    if (!grid) return;

    grid.innerHTML = skeletonDossierGrid();
    if (addWrap) addWrap.style.display = 'none';

    fetch(`/docs/dossiers/clients/${clientId}/`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => renderDossierGrid(data.dossiers || []))
      .catch(() => {
        grid.innerHTML =
          `<div class="pn-dossier-empty"><span>Erreur de chargement des dossiers</span></div>`;
      });
  }

  function renderDossierGrid(dossiers) {
    const grid    = $('dossier-grid');
    const addWrap = $('dossier-add-wrap');
    if (!grid) return;
    if (addWrap) addWrap.style.display = 'flex';

    if (!dossiers.length) {
      grid.innerHTML = `
        <div class="pn-dossier-empty">
          <svg viewBox="0 0 48 48" fill="none">
            <rect x="8" y="14" width="32" height="26" rx="3" stroke="currentColor" stroke-width="1.5"/>
            <path d="M8 20h32" stroke="currentColor" stroke-width="1.5"/>
            <path d="M16 8l4 6h12l4-6" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
          <span>Aucun dossier — créez-en un</span>
        </div>`;
      return;
    }

    const sClass = s =>
      ({ ouvert: 'ouvert', 'fermé': 'ferme', en_cours: 'en_cours' }[s?.toLowerCase()] || '');

    grid.innerHTML = dossiers.map(d => `
      <div class="pn-dossier-card"
           data-id="${d.id}"
           data-reference="${esc(d.reference_dossier)}"
           data-description="${esc(d.description || '')}"
           data-statut="${esc(d.statut || '')}"
           data-date-ouverture="${esc(d.date_ouverture || '')}"
           data-date-creation="${esc(d.date_creation || '')}"
           onclick="PanelNouveau.onDossierChange(${d.id}, this)"
           tabindex="0"
           onkeydown="if(event.key==='Enter')PanelNouveau.onDossierChange(${d.id},this)">
        <div class="pn-dossier-card-ref">${esc(d.reference_dossier)}</div>
        <div class="pn-dossier-card-date">
          ${d.date_ouverture ? 'Ouvert le ' + fmtDate(d.date_ouverture) : 'Date inconnue'}
        </div>
        <span class="pn-dossier-card-statut ${sClass(d.statut)}">${esc(d.statut || '—')}</span>
      </div>`).join('');
  }

  function onDossierChange(dossierId, cardEl) {
    _dossierId = dossierId || null;
    $$('.pn-dossier-card').forEach(c => c.classList.remove('selected'));

    if (!dossierId || !cardEl) { hideDossierFiche(); refreshSubmit(); return; }

    cardEl.classList.add('selected');

    const d = cardEl.dataset;
    fill('dossier-reference',      d.reference);
    fill('dossier-description',    d.description || '—');
    fill('dossier-date-ouverture', fmtDate(d.dateOuverture));
    fill('dossier-date-creation',  fmtDate(d.dateCreation));

    const badge = $('dossier-statut-badge');
    if (badge) {
      badge.textContent = d.statut || '—';
      const cls = { ouvert: 'ouvert', 'fermé': 'ferme', en_cours: 'en_cours' };
      badge.className   = 'pn-statut-badge ' + (cls[d.statut?.toLowerCase()] || '');
    }

    showDossierFiche();
    unlock('step-document');
    refreshSubmit();
  }

  const showDossierFiche = () => { const f = $('dossier-fiche'); if (f) f.style.display = 'grid'; };
  const hideDossierFiche = () => { const f = $('dossier-fiche'); if (f) f.style.display = 'none'; };

  // ═══════════════════════════════════════════════════════════════
  //  STEP 3 — FILE / DRAG & DROP
  // ═══════════════════════════════════════════════════════════════

  function onDragOver(e)  { e.preventDefault(); $('pn-dropzone')?.classList.add('drag-over'); }
  function onDragLeave()  { $('pn-dropzone')?.classList.remove('drag-over'); }
  function onDrop(e) {
    e.preventDefault();
    $('pn-dropzone')?.classList.remove('drag-over');
    if (e.dataTransfer?.files?.length) handleFile(e.dataTransfer.files[0]);
  }
  function onFileSelect(files) { if (files?.length) handleFile(files[0]); }

  function handleFile(file) {
    const allowed = ['application/pdf','image/jpeg','image/png'];
    if (!allowed.includes(file.type)) { alert('Format non supporté. Utilisez PDF, JPG ou PNG.'); return; }
    if (file.size > 50*1024*1024)     { alert('Fichier trop grand (max 50 Mo).'); return; }
    _file = file;
    fill('pn-file-name', file.name);
    fill('pn-file-meta', fmtBytes(file.size));
    $('pn-dropzone').style.display     = 'none';
    $('pn-file-preview').style.display = 'flex';
    refreshSubmit();
  }

  function removeFile() {
    _file = null;
    $('pn-dropzone').style.display     = 'block';
    $('pn-file-preview').style.display = 'none';
    $('pn-file-input').value           = '';
    if ($('pn-auto-kw')) $('pn-auto-kw').style.display = 'none';
    stopPolling();
    refreshSubmit();
  }

  // ═══════════════════════════════════════════════════════════════
  //  SUBMIT + OCR POLLING
  // ═══════════════════════════════════════════════════════════════

  function submit() {
    if (!_clientId || !_dossierId || !_file) return;

    const fd = new FormData();
    fd.append('client_id',  _clientId);
    fd.append('dossier_id', _dossierId);
    fd.append('document',   _file);
    fd.append('keywords',   $('pn-keywords-input')?.value || '');

    const btn = $('pn-submit-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Envoi…'; }

    const csrf = getCsrf();

    fetch('/docs/documents/nouveau', {
      method:  'POST',
      headers: csrf ? { 'X-CSRFToken': csrf } : {},
      body:    fd,
    })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => {
        showOcrSpinner();
        startPolling(data.id);
      })
      .catch(err => {
        console.error(err);
        if (btn) { btn.disabled = false; btn.textContent = 'Enregistrer & Lancer OCR'; }
        alert("Erreur lors de l'envoi. Veuillez réessayer.");
      });
  }

  function showOcrSpinner() {
    const kw = $('pn-auto-kw');
    const list = $('pn-tag-list');
    if (!kw || !list) return;
    list.innerHTML = `<span class="pn-tag" style="opacity:.55">OCR en cours…</span>`;
    kw.style.display = 'flex';
  }

  function startPolling(docId) {
    stopPolling();
    _pollTimer = setInterval(() => pollOcr(docId), 2000);
  }

  function stopPolling() {
    clearInterval(_pollTimer);
    _pollTimer = null;
  }

  function pollOcr(docId) {
    fetch(`/docs/documents/${docId}/ocr/`)
      .then(r => r.json())
      .then(data => {
        if (data.statut === 'done') {
          stopPolling();
          renderAutoKeywords(data.mots_cles_auto || '');
          const btn = $('pn-submit-btn');
          if (btn) btn.textContent = '✓ Enregistré';
        } else if (data.statut === 'error') {
          stopPolling();
          const list = $('pn-tag-list');
          if (list) list.innerHTML =
            `<span class="pn-tag" style="color:var(--red)">Erreur OCR — vérifiez le fichier</span>`;
        }
        // 'pending' / 'processing' → keep polling
      })
      .catch(() => stopPolling());
  }

  function renderAutoKeywords(kwString) {
    const list = $('pn-tag-list');
    if (!list) return;
    const tags = kwString.split(',').map(s => s.trim()).filter(Boolean);
    list.innerHTML = tags.length
      ? tags.map(t => `<span class="pn-tag">${esc(t)}</span>`).join('')
      : `<span style="font-size:12px;color:var(--text-muted)">Aucun mot-clé extrait</span>`;
    const kw = $('pn-auto-kw');
    if (kw) kw.style.display = 'flex';
  }

  // ═══════════════════════════════════════════════════════════════
  //  RESET
  // ═══════════════════════════════════════════════════════════════

  function resetClient() {
    _clientId = _dossierId = _file = null;
    stopPolling();

    const inp = $('client-search');
    if (inp) inp.value = '';
    $('client-clear-btn')?.classList.remove('visible');

    const fiche = $('client-fiche');
    if (fiche) fiche.style.display = 'none';

    closeDropdown();

    const grid = $('dossier-grid');
    if (grid) grid.innerHTML = `
      <div class="pn-dossier-empty">
        <svg viewBox="0 0 48 48" fill="none">
          <rect x="8" y="14" width="32" height="26" rx="3" stroke="currentColor" stroke-width="1.5"/>
          <path d="M8 20h32" stroke="currentColor" stroke-width="1.5"/>
          <path d="M16 8l4 6h12l4-6" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>
        <span>Sélectionnez un client pour voir ses dossiers</span>
      </div>`;

    hideDossierFiche();
    if ($('dossier-add-wrap')) $('dossier-add-wrap').style.display = 'none';

    removeFile();
    lock('step-dossier');
    lock('step-document');
    refreshSubmit();
  }

  // ── Utilities ────────────────────────────────────────────────
  function fill(id, value) {
    const el = $(id);
    if (el) el.textContent = value || '—';
  }

  function getCsrf() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) return meta.content;
    const c = document.cookie.split(';').find(x => x.trim().startsWith('csrftoken='));
    return c ? c.split('=')[1] : null;
  }

  function skeletonDropdown() {
    return Array(4).fill(`
      <div class="pn-dropdown-skeleton">
        <div class="skeleton" style="width:30px;height:30px;border-radius:50%"></div>
        <div style="flex:1;display:flex;flex-direction:column;gap:5px">
          <div class="skeleton" style="width:140px;height:11px"></div>
          <div class="skeleton" style="width:90px;height:10px"></div>
        </div>
      </div>`).join('');
  }

  function skeletonDossierGrid() {
    return Array(3).fill(`
      <div class="pn-dossier-card" style="pointer-events:none">
        <div class="skeleton" style="width:120px;height:12px;margin-bottom:8px"></div>
        <div class="skeleton" style="width:80px;height:10px;margin-bottom:8px"></div>
        <div class="skeleton" style="width:55px;height:10px"></div>
      </div>`).join('');
  }

  // ── Close dropdown on outside click ──────────────────────────
  document.addEventListener('click', e => {
    const s = $('client-search'), d = $('client-dropdown');
    if (!s || !d) return;
    if (!s.contains(e.target) && !d.contains(e.target)) closeDropdown();
  });

  // ── Public API ────────────────────────────────────────────────
  return {
    onSearchFocus,
    onSearchInput,
    selectClient,
    onDossierChange,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileSelect,
    removeFile,
    resetClient,
    submit,
  };

})();