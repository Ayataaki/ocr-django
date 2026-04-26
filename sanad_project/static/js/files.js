const searchData=[
  {ref:'DN-2026-0141',client:'BENALI Khalid',type:'Acte notarié',date:'06/04/2026',snippet:'...vente appartement Casablanca TF-45871 2 500 000 MAD Maarif...',keywords:['BENALI','vente','appartement','Casablanca','TF-45871']},
  {ref:'DN-2026-0138',client:'TAZI Mohamed',type:'Titre foncier',date:'05/04/2026',snippet:'...titre foncier TF-45200 terrain 300m² Ain Sebaa...',keywords:['TAZI','TF-45200','terrain','Ain Sebaa']},
  {ref:'DN-2026-0132',client:'CHRAIBI Sara',type:'Contrat vente',date:'04/04/2026',snippet:'...contrat vente villa Casablanca 3 800 000 MAD...',keywords:['CHRAIBI','villa','Casablanca','contrat']},
  {ref:'DN-2025-0987',client:'ALAMI Youssef',type:'Procuration',date:'12/12/2025',snippet:'...procuration générale représentation légale...',keywords:['ALAMI','procuration','légale']},
];

// function doLogin(){
//   const role=document.getElementById('login-role').value;
//   showScreen(role==='admin'?'admin':'op');
// }
// function quickLogin(role){
//   showScreen(role==='admin'?'admin':'op');
// }


const titles = {
  dashboard:'Tableau de bord',
  utilisateurs:'Utilisateurs',
  documents:'Documents',
  clients:'Clients',
  nvDoc:'Nouveau document',
  nouveau:'Nouveau dossier',
  journal:"Journal d'accès",
  parametres:"Paramètres",
};

function show(id,el){
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(n=>n.classList.remove('active'));
  document.getElementById('panel-'+id).classList.add('active');
  if(el)el.classList.add('active');
  document.getElementById('topbar-title').textContent=titles[id]||id;
}

let currentModal=null;
function openModal(id){
  if(currentModal)document.getElementById('modal-'+currentModal).style.display='none';
  currentModal=id;
  document.getElementById('modal-'+id).style.display='block';
  document.getElementById('overlay').classList.add('open');
}
function closeModal(){
  if(currentModal)document.getElementById('modal-'+currentModal).style.display='none';
  document.getElementById('overlay').classList.remove('open');
  currentModal=null;
  document.getElementById('modal-overlay').style.display='none';
}

document.getElementById('overlay').addEventListener('click',function(e){
  if(e.target===this)closeModal();
});

function openDocModal(ref, client, type, date) {
    document.getElementById('doc-modal-title').textContent = ref + ' — ' + client;
    document.getElementById('doc-type').textContent = type;
    document.getElementById('doc-date').textContent = date;
    showModal('view-doc');
}

function showScreen(s){
  document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
  document.getElementById(s+'-screen').classList.add('active');
}

function switchPanel(screen,panel){
  document.querySelectorAll('#'+screen+'-screen .panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('#'+screen+'-screen .nav-item').forEach(n=>n.classList.remove('active'));
  const p=document.getElementById(screen+'-panel-'+panel);
  if(p)p.classList.add('active');
  const titles={
    dashboard:'Tableau de bord',
    nouveau:'Nouveau dossier',
    recherche:'Recherche documentaire',
    scan:'Scanner & OCR',
    clients:'Gestion des clients',
    documents:'Documents',
    overview:'Vue d\'ensemble',
    users:'Utilisateurs',
    logs:'Journaux d\'accès',
    storage:'Stockage & Backup',
    config:'Configuration'
  };
  const t=document.getElementById(screen+'-panel-title');
  if(t)t.textContent=titles[panel]||panel;
  event.currentTarget&&event.currentTarget.classList.add('active');
}

function showModal(id){
  const ov=document.getElementById('modal-overlay');
  ov.style.display='flex';
  document.querySelectorAll('.modal').forEach(m=>m.style.display='none');
  const m=document.getElementById('modal-'+id);
  if(m)m.style.display='block';
}

function doSearch(q){
  if(!q.trim()){return}
  switchPanel('op','recherche');
  switchPanel('op','nouveau');
  setTimeout(()=>{
    const ql=q.toLowerCase();
    const res=searchData.filter(d=>
      d.ref.toLowerCase().includes(ql)||
      d.client.toLowerCase().includes(ql)||
      d.keywords.some(k=>k.toLowerCase().includes(ql))||
      d.snippet.toLowerCase().includes(ql)
    );
    document.getElementById('search-empty').style.display='none';
    const rc=document.getElementById('results-count');
    const rl=document.getElementById('results-list');
    document.getElementById('search-results').style.display='block';
    rc.textContent=res.length+' résultat(s) pour "'+q+'"';
    rl.innerHTML=res.map(r=>`
      <div class="result-item" onclick="showModal('view-doc')">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div class="result-title">${r.ref} — ${r.client}</div>
          <span class="badge badge-green" style="margin-left:8px">Indexé</span>
        </div>
        <div class="result-meta"><span>${r.type}</span><span>${r.date}</span></div>
        <div class="result-snippet">${r.snippet.replace(new RegExp(q,'gi'),m=>'<mark>'+m+'</mark>')}</div>
        <div style="margin-top:6px">${r.keywords.map(k=>'<span class="keyword-tag">'+k+'</span>').join('')}</div>
      </div>`).join('')||'<div style="padding:20px;text-align:center;color:var(--text3)">Aucun document trouvé pour "'+q+'"</div>';
  },50);
}

function simulateScan(){
  document.getElementById('scan-preview').style.display='block';
  document.getElementById('auto-keywords').style.display='block';
}

function simulateOCR(){
  const v=document.getElementById('ocr-viewer');
  v.innerHTML='<div style="font-size:12px;color:var(--text3);margin-bottom:8px">Traitement OCR en cours...</div><div class="progress" style="width:200px"><div class="progress-bar" id="ocr-bar" style="width:0%"></div></div>';
  let w=0;
  const iv=setInterval(()=>{
    w+=Math.random()*15;
    if(w>=100){w=100;clearInterval(iv);
      v.innerHTML=`<div style="text-align:left;width:100%">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <span class="badge badge-green">OCR terminé</span>
          <span style="font-size:11px;color:var(--text3)">3 pages — 1 247 mots extraits</span>
        </div>
        <div class="ocr-result">Par devant Maître Harraqi El Mahdi, Notaire à Casablanca, soussigné, a été passé l'acte dont la teneur suit...
M. <strong>BENALI Khalid</strong>, CIN AB123456, demeurant au N°12 rue Ibn Batouta, Casablanca... a vendu l'appartement immatriculé sous le titre foncier N° <strong>TF-45871/C</strong>... pour le prix de <strong>2 500 000 MAD</strong>...</div>
        <div style="margin-top:10px;font-size:11px;color:var(--text3);margin-bottom:5px">Mots-clés extraits automatiquement :</div>
        <div><span class="keyword-tag">BENALI</span><span class="keyword-tag">vente</span><span class="keyword-tag">appartement</span><span class="keyword-tag">Casablanca</span><span class="keyword-tag">TF-45871</span><span class="keyword-tag">2 500 000 MAD</span></div>
      </div>`;
    }
    const b=document.getElementById('ocr-bar');
    if(b)b.style.width=Math.round(w)+'%';
  },120);
}

function submitDossier(){
  simulateScan();
  alert('Dossier créé avec succès ! OCR lancé en arrière-plan.');
}