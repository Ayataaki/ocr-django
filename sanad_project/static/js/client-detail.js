/**
 * panel_nouveau.js
 * Single module — replaces ClientDetail + old PanelNouveau fragments.
 *
 * API endpoints (Django):
 *   GET /accounts/clients/?q=<term>   → { results: [Client] }
 *   GET /accounts/clients/<id>/       → Client (detail)
 *   GET /docs/dossiers/clients/<id>/  → { count, dossiers: [Dossier] }
 *   POST /docs/dossiers/              → create dossier
 *
 * Client shape:
 *   { id, type_client, email, telephone, adresse, ville, pays,
 *     personne_physique?: { nom, prenom, numero_identite, type_identite },
 *     personne_morale?:   { raison_sociale, numero_rc, ice } }
 *
 * Dossier shape:
 *   { id, reference_dossier, statut, date_ouverture, date_creation, description }
 */



const PanelNouveau = (() => {

  // ── Internal state ─────────────────────────────────────────
  let _clientId   = null;
  let _dossierId  = null;
  let _file       = null;
  let _searchTimer = null;
  let _allClients  = [];   // cache for the initial "show all" list

  // ── DOM helpers ────────────────────────────────────────────
  const $  = id  => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  // ── Formatting ─────────────────────────────────────────────
  const fmtDate = iso => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const fmtBytes = n => {
    if (n < 1024)       return n + ' o';
    if (n < 1024 ** 2)  return (n / 1024).toFixed(0) + ' Ko';
    return (n / 1024 ** 2).toFixed(1) + ' Mo';
  };

  const initials = data => {
    if (data.type_client === 'physique' && data.personne_physique) {
      const { prenom = '', nom = '' } = data.personne_physique;
      return (prenom[0] || '') + (nom[0] || '');
    }
    if (data.type_client === 'morale' && data.personne_morale) {
      return data.personne_morale.raison_sociale.slice(0, 2).toUpperCase();
    }
    return '?';
  };

  const clientLabel = data => {
    if (data.type_client === 'physique' && data.personne_physique) {
      const pp = data.personne_physique;
      return {
        name: `${pp.prenom} ${pp.nom}`,
        id:   `${pp.type_identite} · ${pp.numero_identite}`,
      };
    }
    if (data.type_client === 'morale' && data.personne_morale) {
      const pm = data.personne_morale;
      return {
        name: pm.raison_sociale,
        id:   `RC ${pm.numero_rc || '—'}`,
      };
    }
    return { name: '—', id: '' };
  };

  // highlight matched substring in a string
  const highlight = (str, term) => {
    if (!term || !str) return esc(str);
    const idx = str.toLowerCase().indexOf(term.toLowerCase());
    if (idx === -1) return esc(str);
    return esc(str.slice(0, idx))
      + `<mark>${esc(str.slice(idx, idx + term.length))}</mark>`
      + esc(str.slice(idx + term.length));
  };

  const esc = s => s ? String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '';

  // ── Step unlock / lock ─────────────────────────────────────
  function unlockSection(id) {
    const sec = $(id);
    if (!sec) return;
    sec.classList.remove('pn-section--locked');
    sec.removeAttribute('aria-disabled');
  }

  function lockSection(id) {
    const sec = $(id);
    if (!sec) return;
    sec.classList.add('pn-section--locked');
    sec.setAttribute('aria-disabled', 'true');
  }

  // ── Submit button state ────────────────────────────────────
  function refreshSubmit() {
    const btn = $('pn-submit-btn');
    if (!btn) return;
    btn.disabled = !(_clientId && _dossierId && _file);
  }

  // ═══════════════════════════════════════════════════════════
  //  STEP 1 — CLIENT SEARCH
  // ═══════════════════════════════════════════════════════════

  /** Called when the user focuses the search box (show all clients) */
  function onSearchFocus() {
    // If a client is already selected, do nothing
    if (_clientId) return;

    const term = $('client-search')?.value || '';
    if (term.trim()) return; // already typed something — dropdown already open

    // Show all clients from cache or fetch once
    if (_allClients.length) {
      renderDropdown(_allClients, '');
    } else {
      fetchClients('');
    }
  }

  /** Called on every keystroke in the search box */
  function onSearchInput(value) {
    // Show / hide the × button
    const clearBtn = $('client-clear-btn');
    if (clearBtn) clearBtn.classList.toggle('visible', !!value);

    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(() => fetchClients(value.trim()), 220);
  }

  /** GET /accounts/clients/?q=<term> */
  function fetchClients(term) {
    const dropdown = $('client-dropdown');
    if (!dropdown) return;

    // skeleton while loading
    dropdown.innerHTML = skeletonDropdown();
    openDropdown();

    const url = term
      ? `/accounts/clients/search/?q=${encodeURIComponent(term)}`
      : `/accounts/clients/search/`;

    fetch(url)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => {
        const list = data.results || data;
        if (!term) _allClients = list;  // cache for focus re-use
        renderDropdown(list, term);
      })
      .catch(() => {
        dropdown.innerHTML =
          `<div class="pn-dropdown-empty">Erreur de chargement</div>`;
      });
  }

  function renderDropdown(clients, term) {
    const dropdown = $('client-dropdown');
    if (!dropdown) return;

    if (!clients.length) {
      dropdown.innerHTML =
        `<div class="pn-dropdown-empty">Aucun client trouvé</div>`;
      openDropdown();
      return;
    }

    dropdown.innerHTML = clients.map(c => {
      const lbl   = clientLabel(c);
      const isMorale = c.type_client === 'morale';
      const ini   = initials(c);
      const nameH = highlight(lbl.name, term);
      const idH   = highlight(lbl.id, term);

      return `
        <div class="pn-dropdown-item" role="option" tabindex="0"
             data-id="${c.id}"
             onclick="PanelNouveau.selectClient(${c.id})"
             onkeydown="if(event.key==='Enter')PanelNouveau.selectClient(${c.id})">
          <div class="pn-dropdown-avatar ${isMorale ? 'morale' : ''}">${esc(ini)}</div>
          <div class="pn-dropdown-main">
            <div class="pn-dropdown-name">${nameH}</div>
            <div class="pn-dropdown-id">${idH}</div>
          </div>
        </div>`;
    }).join('');

    openDropdown();
  }

  function openDropdown()  { $('client-dropdown')?.classList.add('open'); }
  function closeDropdown() { $('client-dropdown')?.classList.remove('open'); }

  /** User clicked a client in the dropdown */
  function selectClient(clientId) {
    closeDropdown();
    _clientId  = clientId;
    _dossierId = null;

    // Clear search box & hide × btn
    const inp = $('client-search');
    if (inp) inp.value = '';
    $('client-clear-btn')?.classList.remove('visible');

    // Fetch full detail + dossiers in parallel
    fetchClientFiche(clientId);
    fetchDossiers(clientId);
  }

  /** GET /accounts/clients/<id>/ */
  function fetchClientFiche(clientId) {
    // Show skeleton immediately
    const fiche = $('client-fiche');
    if (!fiche) return;
    fiche.style.display = 'grid';

    fetch(`/accounts/clients/${clientId}/`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => renderClientFiche(data))
      .catch(() => {
        // graceful degradation — keep fiche visible but show error
        $('client-nom').textContent = 'Erreur de chargement';
      });
  }

  function renderClientFiche(data) {
    const fiche = $('client-fiche');
    if (!fiche) return;

    const lbl     = clientLabel(data);
    const isMorale = data.type_client === 'morale';
    const ini     = initials(data);
    const adresse = [data.adresse, data.ville, data.pays].filter(Boolean).join(', ');
    const idText  = data.type_client === 'physique'
      ? data.personne_physique?.numero_identite
      : data.personne_morale?.numero_rc;

    // Avatar
    const av = $('client-avatar');
    if (av) {
      av.textContent = ini;
      av.className = 'pn-avatar' + (isMorale ? ' morale' : '');
    }

    fill('client-nom',     lbl.name);
    fill('client-cin',     idText);
    fill('client-email',   data.email);
    fill('client-tel',     data.telephone);
    fill('client-adresse', adresse);

    const badge = $('client-type-badge');
    if (badge) {
      badge.textContent = isMorale ? 'Pers. morale' : 'Pers. physique';
      badge.className   = 'pn-badge ' + (isMorale ? 'pn-badge--purple' : 'pn-badge--blue');
    }

    fiche.style.display = 'grid';
  }

  // ═══════════════════════════════════════════════════════════
  //  STEP 2 — DOSSIERS
  // ═══════════════════════════════════════════════════════════

  /** GET /docs/dossiers/clients/<id>/ */
  function fetchDossiers(clientId) {
    unlockSection('step-dossier');
    hideDossierFiche();

    const grid    = $('dossier-grid');
    const addWrap = $('dossier-add-wrap');

    if (!grid) return;

    // skeleton
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

    const statutClass = s => {
      const m = { ouvert: 'ouvert', fermé: 'ferme', en_cours: 'en_cours' };
      return m[s?.toLowerCase()] || '';
    };

    grid.innerHTML = dossiers.map(d => `
      <div class="pn-dossier-card" data-id="${d.id}"
           data-reference="${esc(d.reference_dossier)}"
           data-description="${esc(d.description || '')}"
           data-statut="${esc(d.statut || '')}"
           data-date-ouverture="${esc(d.date_ouverture || '')}"
           data-date-creation="${esc(d.date_creation || '')}"
           onclick="PanelNouveau.onDossierChange(${d.id}, this)"
           tabindex="0"
           onkeydown="if(event.key==='Enter')PanelNouveau.onDossierChange(${d.id}, this)">
        <div class="pn-dossier-card-ref">${esc(d.reference_dossier)}</div>
        <div class="pn-dossier-card-date">
          ${d.date_ouverture ? 'Ouvert le ' + fmtDate(d.date_ouverture) : 'Date inconnue'}
        </div>
        <span class="pn-dossier-card-statut ${statutClass(d.statut)}">${esc(d.statut || '—')}</span>
      </div>`).join('');
  }

  /** User clicked a dossier card */
  function onDossierChange(dossierId, cardEl) {
    _dossierId = dossierId || null;

    // Deselect all cards
    $$('.pn-dossier-card').forEach(c => c.classList.remove('selected'));

    if (!dossierId || !cardEl) {
      hideDossierFiche();
      refreshSubmit();
      return;
    }

    cardEl.classList.add('selected');

    // Read data from card's data-attributes (no extra fetch needed)
    const d = cardEl.dataset;
    fill('dossier-reference',     d.reference);
    fill('dossier-description',   d.description || '—');
    fill('dossier-date-ouverture', fmtDate(d.dateOuverture));
    fill('dossier-date-creation',  fmtDate(d.dateCreation));

    const badge = $('dossier-statut-badge');
    if (badge) {
      badge.textContent = d.statut || '—';
      const cls = { ouvert: 'ouvert', 'fermé': 'ferme', en_cours: 'en_cours' };
      badge.className   = 'pn-statut-badge ' + (cls[d.statut?.toLowerCase()] || '');
    }

    showDossierFiche();
    unlockSection('step-document');
    refreshSubmit();
  }

  function showDossierFiche() { const f = $('dossier-fiche'); if (f) f.style.display = 'grid'; }
  function hideDossierFiche() { const f = $('dossier-fiche'); if (f) f.style.display = 'none'; }

  // ═══════════════════════════════════════════════════════════
  //  STEP 3 — FILE / DRAG & DROP
  // ═══════════════════════════════════════════════════════════

  function onDragOver(e) {
    e.preventDefault();
    $('pn-dropzone')?.classList.add('drag-over');
  }

  function onDragLeave(e) {
    $('pn-dropzone')?.classList.remove('drag-over');
  }

  function onDrop(e) {
    e.preventDefault();
    $('pn-dropzone')?.classList.remove('drag-over');
    const files = e.dataTransfer?.files;
    if (files?.length) handleFile(files[0]);
  }

  function onFileSelect(files) {
    if (files?.length) handleFile(files[0]);
  }

  function handleFile(file) {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSize = 50 * 1024 * 1024; // 50 MB

    if (!allowed.includes(file.type)) {
      showFileError('Format non supporté. Utilisez PDF, JPG ou PNG.');
      return;
    }
    if (file.size > maxSize) {
      showFileError('Fichier trop grand (max 50 Mo).');
      return;
    }

    _file = file;

    // Show preview
    fill('pn-file-name', file.name);
    fill('pn-file-meta', fmtBytes(file.size));
    $('pn-dropzone').style.display    = 'none';
    $('pn-file-preview').style.display = 'flex';

    refreshSubmit();
  }

  function removeFile() {
    _file = null;
    $('pn-dropzone').style.display     = 'block';
    $('pn-file-preview').style.display = 'none';
    $('pn-file-input').value = '';
    $('pn-auto-kw').style.display      = 'none';
    refreshSubmit();
  }

  function showFileError(msg) {
    // TODO: replace with your app's toast/notification system
    alert(msg);
  }

  // ═══════════════════════════════════════════════════════════
  //  RESET
  // ═══════════════════════════════════════════════════════════

  function resetClient() {
    _clientId  = null;
    _dossierId = null;
    _file      = null;

    // Search box
    const inp = $('client-search');
    if (inp) inp.value = '';
    $('client-clear-btn')?.classList.remove('visible');

    // Client fiche
    const fiche = $('client-fiche');
    if (fiche) fiche.style.display = 'none';

    // Dropdown
    closeDropdown();

    // Dossier section
    const grid = $('dossier-grid');
    if (grid) grid.innerHTML = `
      <div class="pn-dossier-empty" id="dossier-empty">
        <svg viewBox="0 0 48 48" fill="none">
          <rect x="8" y="14" width="32" height="26" rx="3" stroke="currentColor" stroke-width="1.5"/>
          <path d="M8 20h32" stroke="currentColor" stroke-width="1.5"/>
          <path d="M16 8l4 6h12l4-6" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>
        <span>Sélectionnez un client pour voir ses dossiers</span>
      </div>`;
    hideDossierFiche();
    $('dossier-add-wrap').style.display = 'none';

    // Document section
    removeFile();
    lockSection('step-dossier');
    lockSection('step-document');

    refreshSubmit();
  }

  // ═══════════════════════════════════════════════════════════
  //  SUBMIT
  // ═══════════════════════════════════════════════════════════

  function submit() {
    if (!_clientId || !_dossierId || !_file) return;

    const formData = new FormData();
    formData.append('client_id',  _clientId);
    formData.append('dossier_id', _dossierId);
    formData.append('document',   _file);
    formData.append('keywords',   $('pn-keywords-input')?.value || '');

    const btn = $('pn-submit-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Envoi en cours…'; }

    const csrf = getCsrfToken();

    fetch('/docs/documents/', {
      method: 'POST',
      headers: csrf ? { 'X-CSRFToken': csrf } : {},
      body: formData,
    })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => {
        // success — redirect or show confirmation
        if (typeof switchPanel === 'function') {
          switchPanel('op', 'dashboard');
        }
      })
      .catch(err => {
        console.error('submit error:', err);
        if (btn) { btn.disabled = false; btn.textContent = 'Enregistrer & Lancer OCR'; }
        showFileError('Erreur lors de l\'envoi. Veuillez réessayer.');
      });
  }

  function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) return meta.getAttribute('content');
    const cookie = document.cookie.split(';')
      .find(c => c.trim().startsWith('csrftoken='));
    return cookie ? cookie.split('=')[1] : null;
  }

  // ═══════════════════════════════════════════════════════════
  //  SKELETONS
  // ═══════════════════════════════════════════════════════════

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

  // ── Generic fill helper ──────────────────────────────────
  function fill(id, value) {
    const el = $(id);
    if (el) el.textContent = value || '—';
  }

  // ═══════════════════════════════════════════════════════════
  //  GLOBAL CLICK — close dropdown when clicking outside
  // ═══════════════════════════════════════════════════════════

  document.addEventListener('click', e => {
    const search = $('client-search');
    const dd     = $('client-dropdown');
    if (!search || !dd) return;
    if (!search.contains(e.target) && !dd.contains(e.target)) {
      closeDropdown();
    }
  });

  // ── Public API ───────────────────────────────────────────
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