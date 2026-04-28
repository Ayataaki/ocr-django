/**
 * client_detail.js
 * Gère l'affichage dynamique des informations client
 * dans le panel "Nouveau dossier".
 */

const ClientDetail = (() => {

  // ── Utilitaires ──────────────────────────────────

  const esc = str =>
    str ? String(str)
           .replace(/&/g,'&amp;')
           .replace(/</g,'&lt;')
           .replace(/>/g,'&gt;') : '';

  const val = (v, cls = '') =>
    v ? `<span class="${cls}">${esc(v)}</span>`
      : `<span class="empty">—</span>`;

  const fmtDate = iso => {
    if (!iso) return null;
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR');
  };

  const fmtMoney = (amount, devise = 'MAD') => {
    if (!amount) return null;
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' ' + devise;
  };

  const initials = (data) => {
    if (data.type_client === 'physique' && data.personne_physique) {
      const pp = data.personne_physique;
      return (pp.prenom[0] || '') + (pp.nom[0] || '');
    }
    if (data.type_client === 'morale' && data.personne_morale) {
      return data.personne_morale.raison_sociale.slice(0, 2).toUpperCase();
    }
    return '?';
  };

  // ── Templates HTML ────────────────────────────────

  function skeletonHTML() {
    return `
      <div class="client-detail-card">
        <div class="client-detail-header">
          <div class="skeleton" style="width:36px;height:36px;border-radius:50%"></div>
          <div style="flex:1;display:flex;flex-direction:column;gap:6px">
            <div class="skeleton" style="width:160px;height:13px;border-radius:4px"></div>
            <div class="skeleton" style="width:100px;height:11px;border-radius:4px"></div>
          </div>
        </div>
        <div class="client-detail-body">
          <div class="client-detail-grid">
            ${Array(6).fill(`
              <div class="client-detail-field">
                <div class="skeleton" style="width:60px;height:9px;border-radius:3px;margin-bottom:4px"></div>
                <div class="skeleton" style="width:90px;height:12px;border-radius:3px"></div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>`;
  }

  function physiqueHTML(data) {
    const pp = data.personne_physique;
    return `
      <div class="client-detail-card">
        <div class="client-detail-header">
          <div class="client-avatar">${esc(initials(data))}</div>
          <div class="client-detail-header-info">
            <div class="client-detail-name">${esc(pp.prenom)} ${esc(pp.nom)}</div>
            <div class="client-detail-sub">
              ${esc(pp.type_identite)} · ${esc(pp.numero_identite)}
            </div>
          </div>
          <span class="badge badge-blue">Pers. physique</span>
          <button class="client-detail-reset" onclick="ClientDetail.reset()"
                  title="Changer de client">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
                 stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="client-detail-body">

          <div class="client-detail-section">
            <div class="client-detail-section-label">Identité</div>
            <div class="client-detail-grid">
              <div class="client-detail-field">
                <label>Nationalité</label>
                ${val(pp.nationalite)}
              </div>
              <div class="client-detail-field">
                <label>Profession</label>
                ${val(pp.profession)}
              </div>
              <div class="client-detail-field">
                <label>Situation familiale</label>
                ${val(pp.situation_familiale)}
              </div>
              <div class="client-detail-field">
                <label>Date de naissance</label>
                ${val(fmtDate(pp.date_naissance))}
              </div>
              <div class="client-detail-field">
                <label>Lieu de naissance</label>
                ${val(pp.lieu_naissance)}
              </div>
            </div>
          </div>

          <div class="client-detail-section">
            <div class="client-detail-section-label">Contact</div>
            <div class="client-detail-grid">
              <div class="client-detail-field">
                <label>Email</label>
                ${val(data.email)}
              </div>
              <div class="client-detail-field">
                <label>Téléphone</label>
                ${val(data.telephone)}
              </div>
              <div class="client-detail-field full">
                <label>Adresse</label>
                ${val([data.adresse, data.code_postal, data.ville, data.pays]
                       .filter(Boolean).join(', '))}
              </div>
            </div>
          </div>

        </div>
      </div>`;
  }

  function moraleHTML(data) {
    const pm = data.personne_morale;
    return `
      <div class="client-detail-card">
        <div class="client-detail-header">
          <div class="client-avatar morale">${esc(initials(data))}</div>
          <div class="client-detail-header-info">
            <div class="client-detail-name">${esc(pm.raison_sociale)}</div>
            <div class="client-detail-sub">
              ${esc(pm.type_societe)} · RC ${esc(pm.numero_rc) || '—'}
            </div>
          </div>
          <span class="badge badge-purple">Pers. morale</span>
          <button class="client-detail-reset" onclick="ClientDetail.reset()"
                  title="Changer de client">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
                 stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="client-detail-body">

          <div class="client-detail-section">
            <div class="client-detail-section-label">Immatriculation</div>
            <div class="client-detail-grid">
              <div class="client-detail-field">
                <label>Registre de Commerce</label>
                ${val(pm.numero_rc, 'mono')}
              </div>
              <div class="client-detail-field">
                <label>Identifiant Fiscal</label>
                ${val(pm.identifiant_fiscal, 'mono')}
              </div>
              <div class="client-detail-field">
                <label>ICE</label>
                ${val(pm.ice, 'mono')}
              </div>
              <div class="client-detail-field">
                <label>N° Patente</label>
                ${val(pm.numero_patente, 'mono')}
              </div>
              <div class="client-detail-field">
                <label>CNSS</label>
                ${val(pm.numero_cnss, 'mono')}
              </div>
              <div class="client-detail-field">
                <label>Capital social</label>
                ${val(fmtMoney(pm.capital_social, pm.devise))}
              </div>
            </div>
          </div>

          <div class="client-detail-section">
            <div class="client-detail-section-label">Représentation légale</div>
            <div class="client-detail-grid">
              <div class="client-detail-field">
                <label>Représentant</label>
                ${val([pm.representant_prenom, pm.representant_nom].filter(Boolean).join(' '))}
              </div>
              <div class="client-detail-field">
                <label>Fonction</label>
                ${val(pm.representant_fonction)}
              </div>
              <div class="client-detail-field">
                <label>Effectif</label>
                ${val(pm.effectif ? pm.effectif + ' employés' : null)}
              </div>
            </div>
          </div>

          <div class="client-detail-section">
            <div class="client-detail-section-label">Contact</div>
            <div class="client-detail-grid">
              <div class="client-detail-field">
                <label>Email</label>
                ${val(data.email)}
              </div>
              <div class="client-detail-field">
                <label>Téléphone</label>
                ${val(data.telephone)}
              </div>
              <div class="client-detail-field full">
                <label>Adresse</label>
                ${val([data.adresse, data.code_postal, data.ville, data.pays]
                       .filter(Boolean).join(', '))}
              </div>
            </div>
          </div>

        </div>
      </div>`;
  }

  // ── API publique ──────────────────────────────────

function loadDossier(clientId){

  const select = document.getElementById("dossier-select");

  // état loading
  select.innerHTML = `<option>Chargement...</option>`;
  select.disabled = true;

  fetch(`/docs/dossiers/clients/${clientId}/`)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(data => {

      select.innerHTML = ""; // reset

      if (data.count === 0) {
        select.innerHTML = `<option value="">Aucun dossier trouvé</option>`;
        return;
      }

      // option par défaut
      select.innerHTML = `<option value="">-- Choisir un dossier --</option>`;

      data.dossiers.forEach(dossier => {

        const option = document.createElement("option");

        option.value = dossier.id;

        option.textContent = `${dossier.reference_dossier} ${
          dossier.date_ouverture 
            ? `— Ouvert le ${formatDate(dossier.date_ouverture)}`
            : ''
        }`;

        select.appendChild(option);
      });

      select.disabled = false;

    })
    .catch(err => {
      console.error(err);

      select.innerHTML = `<option>Erreur de chargement</option>`;
      select.disabled = true;
    });
}

  // function loadDossier(clientId){
    
  //   fetch(`/docs/dossiers/clients/${clientId}/`)
  //     .then(r => {
  //       if (!r.ok) throw new Error(`HTTP ${r.status}`);
  //       return r.json();
  //     })
  //     .then(data => {
        
  //     })
  //     .catch(err => {
  //       console.error('client_detail:', err);
  //       container.innerHTML = `
  //         <div style="background:rgba(240,73,96,.08);border:1px solid rgba(240,73,96,.2);
  //                     border-radius:var(--rad);padding:12px 16px;font-size:12px;color:var(--red)">
  //           Impossible de charger les informations du client.
  //         </div>`;
  //       // DossierSelect.load(clientId);
  //       // if (window.NouveauDossier) NouveauDossier.onClientChange(clientId);
  //     });

  // }

  function load(clientId) {
    const container = document.getElementById('client-detail-container');
    if (!container) return;

    if (!clientId) { 
      reset(); 
      return; 
    }

    // Afficher le skeleton pendant le chargement
    container.innerHTML  = skeletonHTML();
    container.style.display = 'block';

    fetch(`/accounts/clients/${clientId}/`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        
        if (data.type_client === 'physique') {
          container.innerHTML = physiqueHTML(data);
        } else if (data.type_client === 'morale') {
          container.innerHTML = moraleHTML(data);
        }
        if (window.NouveauDossier) NouveauDossier.onClientChange(clientId);

      })
      .catch(err => {
        console.error('client_detail:', err);
        container.innerHTML = `
          <div style="background:rgba(240,73,96,.08);border:1px solid rgba(240,73,96,.2);
                      border-radius:var(--rad);padding:12px 16px;font-size:12px;color:var(--red)">
            Impossible de charger les informations du client.
          </div>`;
        // DossierSelect.load(clientId);
        // if (window.NouveauDossier) NouveauDossier.onClientChange(clientId);
      });
  }

  function onClientChange(clientId){
    if (!clientId){
      reset();
      return;
    }

    // lancer les 2 en parallèle
    load(clientId);         // détail client
    loadDossier(clientId);  // dossiers
  }

  document.getElementById("client-select").addEventListener("change", function(){
    const clientId = this.value;

    if (clientId){
      loadDossier(clientId);
    }
  });

  function reset() {
    const container = document.getElementById('client-detail-container');
    if (container) {
      container.innerHTML  = '';
      container.style.display = 'none';
    }
    const select = document.getElementById('client-select');
    if (select) select.value = '';

    
    // DossierSelect.reset();

    // if (window.NouveauDossier) NouveauDossier.onClientChange(null);

  }

  return { load, reset, onClientChange };

})();


