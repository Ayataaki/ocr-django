    let currentFile = null;
    let currentOCRResult = null;

    function triggerFileUpload() {
        document.getElementById('scan-file-input').click();
    }

    function handleFileUpload(file) {
        if (!file) return;
        
        currentFile = file;
        
        // Validate file size (50MB max)
        if (file.size > 50 * 1024 * 1024) {
            alert('Le fichier dépasse 50 Mo. Veuillez choisir un fichier plus petit.');
            removeScanFile();
            return;
        }
        
        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            alert('Format non supporté. Veuillez utiliser PDF, JPG ou PNG.');
            removeScanFile();
            return;
        }
        
        // Display file preview
        const previewDiv = document.getElementById('scan-file-preview');
        const fileNameSpan = document.getElementById('scan-file-name');
        const fileSizeSpan = document.getElementById('scan-file-size');
        
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
        const fileType = file.name.split('.').pop().toUpperCase();
        
        fileNameSpan.textContent = file.name;
        fileSizeSpan.textContent = `${fileSizeMB} Mo • ${fileType}`;
        previewDiv.style.display = 'block';
        
        // Enable OCR button
        const ocrBtn = document.getElementById('ocr-launch-btn');
        ocrBtn.disabled = false;
        
        // Add visual feedback to upload zone
        const uploadZone = document.getElementById('scan-upload-zone');
        uploadZone.style.borderColor = 'var(--green)';
        setTimeout(() => {
            uploadZone.style.borderColor = '';
        }, 1000);
    }
    
    function removeScanFile() {
        currentFile = null;
        document.getElementById('scan-file-input').value = '';
        document.getElementById('scan-file-preview').style.display = 'none';
        
        // Disable OCR button
        const ocrBtn = document.getElementById('ocr-launch-btn');
        ocrBtn.disabled = true;
        
        // Reset upload zone style
        const uploadZone = document.getElementById('scan-upload-zone');
        uploadZone.style.borderColor = '';
        
        // Reset OCR viewer to empty state
        resetOCRViewer();
    }
    
    function resetOCRViewer() {
        const viewer = document.getElementById('ocr-viewer');
        const processing = document.getElementById('ocr-processing');
        const result = document.getElementById('ocr-result');
        
        viewer.style.display = 'block';
        processing.style.display = 'none';
        result.style.display = 'none';
        
        viewer.innerHTML = `
            <div class="ocr-empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <path d="M12 18v-4"/>
                    <path d="M8 18v-4"/>
                    <path d="M16 18v-4"/>
                </svg>
                <p>Aucun document traité</p>
                <small>Importez un document puis lancez l'OCR</small>
            </div>
        `;
    }
    
    function startDeviceScan() {
        // Check if browser supports media devices
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            alert('Ouverture du scanner...\n\nNote: Dans une application réelle, cela ouvrirait la caméra pour scanner un document.');
            // In a real implementation, you would integrate with a scanning library
            // or open a modal with camera preview
        } else {
            alert('Votre navigateur ne supporte pas la numérisation directe. Veuillez importer un fichier.');
        }
    }
    
    function launchOCR() {
        if (!currentFile) {
            alert('Veuillez d\'abord importer un fichier.');
            return;
        }
        
        // Show processing state
        const viewer = document.getElementById('ocr-viewer');
        const processing = document.getElementById('ocr-processing');
        const result = document.getElementById('ocr-result');
        
        viewer.style.display = 'none';
        processing.style.display = 'flex';
        result.style.display = 'none';
        
        // Disable OCR button during processing
        const ocrBtn = document.getElementById('ocr-launch-btn');
        ocrBtn.disabled = true;
        ocrBtn.innerHTML = '<div style="width:16px;height:16px;border:2px solid white;border-top-color:transparent;border-radius:50%;animation:spin 0.6s linear infinite;margin-right:8px;"></div> Traitement...';
        
        // Simulate OCR processing (replace with actual API call)
        setTimeout(() => {
            simulateOCRProcessing(currentFile);
        }, 2500);
    }
    
    function simulateOCRProcessing(file) {
        // Mock OCR result based on file name
        const fileName = file.name;
        let extractedText = '';
        let confidence = 95 + Math.floor(Math.random() * 4); // 95-98%
        
        if (fileName.toLowerCase().includes('vente')) {
            extractedText = `ACTE DE VENTE IMMOBILIÈRE

Entre les soussignés :
Monsieur BENALI Mohamed, né le 15 mars 1970 à Casablanca, demeurant au 12 Rue des Lilas, Casablanca, ci-après dénommé "le Vendeur", d'une part,

ET

Madame BENALI Fatima, née le 22 juillet 1975 à Casablanca, demeurant au même domicile, ci-après dénommée "l'Acquéreur", d'autre part,

IL A ÉTÉ CONVENU CE QUI SUIT :

Article 1 : Le Vendeur vend à l'Acquéreur, qui accepte, un appartement situé au 4ème étage du bâtiment ABC, quartier Maârif, Casablanca.

Article 2 : Le prix de vente est fixé à la somme de 2 500 000 MAD (deux millions cinq cent mille dirhams).`;

            currentOCRResult = {
                text: extractedText,
                confidence: confidence,
                keywords: ['BENALI', 'vente', 'appartement', 'Casablanca', 'Maârif', '2 500 000 MAD', 'titre foncier']
            };
        } else if (fileName.toLowerCase().includes('foncier')) {
            extractedText = `TITRE FONCIER N° TF-45871

Province : Casablanca-Settat
Circonscription : Casablanca

PROPRIÉTAIRE : BENALI Mohamed

SITUATION DU BIEN :
Commune : Casablanca
Quartier : Maârif
Adresse : 12 Rue des Lilas

DESCRIPTION :
Appartement de type F3 d'une superficie de 120m², situé au 4ème étage.

CHARGES ET CONDITIONS :
- Aucune hypothèque inscrite
- Aucune saisie en cours`;

            currentOCRResult = {
                text: extractedText,
                confidence: confidence,
                keywords: ['BENALI', 'titre foncier', 'TF-45871', 'Maârif', 'appartement', 'hypothèque']
            };
        } else {
            extractedText = `DOCUMENT NUMÉRISÉ

Document importé : ${file.name}

Type de document : Document non catégorisé

Contenu extrait par OCR :
Ce document a été numérisé et traité par le système OCR.
Le texte extrait peut contenir des erreurs mineures selon la qualité du document original.

Informations détectées :
- Numéro de référence : REF-${Math.floor(Math.random() * 10000)}
- Date d'import : ${new Date().toLocaleDateString('fr-FR')}
- Pages : 1`;

            currentOCRResult = {
                text: extractedText,
                confidence: confidence,
                keywords: ['document numérisé', 'OCR', 'import', `REF-${Math.floor(Math.random() * 10000)}`]
            };
        }
        
        // Display results
        displayOCRResult(currentOCRResult);
    }
    
    function displayOCRResult(result) {
        const viewer = document.getElementById('ocr-viewer');
        const processing = document.getElementById('ocr-processing');
        const resultDiv = document.getElementById('ocr-result');
        const ocrTextContent = document.getElementById('ocr-text-content');
        const ocrConfidence = document.getElementById('ocr-confidence');
        const keywordsList = document.getElementById('ocr-keywords-list');
        
        viewer.style.display = 'none';
        processing.style.display = 'none';
        resultDiv.style.display = 'block';
        
        // Set confidence with color based on value
        ocrConfidence.innerHTML = `${result.confidence}%`;
        const confidenceEl = document.querySelector('.ocr-confidence strong');
        if (result.confidence >= 95) {
            confidenceEl.style.color = 'var(--green)';
        } else if (result.confidence >= 80) {
            confidenceEl.style.color = 'var(--amber)';
        } else {
            confidenceEl.style.color = 'var(--red)';
        }
        
        // Format text with line breaks
        ocrTextContent.innerHTML = result.text.replace(/\n/g, '<br>');
        
        // Display keywords as clickable tags
        keywordsList.innerHTML = result.keywords.map(keyword => 
            `<span class="keyword-tag" onclick="copyToClipboard('${keyword.replace(/'/g, "\\'")}')">${escapeHtml(keyword)}</span>`
        ).join('');
        
        // Re-enable OCR button
        const ocrBtn = document.getElementById('ocr-launch-btn');
        ocrBtn.disabled = false;
        ocrBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                            </svg>
                            Lancer l'OCR`;
        
        // Add success animation
        resultDiv.style.animation = 'fadeIn 0.5s ease';
    }
    
    function copyOCRText() {
        if (currentOCRResult && currentOCRResult.text) {
            navigator.clipboard.writeText(currentOCRResult.text).then(() => {
                // Show temporary notification
                const copyBtn = document.querySelector('.ocr-result-header .btn-icon-only');
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>';
                setTimeout(() => {
                    copyBtn.innerHTML = originalHTML;
                }, 2000);
            }).catch(err => {
                console.error('Copy failed:', err);
                alert('Impossible de copier le texte');
            });
        }
    }
    
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            // Show quick feedback
            const notification = document.createElement('div');
            notification.textContent = `"${text}" copié !`;
            notification.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: var(--green);
                color: white;
                padding: 8px 16px;
                border-radius: 8px;
                font-size: 12px;
                z-index: 1000;
                animation: fadeIn 0.3s ease;
            `;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 2000);
        });
    }
    
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }
    
    // Drag and drop support
    const uploadZone = document.getElementById('scan-upload-zone');
    
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--accent)';
        uploadZone.style.background = 'rgba(37, 99, 235, 0.05)';
    });
    
    uploadZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = '';
        uploadZone.style.background = '';
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = '';
        uploadZone.style.background = '';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });