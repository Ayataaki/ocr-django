from django.shortcuts import render, redirect, get_object_or_404
from accounts.modules.Client import Client
from docs.modules import Dossier
from accounts.modules.Audit import AuditLog
from accounts.modules.Utilisateur import Utilisateur
from django.contrib import messages

def _base_context(extra=None):
    """Contexte commun à toutes les vues admin."""
    ctx = {
        'clients': Client.objects.all(),
        'journal': AuditLog.objects.select_related('utilisateur').all().order_by('-date_action')[:10],  # Affiche les 10 dernières actions
        'utilisateurs': Utilisateur.objects.select_related('role').all(),
        'dossiers': Dossier.objects.select_related('client').all(),
        'open_modal': None,
        'active_panel': 'clients',
    }
    if extra:
        ctx.update(extra)
    return ctx

def client_list(request):
    ctx = _base_context({'active_panel': 'clients'})
    return render(request, "dashboards/admin/base.html", ctx)


def client_create_admin(request):
    if request.method == "POST":
        nom            = request.POST.get("nom", "").strip()
        prenom         = request.POST.get("prenom", "").strip()
        email          = request.POST.get("email", "").strip()
        telephone      = request.POST.get("telephone", "").strip()
        profession     = request.POST.get("profession", "").strip()
        type_identite  = request.POST.get("type_identite", "").strip()
        numero_identite= request.POST.get("numero_identite", "").strip()
        date_naissance = request.POST.get("date_naissance") or None

        # Validation minimale
        if not nom or not email or not numero_identite:
            messages.error(request, "Nom, email et numéro d'identité sont obligatoires.")
            ctx = _base_context({'open_modal': 'add-client', 'active_panel': 'clients'})
            return render(request, "dashboards/admin/base.html", ctx)

        try:
            Client.objects.create(
                nom=nom, 
                prenom=prenom, 
                email=email,
                telephone=telephone, 
                profession=profession,
                type_identite=type_identite,
                numero_identite=numero_identite,
                date_naissance=date_naissance,
            )
            messages.success(request, "Client créé avec succès.")
            # return redirect("client_list")
            return redirect("admin_dashboard")


        except Exception as e:
            messages.error(request, f"Erreur : {e}")
            ctx = _base_context({'open_modal': 'add-client', 'active_panel': 'clients'})
            return render(request, "dashboards/admin/base.html", ctx)

    # return redirect("client_list")
    return redirect("admin_dashboard")


def client_create_operateur(request):
    if request.method == "POST":
        nom            = request.POST.get("nom", "").strip()
        prenom         = request.POST.get("prenom", "").strip()
        email          = request.POST.get("email", "").strip()
        telephone      = request.POST.get("telephone", "").strip()
        profession     = request.POST.get("profession", "").strip()
        type_identite  = request.POST.get("type_identite", "").strip()
        numero_identite= request.POST.get("numero_identite", "").strip()
        date_naissance = request.POST.get("date_naissance") or None

        # Validation minimale
        if not nom or not email or not numero_identite:
            messages.error(request, "Nom, email et numéro d'identité sont obligatoires.")
            ctx = _base_context({'open_modal': 'add-client', 'active_panel': 'clients'})
            return render(request, "dashboards/operateur/base.html", ctx)

        try:
            Client.objects.create(
                nom=nom, 
                prenom=prenom, 
                email=email,
                telephone=telephone, 
                profession=profession,
                type_identite=type_identite,
                numero_identite=numero_identite,
                date_naissance=date_naissance,
            )
            messages.success(request, "Client créé avec succès.")
            # return redirect("client_list")
            return redirect("operateur_dashboard")


        except Exception as e:
            messages.error(request, f"Erreur : {e}")
            ctx = _base_context({'open_modal': 'add-client', 'active_panel': 'clients'})
            return render(request, "dashboards/operateur/base.html", ctx)

    # return redirect("client_list")
    return redirect("operateur_dashboard")
