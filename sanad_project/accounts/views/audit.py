from django.shortcuts import render
from accounts.modules.Client import Client
from docs.modules import Dossier
from accounts.modules.Utilisateur import Utilisateur
from accounts.modules.Audit import AuditLog
from django.contrib import messages
from django.db import IntegrityError

def _base_context(extra=None):
    """Contexte commun à toutes les vues admin."""
    ctx = {
        'clients': Client.objects.all(),
        'journal': AuditLog.objects.select_related('utilisateur').all().order_by('-date_action')[:10],  # Affiche les 10 dernières actions
        'utilisateurs': Utilisateur.objects.select_related('role').all(),
        'dossiers': Dossier.objects.select_related('client').all(),
        'open_modal': None,
        'active_panel': 'journal',
    }
    if extra:
        ctx.update(extra)
    return ctx

def audit_list(request):
    ctx = _base_context({'active_panel': 'journal'})
    return render(request, "dashboards/admin/base.html", ctx)

def create_audit_entry(utilisateur, action, request):
    try:
        AuditLog.objects.create(utilisateur=utilisateur, action=action)
    except IntegrityError as e:
        print(f"Erreur d’intégrité: {e}")
        messages.error(request, "Impossible d’enregistrer l’action dans le journal.")
    except Exception as e:
        print(f"Erreur inattendue: {e}")
        messages.error(request, "Une erreur est survenue lors de la création du journal.")
