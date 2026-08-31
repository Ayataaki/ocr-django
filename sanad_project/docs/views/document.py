from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
import os
import hashlib
from django.views.decorators.http import require_POST
from django.core.files.storage import FileSystemStorage
from django.conf import settings

from accounts.modules.Utilisateur import Utilisateur
from accounts.modules.Client import Client
from docs.modules.Dossier import Dossier
from docs.modules.Document import Document



def _base_context(extra=None):
    ctx = {
        'clients': Client.objects.all(),
        'utilisateurs': Utilisateur.objects.select_related('role').all(),
        'dossiers': Dossier.objects.select_related('client').all(),
        'open_modal': None,
        'documents': Dossier.objects.select_related('client').all(),
        'active_panel': 'documents',
        'nouveau': 'nouveau',
    }
    if extra:
        ctx.update(extra)
    return ctx

def dossier_list(request):
    ctx = _base_context({'active_panel': 'documents'})
    return render(request, "dashboards/admin/base.html", ctx)


@require_POST
def create_document(request):
    file = request.FILES.get('document')

    if not file:
        return JsonResponse({"error": "Fichier manquant"}, status=400)

    # ── 1. Infos fichier ─────────────────────────────
    nom_fichier = file.name
    taille = file.size

    # ── 2. Calcul SHA256 ─────────────────────────────
    sha256 = hashlib.sha256()
    for chunk in file.chunks():
        sha256.update(chunk)
    hash_hex = sha256.hexdigest()

    # Vérifier doublon
    if Document.objects.filter(hash_sha256=hash_hex).exists():
        return JsonResponse({"error": "Document déjà existant"}, status=400)

    # ── 3. Sauvegarde fichier ────────────────────────
    upload_dir = os.path.join(settings.MEDIA_ROOT, "documents")
    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(upload_dir, nom_fichier)

    with open(file_path, 'wb+') as destination:
        for chunk in file.chunks():
            destination.write(chunk)

    # ── 4. Détection type simple ─────────────────────
    ext = os.path.splitext(nom_fichier)[1].lower()

    if ext == ".pdf":
        doc_type = "pdf"
    elif ext in [".jpg", ".jpeg", ".png"]:
        doc_type = "image"
    else:
        doc_type = "autre"

    # ── 5. Création Document ─────────────────────────
    doc = Document.objects.create(
        titre=nom_fichier,
        chemin_fichier=file_path,
        nom_fichier=nom_fichier,
        hash_sha256=hash_hex,
        taille_bytes=taille,
        type=doc_type,
        statut="en attente",
        upload_par=request.user if request.user.is_authenticated else None
    )

    # ── 6. (Optionnel) lancer OCR async ──────────────
    # launch_ocr_task.delay(doc.id)

    return JsonResponse({
        "success": True,
        "document_id": doc.id
    })

# def upload_document(request):
    # if request.method == "POST":

    #     file = request.FILES.get("file")
    #     dossier_id = request.POST.get("dossier")

    #     fs = FileSystemStorage(location="media/documents")
    #     filename = fs.save(file.name, file)

    #     path = fs.path(filename)

    #     # hash
    #     sha256 = hashlib.sha256(file.read()).hexdigest()

    #     # OCR (simulation pour maintenant)
    #     extracted_text = "Texte OCR simulé"

    #     doc = Document.objects.create(
    #         nom_fichier=filename,
    #         chemin_fichier=path,
    #         hash_sha256=sha256,
    #         full_text=extracted_text,
    #         statut="complet"
    #     )

    #     return JsonResponse({"status": "ok"})