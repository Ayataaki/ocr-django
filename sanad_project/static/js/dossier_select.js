/**
 * dossier_select.js
 * Charge et affiche les dossiers d'un client sélectionné.
 *
 * Même pattern que client_detail.js :
 *  - Aucun innerHTML de blocs complexes
 *  - Manipulation DOM ciblée via data-field et dataset
 *  - API publique exposée via constante globale DossierSelect
 *
 * Dépendances :
 *  - Appelé par NouveauDossier.onClientChange()
 *  - Appelle NouveauDossier.onDossierSelect() après sélection
 */

const DossierSelect = (() => {

  // ── État interne ──────────────────────────────────────
  let _clientId  = null;   // client courant
  let _dossiers  = [];     // liste brute reçue de l'API

  // ── Helpers DOM ───────────────────────────────────────
  const $ = id => document.getElementById(id);

  // Tous les états possibles → un seul visible à la fois
  const STATES = {
    loading: 'dossier-state-loading',
    found:   'dossier-state-found',
    empty:   'dossier-state-empty',
    error:   'dossier-state-error',
  };

  function showSection() {
    const s = $('section-dossier');
    if (s) s.style.display = 'block';
  }

  function hideSection() {
    const s = $('section-dossier');
    if (s) s.style.display = 'none';
  }

  function showState(name) {
    Object.values(STATES).forEach(id => {
      const el = $(id);
      if (el) el.style.display = (id === STATES[name]) ? '' : 'none';
    });
    showSection();
  }

  // ── Formatage ─────────────────────────────────────────
  const fmtDate = iso => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR');
  };

  const STATUT_LABELS = {
    actif:    'Actif',
    cloture:  'Clôturé',
    archive:  'Archivé',
    suspendu: 'Suspendu',
  };

  const STATUT_CSS = {
    actif:    'badge-statut actif',
    cloture:  'badge-statut cloture',
    archive:  'badge-statut archive',
    suspendu: 'badge-statut suspendu',
  };

  // ── Construire le <select> ────────────────────────────
  // Aucun innerHTML — on crée des <option> avec new Option()
  // et on stocke les données en dataset.
  function buildSelect(dossiers) {
    const sel = $('dossier-select');
    if (!sel) return;

    // Vider sauf la première option placeholder
    while (sel.options.length > 1) sel.remove(1);

    dossiers.forEach(d => {
      const label = `${d.reference_dossier}  ·  ${STATUT_LABELS[d.statut] || d.statut}`;
      const opt   = new Option(label, d.id);

      // Toutes les données stockées en data-attributes
      // → pas besoin de refetcher lors de la sélection
      opt.dataset.reference      = d.reference_dossier;
      opt.dataset.statut         = d.statut;
      opt.dataset.dateOuverture  = d.date_ouverture  || '';
      opt.dataset.dateCreation   = d.date_creation   || '';
      opt.dataset.description    = d.description     || '';

      sel.add(opt);
    });

    // Mettre à jour le compteur affiché dans le label
    const counter = $('dossier-count-label');
    if (counter) {
      counter.textContent = `(${dossiers.length} dossier${dossiers.length > 1 ? 's' : ''})`;
    }
  }

  // ── Remplir la fiche du dossier sélectionné ──────────
  // Manipulation ciblée via data-field — aucun innerHTML global.
  function showFiche(dataset) {
    const fiche = $('dossier-fiche');
    if (!fiche) return;

    if (!dataset) {
      fiche.style.display = 'none';
      return;
    }

    // Chaque champ est ciblé par son attribut data-field
    fiche.querySelector('[data-field="reference"]').textContent =
      dataset.reference || '—';

    fiche.querySelector('[data-field="date_ouverture"]').textContent =
      fmtDate(dataset.dateOuverture);

    fiche.querySelector('[data-field="date_creation"]').textContent =
      fmtDate(dataset.dateCreation);

    fiche.querySelector('[data-field="description"]').textContent =
      dataset.description || '—';

    // Badge statut — uniquement className + textContent, pas de HTML
    const badge = fiche.querySelector('[data-field="statut-badge"]');
    badge.textContent = STATUT_LABELS[dataset.statut] || dataset.statut || '—';
    badge.className   = STATUT_CSS[dataset.statut] || 'badge-statut';

    fiche.style.display = 'block';
  }

  // ── API publique ──────────────────────────────────────

  /**
   * Charge les dossiers d'un client.
   * Appelé par NouveauDossier.onClientChange(clientId).
   * @param {number|string} clientId
   */
  async function load(clientId) {
    _clientId = clientId;
    _dossiers = [];

    if (!clientId) { reset(); return; }

    showState('loading');
    hideFiche();

    try {
      const res  = await fetch(`/docs/dossiers/clients/${clientId}/`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      _dossiers  = data.dossiers || [];

      if (!_dossiers.length) {
        showState('empty');
        return;
      }

      buildSelect(_dossiers);
      showState('found');

    } catch (err) {
      console.error('DossierSelect.load:', err);
      showState('error');
    }
  }

  /**
   * Appelé par onchange du <select> dossier.
   * Remplit la fiche et notifie NouveauDossier.
   * @param {HTMLSelectElement} sel
   */
  function onSelect(sel) {
    const opt = sel.options[sel.selectedIndex];

    if (!opt || !opt.value) {
      hideFiche();
      // Désactiver l'étape suivante
      if (window.NouveauDossier) NouveauDossier.onDossierChange(null);
      return;
    }

    showFiche(opt.dataset);

    // Notifier l'orchestrateur
    if (window.NouveauDossier) {
      NouveauDossier.onDossierChange({
        id:             opt.value,
        reference:      opt.dataset.reference,
        statut:         opt.dataset.statut,
        dateOuverture:  opt.dataset.dateOuverture,
        description:    opt.dataset.description,
      });
    }
  }

  /**
   * Après création d'un nouveau dossier via le modal :
   * recharge la liste et présélectionne le nouveau dossier.
   * @param {{ id, reference_dossier, statut, date_ouverture, description }} dossier
   */
  function selectNewDossier(dossier) {
    load(_clientId).then(() => {
      const sel = $('dossier-select');
      if (!sel) return;
      sel.value = dossier.id;
      onSelect(sel);
    });
  }

  /**
   * Masquer la fiche sans réinitialiser le select.
   */
  function hideFiche() {
    const fiche = $('dossier-fiche');
    if (fiche) fiche.style.display = 'none';
  }

  /**
   * Masquer la fiche et remettre le select à zéro.
   * Appelé par le bouton ✕ dans la fiche.
   */
  function resetFiche() {
    hideFiche();
    const sel = $('dossier-select');
    if (sel) sel.selectedIndex = 0;
    if (window.NouveauDossier) NouveauDossier.onDossierChange(null);
  }

  /**
   * Réinitialisation complète (changement de client).
   * Appelé par ClientDetail.reset() ou NouveauDossier.reset().
   */
  function reset() {
    _clientId = null;
    _dossiers = [];
    hideFiche();

    const sel = $('dossier-select');
    if (sel) {
      while (sel.options.length > 1) sel.remove(1);
      sel.selectedIndex = 0;
    }

    const counter = $('dossier-count-label');
    if (counter) counter.textContent = '';

    hideSection();
    if (window.NouveauDossier) NouveauDossier.onDossierChange(null);
  }

  /**
   * Réessayer après erreur réseau.
   */
  function retry() {
    if (_clientId) load(_clientId);
  }

  return { load, onSelect, selectNewDossier, resetFiche, reset, retry };

})();