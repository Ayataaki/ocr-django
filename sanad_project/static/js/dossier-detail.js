// static/js/DossierDetail.js

const DossierDetail = (function() {
    'use strict';
    
    // ============================================================
    // ÉTAT PRIVÉ
    // ============================================================
    let currentDossierId = null;
    let currentClientId = null;
    let dossiersList = [];
    
    // ============================================================
    // ÉLÉMENTS DOM
    // ============================================================
    let dossierSelect = null;
    let referenceInput = null;
    let dateOuvertureInput = null;
    let descriptionTextarea = null;
    let statutSelect = null;
    let statutContainer = null;
    let detailContainer = null;
    
    // ============================================================
    // INITIALISATION
    // ============================================================
    function init() {
        // Récupérer les éléments DOM
        dossierSelect = document.getElementById('dossier-select');
        referenceInput = document.getElementById('dossier-reference');
        dateOuvertureInput = document.getElementById('dossier-date-ouverture');
        descriptionTextarea = document.getElementById('dossier-description');
        statutSelect = document.getElementById('dossier-statut');
        statutContainer = document.getElementById('dossier-statut-container');
        detailContainer = document.getElementById('dossier-detail-container');
        
        // Initialiser la date par défaut
        if (dateOuvertureInput && !dateOuvertureInput.value) {
            dateOuvertureInput.value = new Date().toISOString().split('T')[0];
        }
        
        // Écouter l'événement de sélection client
        document.addEventListener('clientSelected', function(event) {
            currentClientId = event.detail.clientId;
            if (currentClientId) {
                loadClientDossiers(currentClientId);
            } else {
                clearDossierForm();
            }
        });
        
        // Écouter la création de dossier
        window.addEventListener('dossier-created', function(event) {
            if (event.detail && event.detail.clientId === currentClientId) {
                loadClientDossiers(currentClientId);
            }
        });
    }
    
    // ============================================================
    // FONCTIONS PRINCIPALES
    // ============================================================
    
    /**
     * Charge la liste des dossiers d'un client
     */
    async function loadClientDossiers(clientId) {
        if (!clientId) return;
        
        showDossierLoading();
        
        try {
            const response = await fetch(`/docs/clients/${clientId}/`);
            const data = await response.json();
            
            if (data.success) {
                dossiersList = data.dossiers;
                renderDossierSelect(data.dossiers);
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Impossible de charger les dossiers');
        }
    }
    
    /**
     * Remplit le select avec les dossiers
     */
    function renderDossierSelect(dossiers) {
        if (!dossierSelect) return;
        
        dossierSelect.innerHTML = '<option value="">-- Choisir un dossier --</option>';
        
        if (dossiers.length === 0) {
            dossierSelect.innerHTML = '<option value="">-- Aucun dossier --</option>';
            return;
        }
        
        dossiers.forEach(dossier => {
            const option = document.createElement('option');
            option.value = dossier.id;
            option.textContent = `${dossier.reference} - ${dossier.statut}`;
            dossierSelect.appendChild(option);
        });
    }
    
    /**
     * Charge les détails d'un dossier spécifique
     * (Fonction appelée par onchange du select)
     */
    async function load(dossierId) {
        if (!dossierId) {
            clearDossierForm();
            return;
        }
        
        try {
            const response = await fetch(`/docs/dossiers/${dossierId}/`);
            const data = await response.json();
            
            if (data.success) {
                fillDossierForm(data.dossier);
                currentDossierId = dossierId;
            } else {
                clearDossierForm();
            }
        } catch (error) {
            console.error('Error:', error);
            clearDossierForm();
        }
    }
    
    /**
     * Remplit le formulaire avec les données du dossier
     */
    function fillDossierForm(dossier) {
        if (referenceInput) referenceInput.value = dossier.reference || '';
        if (descriptionTextarea) descriptionTextarea.value = dossier.description || '';
        if (dateOuvertureInput && dossier.date_ouverture) {
            dateOuvertureInput.value = dossier.date_ouverture.split('T')[0];
        }
        if (statutSelect) statutSelect.value = dossier.statut || 'actif';
        if (statutContainer) statutContainer.style.display = 'block';
        
        // Afficher les détails supplémentaires
        showDossierDetails(dossier);
    }
    
    /**
     * Affiche un panneau de détails
     */
    // function showDossierDetails(dossier) {
    //     if (!detailContainer) return;
        
    //     detailContainer.style.display = 'block';
    //     detailContainer.innerHTML = `
    //         <div class="dossier-info-panel">
    //             <div class="dossier-info-header">
    //                 <span class="dossier-info-title">Dossier sélectionné</span>
    //                 <button class="dossier-clear-btn" onclick="DossierDetail.clear()">
    //                     ✕
    //                 </button>
    //             </div>
    //             <div class="dossier-info-content">
    //                 <p><strong>Référence:</strong> ${escapeHtml(dossier.reference)}</p>
    //                 <p><strong>Statut:</strong> ${dossier.statut}</p>
    //                 ${dossier.description ? `<p><strong>Description:</strong> ${escapeHtml(dossier.description)}</p>` : ''}
    //             </div>
    //         </div>
    //     `;
    // }
    function showDossierDetails(dossier) {
        if (!detailContainer) return;

        detailContainer.style.display = 'block';
        detailContainer.innerHTML = `
            <div class="dossier-detail-card">
            <div class="dossier-detail-header">
                <span class="dossier-detail-title">Dossier sélectionné</span>
                <button class="dossier-clear-btn" onclick="DossierDetail.clear()">✕</button>
            </div>
            <div class="dossier-detail-body">
                <div class="dossier-detail-field">
                <label>Référence</label>
                <span>${escapeHtml(dossier.reference)}</span>
                </div>
                <div class="dossier-detail-field">
                <label>Statut</label>
                <span>${dossier.statut}</span>
                </div>
                ${dossier.description ? `
                <div class="dossier-detail-field">
                <label>Description</label>
                <span>${escapeHtml(dossier.description)}</span>
                </div>` : ''}
            </div>
            </div>
        `;
    }

    /**
     * Efface le formulaire
     */
    function clearDossierForm() {
        if (referenceInput) referenceInput.value = '';
        if (descriptionTextarea) descriptionTextarea.value = '';
        if (dateOuvertureInput) {
            dateOuvertureInput.value = new Date().toISOString().split('T')[0];
        }
        if (statutContainer) statutContainer.style.display = 'none';
        if (detailContainer) detailContainer.style.display = 'none';
        
        currentDossierId = null;
    }
    
    /**
     * Efface la sélection (appelable depuis l'extérieur)
     */
    function clear() {
        if (dossierSelect) dossierSelect.value = '';
        clearDossierForm();
    }
    
    /**
     * Crée un nouveau dossier
     */
    async function create(reference, description, dateOuverture, statut = 'actif') {
        if (!currentClientId) {
            throw new Error('Veuillez d\'abord sélectionner un client');
        }
        
        const response = await fetch('/api/dossiers/create/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({
                client_id: currentClientId,
                reference: reference,
                description: description || '',
                date_ouverture: dateOuverture,
                statut: statut
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        // Recharger la liste
        await loadClientDossiers(currentClientId);
        
        // Sélectionner le nouveau dossier
        if (dossierSelect && data.dossier) {
            dossierSelect.value = data.dossier.id;
            await load(data.dossier.id);
        }
        
        return data.dossier;
    }
    
    // ============================================================
    // FONCTIONS UTILITAIRES
    // ============================================================
    function showDossierLoading() {
        if (dossierSelect) {
            dossierSelect.disabled = true;
            dossierSelect.innerHTML = '<option value="">Chargement...</option>';
        }
    }
    
    function getCsrfToken() {
        const name = 'csrftoken';
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith(name + '='));
        return cookieValue ? cookieValue.split('=')[1] : '';
    }
    
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    // ============================================================
    // API PUBLIQUE
    // ============================================================
    return {
        init: init,
        load: load,
        clear: clear,
        create: create,
        getCurrentId: () => currentDossierId,
        getCurrentClientId: () => currentClientId
    };
})();

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
    DossierDetail.init();
});