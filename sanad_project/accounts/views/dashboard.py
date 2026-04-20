from django.shortcuts import render
from accounts.modules.Client import Client
from accounts.modules.Utilisateur import Utilisateur
from docs.modules.Dossier import Dossier
from accounts.modules.Audit import AuditLog

def admin_dashboard(request):
    context = {
        'journal': AuditLog.objects.select_related('utilisateur').all().order_by('-date_action')[:10],  # Affiche les 10 dernières actions
        'clients': Client.objects.all(),
        'utilisateurs': Utilisateur.objects.select_related('role').all(),
        'dossiers': Dossier.objects.select_related('client').all(),
        'open_modal': None,
        'active_panel': 'dashboard',
    }
    return render(request, "dashboards/admin/base.html", context)

# def operateur_dashboard(request):
#     return render(request, "dashboards/operateur/dashboard.html")

def operateur_dashboard(request):
    context = {
        'journal': AuditLog.objects.select_related('utilisateur').all().order_by('-date_action')[:10],  # Affiche les 10 dernières actions
        'clients': Client.objects.all(),
        'utilisateurs': Utilisateur.objects.select_related('role').all(),
        'dossiers': Dossier.objects.select_related('client').all(),
        'open_modal': None,
        'active_panel': 'dashboard',
    }
    return render(request, "dashboards/operateur/base.html", context)

# we don't have the admin dashboard yet, so we can redirect to the utilisateur list for now
# def admin_dashboard(request): 
#     return render(request, "dashboards/admin/dashboard.html")