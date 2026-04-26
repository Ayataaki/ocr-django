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

  return { load, reset };

})();