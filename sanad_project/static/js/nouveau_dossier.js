/**
 * nouveau_dossier.js
 * Orchestrateur du panel "Nouveau dossier".
 *
 * Responsabilité unique : gérer l'état global du panel
 * et coordonner les trois modules :
 *   ClientDetail   → affichage fiche client
 *   DossierSelect  → sélection / chargement dossiers
 *   FileManager    → gestion fichiers locaux
 *
 * Ce fichier ne fait JAMAIS de manipulation DOM directe
 * autre que show/hide des sections et du bouton submit.
 */

const NouveauDossier = (() => {

  // ── État global ──────────────────────────────────────
  const state = {
    clientId:  null,   // id du client sélectionné
    dossierId: null,   // id du dossier sélectionné (null = nouveau)
    readyToSubmit: false,
  };

  // ── Helpers ──────────────────────────────────────────
  const $ = id => document.getElementById(id);

  function showSection(id) {
    const el = $(id);
    if (el) el.style.display = 'block';
  }

  function hideSection(id) {
    const el = $(id);
    if (el) el.style.display = 'none';
  }

  function toggleSubmit(show) {
    const btn = $('btn-submit');
    if (btn) btn.style.display = show ? 'inline-flex' : 'none';
    state.readyToSubmit = show;
  }

  // ── Handlers appelés par les modules ─────────────────

  /**
   * Appelé par onchange du <select> client.
   * Déclenche le chargement de la fiche client ET des dossiers.
   * @param {string} clientId
   */
  function onClientChange(clientId) {
    state.clientId  = clientId || null;
    state.dossierId = null;

    // Masquer tout ce qui est en aval
    hideSection('section-dossier');
    hideSection('section-documents');
    hideSection('section-keywords');
    toggleSubmit(false);

    // Déléguer à chaque module
    ClientDetail.load(clientId);    // affiche la fiche client
    DossierSelect.load(clientId);   // charge et affiche les dossiers
  }

  /**
   * Appelé par DossierSelect.onSelect() et DossierSelect.selectNewDossier().
   * Déverrouille l'étape 3 si un dossier est choisi.
   * @param {{ id, reference, statut, dateOuverture, description }|null} dossier
   */
  function onDossierChange(dossier) {
    state.dossierId = dossier ? dossier.id : null;

    if (dossier) {
      showSection('section-documents');
      showSection('section-keywords');
      toggleSubmit(true);
    } else {
      hideSection('section-documents');
      hideSection('section-keywords');
      toggleSubmit(false);
    }
  }

  /**
   * Appelé par FileManager quand des fichiers sont ajoutés/retirés.
   * @param {File[]} files
   */
  function onFilesChange(files) {
    // Afficher la section mots-clés seulement si des fichiers sont présents
    if (files.length > 0) {
      showSection('section-keywords');
    }
    // Le bouton submit reste actif dès qu'un dossier est sélectionné
  }

  // ── Soumission ────────────────────────────────────────

  /**
   * Construit le FormData et envoie via fetch.
   * Aucune navigation — réponse JSON uniquement.
   */
  async function submit() {
    if (!state.readyToSubmit) return;

    if (!state.clientId) {
      alert('Veuillez sélectionner un client.');
      return;
    }

    const btn = $('btn-submit');
    if (btn) {
      btn.disabled     = true;
      btn.textContent  = 'Enregistrement...';
    }

    const fd = new FormData();
    fd.append('csrfmiddlewaretoken', getCsrf());
    fd.append('client_id',  state.clientId);
    fd.append('dossier_id', state.dossierId || '');

    // Champs dossier (si nouveau)
    const refInput  = document.querySelector('[name="reference_dossier"]');
    const descInput = document.querySelector('[name="description"]');
    if (refInput)  fd.append('reference_dossier', refInput.value.trim());
    if (descInput) fd.append('description',        descInput.value.trim());

    // Mots-clés
    const kwInput = $('keywords-input');
    if (kwInput) fd.append('mots_cles', kwInput.value.trim());

    // Fichiers
    FileManager.getFiles().forEach(f => fd.append('fichiers', f));

    try {
      const res  = await fetch('/dossiers/create/', { method: 'POST', body: fd });
      const data = await res.json();

      if (data.success) {
        window.location.href = data.redirect || '/';
      } else {
        alert(data.error || 'Une erreur est survenue.');
        if (btn) {
          btn.disabled    = false;
          btn.textContent = 'Enregistrer & Lancer OCR';
        }
      }
    } catch {
      alert('Erreur réseau.');
      if (btn) {
        btn.disabled    = false;
        btn.textContent = 'Enregistrer & Lancer OCR';
      }
    }
  }

  // ── Réinitialisation complète ─────────────────────────

  function reset() {
    state.clientId     = null;
    state.dossierId    = null;
    state.readyToSubmit = false;

    const clientSel = $('client-select');
    if (clientSel) clientSel.value = '';

    ClientDetail.reset();
    DossierSelect.reset();
    FileManager.reset();

    hideSection('section-dossier');
    hideSection('section-documents');
    hideSection('section-keywords');
    toggleSubmit(false);

    // Revenir au dashboard
    if (window.show) show('dashboard', null);
  }

  // ── Utilitaire CSRF ──────────────────────────────────
  function getCsrf() {
    const el = document.querySelector('[name=csrfmiddlewaretoken]');
    return el ? el.value : '';
  }

  return { onClientChange, onDossierChange, onFilesChange, submit, reset };

})();