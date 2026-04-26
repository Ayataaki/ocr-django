from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages

import hashlib
from django.core.files.storage import FileSystemStorage

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


def upload_document(request):
    if request.method == "POST":

        file = request.FILES.get("file")
        dossier_id = request.POST.get("dossier")

        fs = FileSystemStorage(location="media/documents")
        filename = fs.save(file.name, file)

        path = fs.path(filename)

        # hash
        sha256 = hashlib.sha256(file.read()).hexdigest()

        # OCR (simulation pour maintenant)
        extracted_text = "Texte OCR simulé"

        doc = Document.objects.create(
            nom_fichier=filename,
            chemin_fichier=path,
            hash_sha256=sha256,
            full_text=extracted_text,
            statut="complet"
        )

        return JsonResponse({"status": "ok"})