// NEW CODE INSERTED WISHING THAT IT WORKS , IF IT DOES PLEASE REMOVE THE CODE ABOVE 


const PanelNouveau = (() => {

  // ── État ─────────────────────────────────────────
  let _clientId  = null;
  let _dossierId = null;

  // ── Utilitaires DOM ──────────────────────────────
  const $ = id => document.getElementById(id);

  const fmtDate = iso => iso
    ? new Date(iso).toLocaleDateString('fr-FR')
    : '—';

  // ── Étape 1 : changement de client ───────────────
  function onClientChange(clientId) {
    _clientId  = clientId || null;
    _dossierId = null;

    // Réinitialiser le select dossier
    resetDossierSelect();
    hideDossierFiche();

    if (!clientId) {
      resetClientFiche();
      return;
    }

    // Lancer les deux fetches en parallèle
    fetchClientFiche(clientId);
    fetchDossiers(clientId);
  }

  // ── Fiche client ─────────────────────────────────
  function resetClientFiche() {
    const c = $('client-detail-container');
    if (c) { c.innerHTML = ''; c.style.display = 'none'; }
  }

  function fetchClientFiche(clientId) {
    const container = $('client-detail-container');
    if (!container) return;

    // Skeleton
    container.style.display = 'block';
    container.innerHTML = skeletonHTML();

    fetch(`/accounts/clients/${clientId}/`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => renderClientFiche(data))
      .catch(() => {
        container.innerHTML =
          '<p style="color:var(--red);font-size:12px">Erreur de chargement.</p>';
      });
  }

  function renderClientFiche(data) {
    const container = $('client-detail-container');
    if (!container) return;

    // Vider et remplir uniquement les champs via data-field
    // On garde le HTML statique dans le template, on ne l'injecte pas ici
    // → Stratégie : chaque champ a un data-field dans le HTML

    // Construire la fiche en remplissant les champs data-field
    fillField('client-nom',      data.type_client === 'physique'
      ? `${data.personne_physique?.prenom} ${data.personne_physique?.nom}`
      : data.personne_morale?.raison_sociale);

    fillField('client-cin',      data.type_client === 'physique'
      ? data.personne_physique?.numero_identite
      : data.personne_morale?.numero_rc);

    fillField('client-email',    data.email);
    fillField('client-tel',      data.telephone);
    fillField('client-adresse',  [data.adresse, data.ville, data.pays]
                                   .filter(Boolean).join(', '));

    // Badge type
    const badge = $('client-type-badge');
    if (badge) {
      badge.textContent = data.type_client === 'physique'
        ? 'Pers. physique' : 'Pers. morale';
      badge.className = 'badge ' + (data.type_client === 'physique'
        ? 'badge-blue' : 'badge-purple');
    }

    container.style.display = 'block';
  }

  function fillField(id, value) {
    const el = $(id);
    if (el) el.textContent = value || '—';
  }

  // ── Étape 2 : dossiers ────────────────────────────
  function resetDossierSelect() {
    const sel = $('dossier-select');
    if (!sel) return;
    while (sel.options.length > 1) sel.remove(1);
    sel.disabled = true;
    sel.options[0].textContent = '— Choisir un dossier —';
  }

  function fetchDossiers(clientId) {
    const sel = $('dossier-select');
    if (!sel) return;

    sel.options[0].textContent = 'Chargement...';
    sel.disabled = true;

    fetch(`/docs/dossiers/clients/${clientId}/`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => buildDossierSelect(data.dossiers || []))
      .catch(() => {
        sel.options[0].textContent = 'Erreur de chargement';
      });
  }

  function buildDossierSelect(dossiers) {
    const sel = $('dossier-select');
    if (!sel) return;

    // Vider sauf le placeholder
    while (sel.options.length > 1) sel.remove(1);

    if (!dossiers.length) {
      sel.options[0].textContent = 'Aucun dossier — créez-en un';
      sel.disabled = true;
      return;
    }

    sel.options[0].textContent = '— Choisir un dossier —';

    dossiers.forEach(d => {
      const opt = new Option(
        `${d.reference_dossier}  ·  Ouvert le ${fmtDate(d.date_ouverture)}`,
        d.id
      );
      // Stocker les données en data-attributes
      opt.dataset.reference    = d.reference_dossier;
      opt.dataset.description  = d.description || '';
      opt.dataset.statut       = d.statut;
      opt.dataset.dateOuverture= d.date_ouverture || '';
      opt.dataset.dateCreation = d.date_creation  || '';
      sel.add(opt);
    });

    sel.disabled = false;
  }

  // ── Étape 2 : sélection d'un dossier ─────────────
  function onDossierChange(dossierId) {
    _dossierId = dossierId || null;

    if (!dossierId) { hideDossierFiche(); return; }

    const sel = $('dossier-select');
    const opt = sel?.options[sel.selectedIndex];
    if (!opt) return;

    // Remplir la fiche via data-field — aucun innerHTML
    fillField('dossier-reference',     opt.dataset.reference);
    fillField('dossier-description',   opt.dataset.description || '—');
    fillField('dossier-date-ouverture',fmtDate(opt.dataset.dateOuverture));
    fillField('dossier-date-creation', fmtDate(opt.dataset.dateCreation));

    const badge = $('dossier-statut-badge');
    if (badge) {
      badge.textContent = opt.dataset.statut || '—';
      badge.className   = 'badge-statut ' + (opt.dataset.statut || '');
    }

    showDossierFiche();
  }

  function showDossierFiche() {
    const f = $('dossier-fiche');
    if (f) f.style.display = 'block';
  }

  function hideDossierFiche() {
    const f = $('dossier-fiche');
    if (f) f.style.display = 'none';
  }

  // ── Reset client ──────────────────────────────────
  function resetClient() {
    _clientId  = null;
    _dossierId = null;
    const sel = $('client-select');
    if (sel) sel.value = '';
    resetClientFiche();
    resetDossierSelect();
    hideDossierFiche();
  }

  // ── Skeleton HTML (minimal, pas de logique) ───────
  function skeletonHTML() {
    return `<div style="display:flex;flex-direction:column;gap:8px;padding:12px">
      <div class="skeleton" style="width:160px;height:13px;border-radius:4px"></div>
      <div class="skeleton" style="width:120px;height:11px;border-radius:4px"></div>
    </div>`;
  }

  return { onClientChange, onDossierChange, resetClient };

})();